# All-in-One Bardo Container
FROM node:18-alpine AS frontend-builder

# Build frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Main container with Python, Node, and PostgreSQL
FROM python:3.11-slim

# Install Node.js and PostgreSQL
RUN apt-get update && apt-get install -y \
    curl \
    postgresql \
    postgresql-contrib \
    postgresql-server-dev-all \
    gcc \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set up PostgreSQL
USER postgres
RUN /etc/init.d/postgresql start && \
    psql --command "CREATE USER bardo_user WITH SUPERUSER PASSWORD 'bardo_pass';" && \
    createdb -O bardo_user bardo_prod && \
    psql -d bardo_prod -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Switch back to root
USER root

# Set up application directory
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-builder /frontend/.next ./frontend/.next
COPY --from=frontend-builder /frontend/package*.json ./frontend/
COPY frontend/next.config.js ./frontend/
# Create public directory and copy if it exists with content
RUN mkdir -p ./frontend/public
COPY --from=frontend-builder /frontend/public ./frontend/public/

# Install frontend production dependencies
WORKDIR /app/frontend
RUN npm install --omit=dev

# Back to app root
WORKDIR /app

# Create storage directory
RUN mkdir -p /app/data/storage

# Set environment variables
ENV DATABASE_URL=postgresql+psycopg2://bardo_user:bardo_pass@localhost:5432/bardo_prod
ENV PYTHONPATH=/app/backend

# Expose ports
EXPOSE 3000 8000 5432

# Create startup script
RUN echo '#!/bin/bash\n\
service postgresql start\n\
cd /app/backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 &\n\
cd /app/frontend && npm start &\n\
wait' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]