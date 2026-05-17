# Real-time Todo Application - Next.js Full-Stack

A modern real-time todo application built with Next.js, featuring persistent storage and real-time updates.

## Features

- ✅ Create, read, update, delete todos
- ✅ Mark todos as complete/incomplete
- ✅ Real-time synchronization
- ✅ Filter todos (all, active, completed)
- ✅ Responsive design
- ✅ Persistent SQLite storage

## Tech Stack

- **Frontend**: React + Next.js
- **Backend**: Next.js API Routes
- **Database**: SQLite
- **Styling**: Tailwind CSS
- **Deployment**: Docker

## Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### Docker

```bash
docker build -t todo-realtime .
docker run -p 3000:3000 -v todo-data:/app/data todo-realtime
```

Todos are stored in `/app/data/todos.db` inside the container. Mount a volume (as above) or a host path so data survives restarts:

```bash
docker run -p 3000:3000 -v "$(pwd)/data:/app/data" todo-realtime
```

Inspect the DB while the container is running:

```bash
docker exec -it <container-id> sqlite3 /app/data/todos.db "SELECT * FROM todos;"
```

## API Endpoints

- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/[id]` - Update todo
- `DELETE /api/todos/[id]` - Delete todo
