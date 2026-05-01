# Movie CRUD Application - MERN Stack

A full-stack movie management application built with MongoDB, Express, React, and Node.js.

## Features

- ✅ Create, Read, Update, Delete movies
- ✅ View all movies with details (title, genre, year, rating, description)
- ✅ Real-time updates
- ✅ Responsive UI

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Frontend**: React + Vite
- **Deployment**: Docker

## Getting Started

### Local Development

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
npm run dev

# In another terminal, start the server
npm run dev
```

### Docker

```bash
docker build -t movie-crud .
docker run -p 3000:3000 -e MONGODB_URI=mongodb://mongo:27017/movie_crud movie-crud
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string (default: mongodb://localhost:27017/movie_crud)

## API Endpoints

- `GET /api/movies` - Get all movies
- `GET /api/movies/:id` - Get single movie
- `POST /api/movies` - Create movie
- `PUT /api/movies/:id` - Update movie
- `DELETE /api/movies/:id` - Delete movie
