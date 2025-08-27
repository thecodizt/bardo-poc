# Sevalla Deployment Guide

## Quick Setup

1. **Go to Sevalla Dashboard**: https://app.sevalla.com/
2. **Connect GitHub Repository**: Link your Bardo repository
3. **Create 3 Services**:

### Database Service
- **Name**: `bardo-postgres`
- **Image**: `ankane/pgvector:latest`
- **Environment Variables**:
  ```
  POSTGRES_USER=bardo_user
  POSTGRES_PASSWORD=your_secure_password
  POSTGRES_DB=bardo_prod
  ```
- **Storage**: 10GB volume → `/var/lib/postgresql/data`

### Backend Service
- **Name**: `bardo-backend`
- **Build**: `./backend` with `Dockerfile`
- **Port**: 8000
- **Environment Variables**:
  ```
  DATABASE_URL=postgresql+psycopg2://bardo_user:your_secure_password@bardo-postgres:5432/bardo_prod
  OPENAI_API_KEY=your_openai_key
  ```
- **Storage**: 5GB volume → `/app/storage`

### Frontend Service
- **Name**: `bardo-frontend` 
- **Build**: `./frontend` with `Dockerfile`
- **Port**: 3000
- **Environment Variables**:
  ```
  NODE_ENV=production
  NEXT_PUBLIC_API_URL=https://bardo-backend.sevalla.io
  ```

## Post-Deployment

1. **Load Initial Data**: Use web terminal on backend container:
   ```bash
   python cli.py load
   ```

2. **Test URLs**:
   - Frontend: `https://bardo-frontend.sevalla.io`
   - Backend: `https://bardo-backend.sevalla.io/docs`

Your Bardo app will be live with Steve Jobs stories and chat! 🎭