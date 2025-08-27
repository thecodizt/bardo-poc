import os
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import pgvector.sqlalchemy

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://user:password@localhost:5432/bardo")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    relation = Column(String, nullable=False)  # e.g., "grandfather", "mother", "friend"
    avatar_url = Column(String)  # URL or path to avatar image
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to stories
    stories = relationship("Story", back_populates="profile")

class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    transcript = Column(Text)
    audio_path = Column(String)
    embedding = Column(pgvector.sqlalchemy.Vector(1536))
    event_year = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to profile
    profile = relationship("Profile", back_populates="stories")

def create_tables():
    import time
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                conn.commit()
            Base.metadata.create_all(bind=engine)
            print("Database connection established and tables created successfully.")
            return
        except Exception as e:
            retry_count += 1
            print(f"Database connection attempt {retry_count}/{max_retries} failed: {e}")
            if retry_count >= max_retries:
                raise e
            time.sleep(2)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()