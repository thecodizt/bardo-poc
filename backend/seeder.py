import os
import re
from database import SessionLocal, Story, Profile
from openai import OpenAI

def get_openai_client():
    try:
        return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    except Exception as e:
        print(f"OpenAI client initialization error: {e}")
        return None

def parse_test_stories():
    """Parse test.md file and extract stories"""
    stories = []
    
    try:
        with open("/app/test.md", "r") as f:
            content = f.read()
        
        # Split by story separator
        story_blocks = content.split("---")
        
        for block in story_blocks:
            block = block.strip()
            if not block:
                continue
                
            # Extract year and story using regex
            year_match = re.search(r'\*\*(\d{4})', block)
            story_match = re.search(r'_"(.*?)"_', block, re.DOTALL)
            
            if year_match and story_match:
                year = int(year_match.group(1))
                story_text = story_match.group(1).strip()
                
                stories.append({
                    "year": year,
                    "transcript": story_text,
                    "title": block.split("**")[1].split("**")[0].strip() if "**" in block else f"Story from {year}"
                })
    
    except Exception as e:
        print(f"Error parsing test stories: {e}")
        
    return stories

def generate_embedding(text, client):
    """Generate embedding for text"""
    if client is None:
        # Fallback: simple hash-based dummy embedding
        import hashlib
        import random
        
        # Use text hash as seed for consistent embeddings
        hash_seed = int(hashlib.md5(text.encode()).hexdigest()[:8], 16)
        random.seed(hash_seed)
        return [random.random() for _ in range(1536)]
    
    try:
        response = client.embeddings.create(
            model="text-embedding-ada-002",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Embedding generation failed: {e}")
        # Fallback to dummy embedding
        import random
        return [random.random() for _ in range(1536)]

def seed_database():
    """Seed database with test stories"""
    db = SessionLocal()
    client = get_openai_client()
    
    try:
        # Check if profiles already exist
        existing_profiles = db.query(Profile).count()
        if existing_profiles > 0:
            print(f"Database already has {existing_profiles} profiles. Skipping seeding.")
            return
        
        # Create Steve Jobs profile
        steve_jobs_profile = Profile(
            name="Steve Jobs",
            relation="grandfather",
            avatar_url="https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/256px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg"
        )
        db.add(steve_jobs_profile)
        db.commit()
        db.refresh(steve_jobs_profile)
        print(f"Created profile: {steve_jobs_profile.name} ({steve_jobs_profile.relation})")
        
        # Check if stories already exist
        existing_count = db.query(Story).count()
        if existing_count > 0:
            print(f"Database already has {existing_count} stories. Updating existing stories to link to profile.")
            # Update existing stories to link to Steve Jobs profile
            db.query(Story).update({"profile_id": steve_jobs_profile.id})
            db.commit()
            return
        
        stories = parse_test_stories()
        print(f"Seeding database with {len(stories)} stories for {steve_jobs_profile.name}...")
        
        for story_data in stories:
            embedding = generate_embedding(story_data["transcript"], client)
            
            story = Story(
                profile_id=steve_jobs_profile.id,
                transcript=story_data["transcript"],
                embedding=embedding,
                event_year=story_data["year"],
                audio_path=None
            )
            
            db.add(story)
            print(f"Added story from {story_data['year']}: {story_data['title']}")
        
        db.commit()
        print("Database seeding completed successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()