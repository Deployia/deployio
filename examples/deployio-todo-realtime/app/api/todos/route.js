import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "todos.db");
let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);
  }
  return db;
}

export async function GET() {
  try {
    const database = getDb();
    const todos = database
      .prepare("SELECT * FROM todos ORDER BY createdAt DESC")
      .all();
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title } = await request.json();
    const database = getDb();
    const id = Date.now().toString();
    const now = new Date().toISOString();

    database
      .prepare(
        "INSERT INTO todos (id, title, completed, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
      )
      .run(id, title, false, now, now);

    const todo = database.prepare("SELECT * FROM todos WHERE id = ?").get(id);
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
