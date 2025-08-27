import csv
import os
import shutil
from database import SessionLocal, Story, Profile
from openai import OpenAI

def get_openai_client():
    try:
        return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    except Exception as e:
        print(f"OpenAI client initialization error: {e}")
        return None

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

def copy_audio_files():
    """Copy audio files from data directory to storage"""
    source_dir = "/app/data/jobs_speech_clips"
    target_dir = "/app/storage"
    
    # Create storage directory if it doesn't exist
    os.makedirs(target_dir, exist_ok=True)
    
    if not os.path.exists(source_dir):
        print(f"Source audio directory {source_dir} not found")
        return {}
    
    audio_mapping = {}
    for filename in os.listdir(source_dir):
        if filename.endswith(('.mp3', '.wav', '.m4a')):
            source_path = os.path.join(source_dir, filename)
            target_path = os.path.join(target_dir, filename)
            
            try:
                shutil.copy2(source_path, target_path)
                # Map story titles to audio filenames based on content and context
                if "cancer_story" in filename.lower():
                    audio_mapping["Cancer Diagnosis"] = filename
                elif "college_story" in filename.lower():
                    audio_mapping["Dropping Out of Reed"] = filename  
                elif "stay_hungry" in filename.lower():
                    audio_mapping["Introducing the iPhone"] = filename
                elif "intro" in filename.lower():
                    audio_mapping["Apple in the Garage"] = filename
                # Skip jobs_full_raw.mp3 as it's not matched to a specific story
                print(f"Copied audio file: {filename}")
            except Exception as e:
                print(f"Error copying {filename}: {e}")
    
    return audio_mapping

def load_stories_from_csv(clear_existing=False):
    """Load stories from CSV file and populate database"""
    db = SessionLocal()
    client = get_openai_client()
    
    try:
        # Check if data already exists
        existing_profiles = db.query(Profile).count()
        existing_stories = db.query(Story).count()
        
        if existing_profiles > 0 and not clear_existing:
            print(f"Database already has {existing_profiles} profiles and {existing_stories} stories.")
            print("Use load_stories_from_csv(clear_existing=True) to reload data.")
            return
        
        if clear_existing:
            # Clear existing data
            db.query(Story).delete()
            db.query(Profile).delete()
            db.commit()
            print("Cleared existing database data")
        
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
        
        # Copy audio files and get mapping
        audio_mapping = copy_audio_files()
        
        # Load stories from CSV
        csv_path = "/app/data/stories.csv"
        if not os.path.exists(csv_path):
            print(f"CSV file {csv_path} not found")
            return
        
        # First pass: read all CSV data
        csv_data = []
        with open(csv_path, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                if row['transcript'].strip():
                    csv_data.append(row)
        
        # Create text stories
        stories_loaded = 0
        for row in csv_data:
            year = int(row['year']) if row['year'] else None
            title = row['title']
            transcript = row['transcript']
            
            # Generate embedding
            embedding = generate_embedding(transcript, client)
            
            # Create story (text only, no audio)
            story = Story(
                profile_id=steve_jobs_profile.id,
                transcript=transcript,
                embedding=embedding,
                event_year=year,
                audio_path=None
            )
            
            db.add(story)
            stories_loaded += 1
            print(f"Loaded text story: {title} ({year})")
        
        # Create separate audio-only records
        audio_records_loaded = 0
        for title, audio_filename in audio_mapping.items():
            # Find the corresponding story year from CSV data
            story_year = None
            for row in csv_data:
                if row['title'] == title:
                    story_year = int(row['year']) if row['year'] else None
                    break
            
            # Create audio-only record with minimal transcript
            audio_transcript = f"Audio recording: {title}"
            audio_embedding = generate_embedding(audio_transcript, client)
            
            audio_story = Story(
                profile_id=steve_jobs_profile.id,
                transcript=audio_transcript,
                embedding=audio_embedding,
                event_year=story_year,
                audio_path=audio_filename
            )
            
            db.add(audio_story)
            audio_records_loaded += 1
            print(f"Loaded audio recording: {title} ({story_year}) -> {audio_filename}")
        
        db.commit()
        print(f"Successfully loaded {stories_loaded} text stories and {audio_records_loaded} audio recordings from CSV")
        
    except Exception as e:
        print(f"Error loading stories: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    load_stories_from_csv()