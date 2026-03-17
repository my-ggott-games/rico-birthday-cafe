#!/bin/bash

# Function to kill all child processes on exit
trap 'kill $(jobs -p)' EXIT

echo "🎂 Starting Rico's Birthday Cafe Development Environment..."

# 1. Start Database
echo "🐘 Starting PostgreSQL Database..."
docker-compose up -d
if [ $? -ne 0 ]; then
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
