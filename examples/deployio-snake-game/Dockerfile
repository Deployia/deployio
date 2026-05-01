FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Build frontend
COPY frontend/ ./frontend_build/
RUN cd frontend_build && npm install && npm run build

# Copy built frontend
RUN mkdir -p static && cp -r frontend_build/dist/* static/

COPY main.py .
COPY leaderboard.db .

ENV ENVIRONMENT=production
ENV PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
