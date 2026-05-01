"use client";

import { useState, useEffect } from "react";
import TodoItem from "./components/TodoItem";
import "./page.css";

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch("/api/todos");
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input }),
      });
      const newTodo = await res.json();
      setTodos([newTodo, ...todos]);
      setInput("");
    } catch (err) {
      console.error(err);
    }
  };

  const updateTodo = async (id, updates) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      setTodos(todos.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
      setTodos(todos.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;

  return (
    <div className="container">
      <div className="header">
        <h1>📝 Real-time Todo</h1>
        <p>Stay organized and track your tasks</p>
      </div>

      <form onSubmit={addTodo} className="form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new todo..."
          className="input"
        />
        <button type="submit" className="btn btn-primary">
          Add
        </button>
      </form>

      <div className="filters">
        {["all", "active", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-btn ${filter === f ? "active" : ""}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : filteredTodos.length === 0 ? (
        <div className="empty">
          {filter === "all" && "No todos yet. Add one to get started!"}
          {filter === "active" && "All done! 🎉"}
          {filter === "completed" && "No completed todos yet."}
        </div>
      ) : (
        <div className="todos">
          {filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() =>
                updateTodo(todo.id, { completed: !todo.completed })
              }
              onDelete={() => deleteTodo(todo.id)}
            />
          ))}
        </div>
      )}

      <div className="stats">
        {activeCount} active · {todos.length - activeCount} completed
      </div>
    </div>
  );
}
