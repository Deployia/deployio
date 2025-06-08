from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
import time

app = FastAPI()

server_start = time.time()

# Read MongoDB URI from environment variable
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://mongo:27017/deployio_shared_dev")


def get_db_connection():
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)  # Added timeout
        # The ismaster command is cheap and does not require auth.
        client.admin.command("ismaster")
        print(f"MongoDB connection successful to {MONGO_URI}.")
        # Get the database name from the URI if present, otherwise default
        db_name = MongoClient(MONGO_URI).get_database().name
        return client[db_name], "connected"
    except ConnectionFailure as e:
        print(f"MongoDB connection failed to {MONGO_URI}: {e}")
        return None, "disconnected"
    except Exception as e:  # Catch other potential errors during client instantiation
        print(f"An error occurred with MongoDB client for {MONGO_URI}: {e}")
        return None, "disconnected"


db, mongodb_connection_status = get_db_connection()


@app.get("/service/v1/health")  # Path for consistency
async def health_check():
    # Re-check status if db was None initially, or provide cached status
    # For a more robust check, you might want to ping the DB on each health request
    current_db, current_status = get_db_connection()
    uptime = time.time() - server_start
    return {
        "service_name": "FastAPI Service",
        "status": "ok",
        "mongodb_status": current_status,
        "uptime": uptime,
    }


@app.get("/service/v1/hello")
async def hello():
    uptime = time.time() - server_start
    return {"message": "Hello from FastAPI Service", "uptime": uptime}
