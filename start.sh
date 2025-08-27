#!/bin/bash

# Initialize PostgreSQL if not already done
if [ ! -f /var/lib/postgresql/17/main/postgresql.conf ]; then
    rm -rf /var/lib/postgresql/17/main/*
    su - postgres -c "/usr/lib/postgresql/17/bin/initdb -D /var/lib/postgresql/17/main"
fi

# Start PostgreSQL
service postgresql start
sleep 10

# Wait for PostgreSQL to be fully ready
until su - postgres -c "psql -c 'SELECT 1'" > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 2
done

# Create database and user if they do not exist
su - postgres -c "psql -tc \"SELECT 1 FROM pg_user WHERE usename = 'bardo_user'\" | grep -q 1 || psql -c \"CREATE USER bardo_user WITH SUPERUSER PASSWORD 'bardo_pass';\""
su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = 'bardo_prod'\" | grep -q 1 || createdb -O bardo_user bardo_prod"
su - postgres -c "psql -d bardo_prod -c \"CREATE EXTENSION IF NOT EXISTS vector;\""

echo "Database setup completed."

# Ensure storage directory exists
mkdir -p /app/storage

# Start applications
cd /app/backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
cd /app/frontend && node .next/standalone/server.js &
wait