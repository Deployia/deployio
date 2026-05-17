import sqlite3
import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI()

# SQLite lives on disk so bookmarks persist across restarts (local dev + container volumes).
DATA_DIR = os.environ.get("DATA_DIR", "data")
DB_PATH = os.path.join(DATA_DIR, "bookmarks.db")


def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    # Opening the connection creates/touches the file immediately.
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT UNIQUE NOT NULL,
            temperature REAL,
            condition TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


init_db()


# Models
class BookmarkRequest(BaseModel):
    city: str


class WeatherResponse(BaseModel):
    city: str
    temperature: float
    condition: str
    bookmarked: bool


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Get weather from free API
async def get_weather(city: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://wttr.in/{city}?format=j1")
            if response.status_code == 200:
                data = response.json()
                current = data["current_condition"][0]
                return {
                    "temperature": current["temp_C"],
                    "condition": current["weatherDesc"][0]["value"],
                }
            return None
    except Exception as e:
        print(f"Error fetching weather: {e}")
        return None


@app.get("/api/weather/{city}")
async def get_weather_endpoint(city: str):
    weather = await get_weather(city)
    if not weather:
        raise HTTPException(status_code=400, detail="Could not fetch weather")

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id FROM bookmarks WHERE city = ?", (city,))
    bookmarked = c.fetchone() is not None
    conn.close()

    return {
        "city": city,
        "temperature": weather["temperature"],
        "condition": weather["condition"],
        "bookmarked": bookmarked,
    }


@app.post("/api/bookmark")
async def bookmark_weather(request: BookmarkRequest):
    weather = await get_weather(request.city)
    if not weather:
        raise HTTPException(status_code=400, detail="Could not fetch weather")

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute(
            "INSERT INTO bookmarks (city, temperature, condition) VALUES (?, ?, ?)",
            (request.city, weather["temperature"], weather["condition"]),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="City already bookmarked")
    conn.close()

    return {"success": True, "city": request.city}


@app.delete("/api/bookmark/{city}")
async def remove_bookmark(city: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM bookmarks WHERE city = ?", (city,))
    conn.commit()
    conn.close()
    return {"success": True}


@app.get("/api/bookmarks")
async def get_bookmarks():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT city, temperature, condition FROM bookmarks")
    rows = c.fetchall()
    conn.close()

    return [
        {"city": row[0], "temperature": row[1], "condition": row[2]} for row in rows
    ]


# Serve static files
@app.get("/")
async def index():
    return FileResponse("templates/index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
