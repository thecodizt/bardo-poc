import os
import uuid
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from openai import OpenAI
from typing import Optional

from database import get_db, create_tables, Story, Profile
from models import StoryResponse, ChatQuery, ChatResponse, ProfileCreate, ProfileResponse

app = FastAPI(title="Bardo Timeline & Voice Recall API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/audio", StaticFiles(directory="/app/storage"), name="audio")

def get_openai_client():
    try:
        return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    except Exception as e:
        print(f"OpenAI client initialization error: {e}")
        return None

@app.on_event("startup")
async def startup_event():
    create_tables()

@app.get("/")
async def root():
    return {"message": "Bardo Timeline & Voice Recall API"}

@app.get("/profiles", response_model=list[ProfileResponse])
async def get_profiles(db: Session = Depends(get_db)):
    profiles = db.query(Profile).all()
    return profiles

@app.post("/profiles", response_model=ProfileResponse)
async def create_profile(profile: ProfileCreate, db: Session = Depends(get_db)):
    db_profile = Profile(
        name=profile.name,
        relation=profile.relation,
        avatar_url=profile.avatar_url
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

@app.get("/profiles/{profile_id}", response_model=ProfileResponse)
async def get_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@app.get("/profiles/{profile_id}/stories", response_model=list[StoryResponse])
async def get_profile_stories(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    stories = db.query(Story).filter(Story.profile_id == profile_id).order_by(Story.event_year.asc()).all()
    return stories

@app.post("/stories", response_model=StoryResponse)
async def create_story(
    profile_id: int = Form(...),
    transcript: Optional[str] = Form(None),
    event_year: Optional[int] = Form(None),
    audio: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    final_transcript = transcript
    audio_path = None
    
    if audio:
        audio_filename = f"{uuid.uuid4()}.{audio.filename.split('.')[-1]}"
        audio_path = f"/app/storage/{audio_filename}"
        
        with open(audio_path, "wb") as audio_file:
            content = await audio.read()
            audio_file.write(content)
        
        if not final_transcript:
            try:
                client = get_openai_client()
                if client is None:
                    raise Exception("OpenAI client not available")
                with open(audio_path, "rb") as audio_file:
                    transcription = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file
                    )
                final_transcript = transcription.text
            except Exception as e:
                # Fallback: use filename as transcript for demo purposes
                final_transcript = f"Audio file: {audio.filename}"
    
    if not final_transcript:
        raise HTTPException(status_code=400, detail="Either transcript or audio must be provided")
    
    try:
        client = get_openai_client()
        if client is None:
            raise Exception("OpenAI client not available")
        embedding_response = client.embeddings.create(
            model="text-embedding-ada-002",
            input=final_transcript
        )
        embedding = embedding_response.data[0].embedding
    except Exception as e:
        # Fallback: use dummy embedding for demo purposes
        import random
        embedding = [random.random() for _ in range(1536)]
    
    # Verify profile exists
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    story = Story(
        profile_id=profile_id,
        transcript=final_transcript,
        audio_path=audio_filename if audio_path else None,
        embedding=embedding,
        event_year=event_year
    )
    
    db.add(story)
    db.commit()
    db.refresh(story)
    
    return story

def generate_conversational_response(query: str, relevant_stories: list, profile, client):
    """Generate a conversational response using OpenAI chat"""
    if not client or not profile:
        name = profile.name if profile else "the person"
        return f"Hey there! I've found {len(relevant_stories)} memories from {name} that relate to what you're asking about. Let me share them with you."
    
    try:
        # Build context from relevant stories
        context = f"Here are some relevant memories from {profile.name}:\n\n"
        for i, story in enumerate(relevant_stories, 1):
            year = f" ({story.event_year})" if story.event_year else ""
            context += f"{i}. {story.transcript}{year}\n\n"
        
        # Create a conversational prompt based on the profile
        relation_context = f"You are {profile.name}, the {profile.relation} of the person you're talking to."
        
        system_prompt = f"""You are {profile.name}, speaking from beyond as a digital echo of your memories and stories. 
        You are talking to someone who is exploring the stories and memories you left behind. You are their {profile.relation}.
        
        Respond authentically as {profile.name} would, with the warmth and love appropriate for a {profile.relation}. You should:
        
        - Speak in first person about YOUR memories and experiences
        - Reference specific stories from your life when relevant  
        - Share the wisdom and lessons you learned from those experiences
        - Ask thoughtful questions about what the person thinks or feels about your stories
        - Be encouraging and inspiring, as a loving {profile.relation} would be
        - Connect your past experiences to insights that might help them
        - Use appropriate terms of endearment based on your relationship as their {profile.relation}
        
        Keep responses warm but concise, speaking as the {profile.relation} they are connecting with through these memories."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Context: {context}\n\nUser question: {query}"}
        ]
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=300,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"Conversational response generation failed: {e}")
        return f"Hey there! I found {len(relevant_stories)} memories that relate to what you're asking about. Let me share them with you."

@app.post("/chat", response_model=dict)
async def chat_query(query: ChatQuery, db: Session = Depends(get_db)):
    # Get the profile
    profile = db.query(Profile).filter(Profile.id == query.profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    client = get_openai_client()
    
    try:
        if client is None:
            raise Exception("OpenAI client not available")
        embedding_response = client.embeddings.create(
            model="text-embedding-ada-002",
            input=query.query
        )
        query_embedding = embedding_response.data[0].embedding
    except Exception as e:
        # Fallback: use dummy embedding for demo purposes
        import hashlib
        import random
        
        # Use query hash as seed for consistent embeddings
        hash_seed = int(hashlib.md5(query.query.encode()).hexdigest()[:8], 16)
        random.seed(hash_seed)
        query_embedding = [random.random() for _ in range(1536)]
    
    # Query only stories from this profile
    sql_query = text("""
        SELECT 
            id, profile_id, transcript, audio_path, event_year, created_at,
            1 - (embedding <=> :query_embedding) as similarity_score
        FROM stories 
        WHERE profile_id = :profile_id
        ORDER BY embedding <=> :query_embedding
        LIMIT 5
    """)
    
    result = db.execute(sql_query, {"query_embedding": str(query_embedding), "profile_id": query.profile_id})
    rows = result.fetchall()
    
    stories = []
    for row in rows:
        story_dict = {
            'id': row[0],
            'profile_id': row[1],
            'transcript': row[2],
            'audio_path': row[3],
            'event_year': row[4],
            'created_at': row[5],
            'similarity_score': row[6]
        }
        stories.append(StoryResponse(**story_dict))
    
    # Generate conversational response
    conversational_response = generate_conversational_response(query.query, stories, profile, client)
    
    return {
        "message": conversational_response,
        "stories": stories,
        "profile": ProfileResponse(
            id=profile.id,
            name=profile.name,
            relation=profile.relation,
            avatar_url=profile.avatar_url,
            created_at=profile.created_at
        )
    }