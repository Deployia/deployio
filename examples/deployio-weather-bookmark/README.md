# Weather API + Bookmarking Application

A simple weather application that lets you check weather for any city and bookmark your favorites.

## Features

- ✅ Check weather for any city (using wttr.in API)
- ✅ Bookmark your favorite cities
- ✅ View all bookmarked locations with current weather
- ✅ Remove bookmarks
- ✅ Persistent storage with SQLite

## Tech Stack

- **Backend**: FastAPI + Python
- **Database**: SQLite
- **Frontend**: HTML + Vanilla JavaScript
- **External API**: wttr.in (free weather API)
- **Deployment**: Docker

## Getting Started

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```

Visit `http://localhost:8000` in your browser.

### Docker

```bash
docker build -t weather-bookmark .
docker run -p 8000:8000 -v weather-bookmarks:/app/data weather-bookmark
```

Bookmarks are stored in `/app/data/bookmarks.db` inside the container. Mount a volume (as above) or a host path so data survives restarts:

```bash
docker run -p 8000:8000 -v "$(pwd)/data:/app/data" weather-bookmark
```

Inspect the DB while the container is running:

```bash
docker exec -it <container-id> sqlite3 /app/data/bookmarks.db "SELECT * FROM bookmarks;"
```

## API Endpoints

- `GET /api/weather/{city}` - Get weather for a city
- `POST /api/bookmark` - Bookmark a city (JSON: {"city": "London"})
- `DELETE /api/bookmark/{city}` - Remove a bookmarked city
- `GET /api/bookmarks` - Get all bookmarked cities
