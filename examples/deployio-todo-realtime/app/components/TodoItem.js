export default function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <div className="todo-item">
      <div className="todo-content">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={onToggle}
          className="checkbox"
        />
        <span className={`todo-text ${todo.completed ? "completed" : ""}`}>
          {todo.title}
        </span>
      </div>
      <button onClick={onDelete} className="btn btn-danger">
        ✕
      </button>
    </div>
  );
}

import "./TodoItem.css";
