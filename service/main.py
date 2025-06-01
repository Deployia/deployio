from fastapi import FastAPI
from pymongo import MongoClient
import os

app = FastAPI()

# Read MongoDB URI from environment variable, default to local Docker instance
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://mongo:27017/myapp_fastapi")
client = MongoClient(MONGO_URI)
db = (
    client.get_default_database()
)  # Or specify your database name: client["mydatabase"]


@app.get("/")
async def root():
    return {"message": "Hello from FastAPI backend!"}


@app.get("/items/")
async def read_items():
    # Example: Fetch items from a 'items' collection
    # items_collection = db["items"]
    # all_items = list(items_collection.find({}, {"_id": 0})) # Exclude MongoDB's _id field
    # return all_items
    return [{"name": "Item 1"}, {"name": "Item 2"}]


# Add more routes and logic as needed

# To run this app (if not using Docker Uvicorn command):
# uvicorn main:app --reload --host 0.0.0.0 --port 8000
