import sqlite3
import os
from fastapi import FastAPI
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI()

# SQLite lives on disk so scores persist across restarts (local dev + container volumes).
DATA_DIR = os.environ.get("DATA_DIR", "data")
DB_PATH = os.path.join(DATA_DIR, "leaderboard.db")


def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    # Opening the connection creates/touches the file immediately.
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            score INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


init_db()


# Models
class ScoreRequest(BaseModel):
    player_name: str
    score: int


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Save score
@app.post("/api/score")
async def save_score(request: ScoreRequest):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "INSERT INTO leaderboard (player_name, score) VALUES (?, ?)",
        (request.player_name, request.score),
    )
    conn.commit()
    result = c.lastrowid
    conn.close()
    return {"success": True, "id": result}


# Get leaderboard
@app.get("/api/leaderboard")
async def get_leaderboard(limit: int = 10):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "SELECT player_name, score, timestamp FROM leaderboard ORDER BY score DESC LIMIT ?",
        (limit,),
    )
    rows = c.fetchall()
    conn.close()

    return [
        {"rank": i + 1, "player": row[0], "score": row[1], "timestamp": row[2]}
        for i, row in enumerate(rows)
    ]


# Serve static files
@app.get("/")
async def index():
    return FileResponse("static/index.html")


@app.get("/{full_path:path}")
async def serve_static(full_path: str):
    file_path = f"static/{full_path}"
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse("static/index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
