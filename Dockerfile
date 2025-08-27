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

# Install Node.js, PostgreSQL, and pgvector
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    postgresql \
    postgresql-contrib \
    postgresql-server-dev-all \
    gcc \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install pgvector extension
RUN cd /tmp \
    && git clone --branch v0.7.4 https://github.com/pgvector/pgvector.git \
    && cd pgvector \
    && make \
    && make install

# Switch back to root (skip DB setup in build, do it at runtime)
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

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]