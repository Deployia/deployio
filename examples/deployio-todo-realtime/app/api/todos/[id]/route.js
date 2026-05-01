import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "todos.db");
let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
  }
  return db;
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { title, completed } = await request.json();
    const database = getDb();
    const now = new Date().toISOString();

    if (title !== undefined) {
      database
        .prepare("UPDATE todos SET title = ?, updatedAt = ? WHERE id = ?")
        .run(title, now, id);
    }
    if (completed !== undefined) {
      database
        .prepare("UPDATE todos SET completed = ?, updatedAt = ? WHERE id = ?")
        .run(completed, now, id);
    }

    const todo = database.prepare("SELECT * FROM todos WHERE id = ?").get(id);
    return NextResponse.json(todo);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const database = getDb();
    database.prepare("DELETE FROM todos WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
