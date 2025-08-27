# Sevalla Deployment Guide

## Single Container Approach (Recommended for POC)

1. **Go to Sevalla Dashboard**: https://app.sevalla.com/
2. **Connect GitHub Repository**: Link your Bardo repository
3. **Create Single Application Service**:

### All-in-One Bardo Service
- **Name**: `bardo-app`
- **Build**: Root directory with `Dockerfile`
- **Ports**: 3000 (frontend), 8000 (backend), 5432 (database)
- **Environment Variables**:
  ```
  OPENAI_API_KEY=your_openai_key
  NODE_ENV=production
  ```
- **Storage**: 10GB volume → `/app/data`

## Post-Deployment

1. **Load Initial Data**: Use web terminal:
   ```bash
   python backend/cli.py load
   ```

2. **Access Your App**: 
   - App: `https://bardo-app.sevalla.io`
   - API Docs: `https://bardo-app.sevalla.io:8000/docs`

Everything runs in one container - much simpler! 🎭

---

## Alternative: Multi-Service Setup (if you prefer separation)

If you still want separate services, create 3 services:
- **Database**: `ankane/pgvector` image 
- **Backend**: `./backend` build
- **Frontend**: `./frontend` build

But the single container is easier for a POC.