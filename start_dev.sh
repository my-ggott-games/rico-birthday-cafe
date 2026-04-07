#!/bin/bash

set -e

cleanup() {
    local jobs_pids
    jobs_pids=$(jobs -p)
    if [ -n "$jobs_pids" ]; then
        kill $jobs_pids 2>/dev/null || true
    fi
}

trap cleanup EXIT

echo "🎂 Starting Riko's Birthday Cafe Development Environment..."

if [ ! -f ".env" ]; then
    echo "❌ Missing .env file."
    echo "   Copy .env.example to .env and fill in local values first."
    exit 1
fi

if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "❌ Docker Compose is not installed."
    exit 1
fi

# 1. Start Database
echo "🐘 Starting PostgreSQL Database..."
# Clean up old local DB containers for this project before starting again.
$DOCKER_COMPOSE_CMD -f docker-compose.local.yml down --remove-orphans >/dev/null 2>&1 || true

for container_name in rico-birthday-cafe-db rico-db-local; do
    if docker ps -aq -f "name=^${container_name}$" | grep -q .; then
        docker rm -f "$container_name" >/dev/null 2>&1 || true
    fi
done

if lsof -ti tcp:5432 >/dev/null 2>&1; then
    echo "❌ Port 5432 is already in use."
    echo "   Stop the existing PostgreSQL/container using 5432, then run ./start_dev.sh again."
    echo "   Helpful checks: lsof -i :5432, docker ps -a"
    exit 1
fi

if ! $DOCKER_COMPOSE_CMD -f docker-compose.local.yml up -d --remove-orphans; then
    echo "❌ Failed to start Docker. Please make sure Docker Desktop is running!"
    exit 1
fi

# 2. Start Backend
echo "☕ Starting Spring Boot Backend..."
cd backend
./gradlew bootRun &
BACKEND_PID=$!
cd ..

# 3. Start Frontend
echo "🎨 Starting React Frontend..."
cd frontend
npm run dev -- --host &
FRONTEND_PID=$!
cd ..

echo "✅ All services started!"
echo "   - Frontend: http://localhost:5173"
echo "   - Frontend (LAN): http://<your-mac-ip>:5173"
echo "   - Backend:  http://localhost:8080"
echo "   - Database: localhost:5432"
echo ""
echo "Press Ctrl+C to stop all servers."

wait
