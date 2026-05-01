import React, { useState, useEffect } from "react";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    genre: "",
    year: "",
    rating: "",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/movies");
      const data = await res.json();
      setMovies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/movies/${editingId}` : "/api/movies";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({
          title: "",
          genre: "",
          year: "",
          rating: "",
          description: "",
        });
        setEditingId(null);
        fetchMovies();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (movie) => {
    setForm(movie);
    setEditingId(movie._id);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this movie?")) {
      try {
        await fetch(`/api/movies/${id}`, { method: "DELETE" });
        fetchMovies();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🎬 Movie CRUD</h1>
        <p>Manage your favorite movies</p>
      </div>

      <div className="form-section">
        <h2>{editingId ? "Edit Movie" : "Add New Movie"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <input
              type="text"
              name="title"
              placeholder="Movie Title"
              value={form.title}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="genre"
              placeholder="Genre"
              value={form.genre}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="year"
              placeholder="Release Year"
              value={form.year}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="rating"
              placeholder="Rating (1-10)"
              min="1"
              max="10"
              step="0.1"
              value={form.rating}
              onChange={handleChange}
              required
            />
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          <button type="submit">
            {editingId ? "Update Movie" : "Add Movie"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({
                  title: "",
                  genre: "",
                  year: "",
                  rating: "",
                  description: "",
                });
              }}
              style={{ background: "#a0aec0", marginLeft: "10px" }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {loading ? (
        <div className="loading">Loading movies...</div>
      ) : movies.length === 0 ? (
        <div className="empty">No movies yet. Add one to get started! 🍿</div>
      ) : (
        <div className="movies-grid">
          {movies.map((movie) => (
            <div key={movie._id} className="movie-card">
              <h3>{movie.title}</h3>
              <div className="movie-info">
                <strong>Genre:</strong> {movie.genre}
              </div>
              <div className="movie-info">
                <strong>Year:</strong> {movie.year}
              </div>
              <div className="movie-info">
                <strong>Rating:</strong>{" "}
                <span className="rating">⭐ {movie.rating}</span>
              </div>
              <div className="movie-info">
                <strong>Description:</strong> {movie.description}
              </div>
              <div className="actions">
                <button className="update" onClick={() => handleEdit(movie)}>
                  Edit
                </button>
                <button
                  className="delete"
                  onClick={() => handleDelete(movie._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
