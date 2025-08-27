from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProfileCreate(BaseModel):
    name: str
    relation: str
    avatar_url: Optional[str] = None

class ProfileResponse(BaseModel):
    id: int
    name: str
    relation: str
    avatar_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class StoryCreate(BaseModel):
    profile_id: int
    transcript: Optional[str] = None
    event_year: Optional[int] = None

class StoryResponse(BaseModel):
    id: int
    profile_id: int
    transcript: str
    audio_path: Optional[str]
    event_year: Optional[int]
    created_at: datetime
    similarity_score: Optional[float] = None
    profile: Optional[ProfileResponse] = None

    class Config:
        from_attributes = True

class ChatQuery(BaseModel):
    query: str
    profile_id: int

class ChatResponse(BaseModel):
    stories: list[StoryResponse]
    profile: Optional[ProfileResponse] = None