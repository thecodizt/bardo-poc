# Bardo - Timeline & Voice Recall POC

A proof-of-concept application for personal memory timeline with voice recording and AI-powered recall.

## Quick Start

1. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

2. **Start the application:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/docs

## Features

- **Story Upload**: Upload text stories or voice recordings
- **Voice Transcription**: Automatic transcription using Whisper API
- **Semantic Search**: AI-powered search through your memories using embeddings
- **Timeline Filtering**: Search by specific years or time periods
- **Audio Playback**: Play back original voice recordings

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: FastAPI, Python 3.11+
- **Database**: PostgreSQL with pgvector extension
- **AI**: OpenAI API (Whisper, Embeddings, Chat)
- **Containerization**: Docker & docker-compose

## API Endpoints

- `POST /stories` - Upload a story (text or audio)
- `POST /chat` - Query and search memories
- `GET /audio/{filename}` - Serve audio files

## Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `DATABASE_URL` - PostgreSQL connection string (configured in docker-compose)

## Testing

Try these example queries in the chat interface:
- "What happened in 1985?"
- "Tell me about work stories"
- "Any memories from childhood?"

## Development

The application is fully containerized. Each service (frontend, backend, database) runs in its own container with hot reloading enabled for development.