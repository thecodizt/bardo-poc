# CLAUDE.md

## 🎯 Goal
Build a **Timeline + Voice Recall POC** for Bardo using:

- **Frontend**: Next.js (React + TypeScript)
- **Backend**: Python (FastAPI for async APIs)
- **Database**: PostgreSQL
- **Vector Store**: pgvector (Postgres extension for embeddings)
- **AI Layer**: OpenAI API (for embeddings, chat completions, and Whisper transcription)
- **Voice Handling**:
  - Upload voice file
  - Transcription via Whisper API
  - Store transcript + audio file path
  - Retrieve and play audio in recall flow

The app will be fully **dockerized**, orchestrated via **docker-compose** for development, and deployed to **Sevalla** for production. During development, **ngrok** can expose the app for external testing.

---

## 🏗️ High-Level Architecture

```

+----------------+
\|   Next.js UI   |
\| (Upload + Chat)|
+----------------+
|
v
+----------------+
\|  FastAPI API   |
\| (Python)       |
+----------------+
\|   |     |
\|   |     +--> OpenAI API (Embeddings + Chat + Whisper)
\|   |
\|   +--> PostgreSQL (Stories, Metadata, Audio path, Vectors)
|
+--> File Storage (local/Fly.io volume for audio)

```

**Feature Flow:**

1. **Story Capture**
   - User uploads a text story or a voice note.
   - Optional: attach a year or event label.

2. **Processing**
   - If audio → transcribe with Whisper.
   - Generate embeddings for the transcript.
   - Store in Postgres with pgvector: `{id, transcript, embedding, audio_path, year, created_at}`.

3. **Conversation Recall**
   - User enters a query (e.g. *“What happened in 1985?”*).
   - Query is embedded → semantic search in pgvector.
   - Filter results by year/event if mentioned.
   - Return transcript + optional audio link.

4. **Playback**
   - Frontend shows retrieved story.
   - If audio is available, provide a play button to hear the original voice.

---

## 📦 Tech Stack

- **Frontend**
  - Next.js 14 (App Router)
  - TypeScript
  - TailwindCSS for styling
  - ShadCN UI for components
  - Axios for API calls
  - Native HTML5 `<audio>` player

- **Backend**
  - FastAPI (Python 3.11+)
  - SQLAlchemy ORM
  - PostgreSQL with pgvector
  - OpenAI Python SDK (Whisper + Embeddings + Chat)

- **Database**
  - PostgreSQL 15
  - pgvector extension for vector search

- **Containerization**
  - Docker + docker-compose

- **Hosting**
  - Sevalla (production)
  - Ngrok (development tunneling)

---

## ⚙️ Docker Setup

### Directory Structure
```

poc/
    frontend/        # Next.js app
    backend/         # FastAPI app
    db/              # Postgres data volume
    docker-compose.yml
    sevalla.yml
    CLAUDE.md

````

### `docker-compose.yml`
```yaml
version: '3.9'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql+psycopg2://user:password@db:5432/bardo
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./backend/storage:/app/storage  # audio storage

  db:
    image: ankane/pgvector:latest
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: bardo
    ports:
      - "5432:5432"
    volumes:
      - ./db:/var/lib/postgresql/data
````

---

## 🚀 Hosting & Deployment

### 1. Local Development

* Start everything:

  ```bash
  docker-compose up --build
  ```
* Access:

  * Frontend → [http://localhost:3000](http://localhost:3000)
  * Backend → [http://localhost:8000/docs](http://localhost:8000/docs)
* Expose externally:

  ```bash
  ngrok http 3000
  ```

---

### 2. Sevalla Deployment

We will deploy **frontend, backend, and database** to Sevalla.

#### Steps:

1. **Install CLI**

   ```bash
   npm install -g @sevalla/cli
   sevalla login
   ```

2. **Initialize Project**

   ```bash
   sevalla init bardo
   ```

3. **Configure Services**

   Create `sevalla.yml` in project root:

   ```yaml
   project: bardo
   
   services:
     frontend:
       type: web
       path: ./frontend
       build:
         dockerfile: Dockerfile
       env:
         - NEXT_PUBLIC_API_URL=${BACKEND_URL}
       
     backend:
       type: web
       path: ./backend
       build:
         dockerfile: Dockerfile
       env:
         - DATABASE_URL=${DATABASE_URL}
         - OPENAI_API_KEY=${OPENAI_API_KEY}
       volumes:
         - name: audio-storage
           mountPath: /app/storage
           
     database:
       type: postgres
       version: 15
       extensions:
         - pgvector
       env:
         - POSTGRES_USER=${DB_USER}
         - POSTGRES_PASSWORD=${DB_PASSWORD}
         - POSTGRES_DB=bardo
   ```

4. **Configure Storage**

   ```bash
   sevalla storage create audio-storage --size 10GB
   ```

5. **Set Environment Variables**

   ```bash
   sevalla env set OPENAI_API_KEY=sk-xxxx
   sevalla env set DB_USER=user
   sevalla env set DB_PASSWORD=password
   ```

6. **Deploy**

   ```bash
   sevalla deploy
   ```

7. **Access Services**

   ```bash
   # Get service URLs
   sevalla services list
   
   # Set frontend API URL
   sevalla env set BACKEND_URL=https://backend-bardo.sevalla.app
   ```

---

## 🚀 Implementation Steps

### Backend (FastAPI)

* Endpoints:

  * `POST /stories`

    * Accepts text or audio + optional year/event.
    * If audio → transcribe with Whisper.
    * Store transcript + audio path + embedding.
  * `POST /chat`

    * Accepts user query.
    * Embed query → vector search.
    * Return transcript + audio URL.

* Schema:

```sql
CREATE TABLE stories (
  id SERIAL PRIMARY KEY,
  transcript TEXT,
  audio_path TEXT,
  embedding VECTOR(1536),
  event_year INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Frontend (Next.js)

* Pages:

  * `/` → Upload form (text/voice + year/event).
  * `/chat` → Chat interface.
* Components:

  * **UploadForm**: text input + audio upload + year field.
  * **ChatUI**: conversation window with audio playback.

---

## 🧪 Testing Scenarios

1. **Timeline Recall**

   * Upload text memory with `event_year=1985`.
   * Query: *“What happened in 1985?”* → retrieves memory.

2. **Voice Recall**

   * Upload audio: “I moved to Dubai in 2001.”
   * Query: *“Where did you move in 2001?”* → transcript + audio playback.

3. **Semantic Recall**

   * Upload multiple memories.
   * Query: *“Tell me something funny about work.”* → returns semantically related story.

---

## ✅ Deliverables

* **Dockerized** Next.js + FastAPI + Postgres app.
* **Vector search** recall with pgvector.
* **Audio playback** support (stored locally or via Sevalla storage).
* **Sevalla deployment** with:

  * `sevalla.yml` configuration
  * Environment variables and storage setup
  * Managed Postgres with pgvector
* **Demo-ready POC**: upload, recall, playback.


