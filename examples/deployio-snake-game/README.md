# Snake Game - Full Stack

A classic Snake game with a leaderboard system built with FastAPI backend and React frontend.

## Features

- ✅ Play classic Snake game
- ✅ Real-time score tracking
- ✅ Global leaderboard
- ✅ Save high scores with player names
- ✅ Persistent SQLite storage
- ✅ Mobile responsive

## Tech Stack

- **Backend**: FastAPI + Python
- **Frontend**: React + Vite
- **Database**: SQLite
- **Deployment**: Docker

## Getting Started

### Local Development

```bash
# Backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker build -t snake-game .
docker run -p 8000:8000 -v snake-leaderboard:/app/data snake-game
```

Scores are stored in `/app/data/leaderboard.db` inside the container. Mount a volume (as above) or a host path so data survives restarts:

```bash
docker run -p 8000:8000 -v "$(pwd)/data:/app/data" snake-game
```

Inspect the DB while the container is running:

```bash
docker exec -it <container-id> sqlite3 /app/data/leaderboard.db "SELECT * FROM leaderboard;"
```

Visit `http://localhost:8000`

## API Endpoints

- `GET /api/leaderboard` - Get top 10 high scores
- `POST /api/score` - Save a new score (JSON: {"player_name": "John", "score": 100})
- `GET /health` - Health check

## How to Play

1. Use arrow keys or WASD to control the snake
2. Eat the red food to grow
3. Don't hit the walls or yourself
4. Try to get the highest score!
