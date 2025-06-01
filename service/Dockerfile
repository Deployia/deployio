# Backend (FastAPI) Dockerfile - fastapi_server/Dockerfile

# Choose a Python version
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (if any)
# RUN apt-get update && apt-get install -y --no-install-recommends some-package

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on (should match the PORT env var in docker-compose.yml)
# This is the port Uvicorn will listen on inside the container.
EXPOSE 8000

# Command to run your application using Uvicorn
# Make sure your FastAPI app instance is named `app` in `main.py` (or adjust accordingly)
# Example: CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# If your main FastAPI file is, for example, `app/main.py` and the app instance is `my_fastapi_app`,
# the command would be: CMD ["uvicorn", "app.main:my_fastapi_app", "--host", "0.0.0.0", "--port", "8000"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
