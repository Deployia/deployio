#!/bin/bash

# Get the directory of the script
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

# Start client, server, and ai-service in development mode concurrently
cd "$SCRIPT_DIR/client" && npm run dev &
CLIENT_PID=$!

cd "$SCRIPT_DIR/server" && npm run dev &
SERVER_PID=$!

cd "$SCRIPT_DIR/ai-service" && uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level info &
AI_SERVICE_PID=$!

# Wait for all services to exit
wait $CLIENT_PID $SERVER_PID $AI_SERVICE_PID
