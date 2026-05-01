const express = require("express");
const cors = require("cors");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/movie_crud";

let db;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true })
  .then((client) => {
    console.log("Connected to MongoDB");
    db = client.db("movie_crud");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Get all movies
app.get("/api/movies", async (req, res) => {
  try {
    const movies = await db.collection("movies").find().toArray();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single movie
app.get("/api/movies/:id", async (req, res) => {
  try {
    const movie = await db
      .collection("movies")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create movie
app.post("/api/movies", async (req, res) => {
  try {
    const { title, genre, year, rating, description } = req.body;
    const result = await db.collection("movies").insertOne({
      title,
      genre,
      year,
      rating,
      description,
      createdAt: new Date(),
    });
    res
      .status(201)
      .json({
        _id: result.insertedId,
        title,
        genre,
        year,
        rating,
        description,
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update movie
app.put("/api/movies/:id", async (req, res) => {
  try {
    const { title, genre, year, rating, description } = req.body;
    const result = await db
      .collection("movies")
      .findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            title,
            genre,
            year,
            rating,
            description,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" },
      );
    if (!result.value)
      return res.status(404).json({ error: "Movie not found" });
    res.json(result.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete movie
app.delete("/api/movies/:id", async (req, res) => {
  try {
    const result = await db
      .collection("movies")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Movie not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, "client/dist")));

// React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
