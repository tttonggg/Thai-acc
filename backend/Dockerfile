FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install gunicorn for production
RUN pip install --no-cache-dir gunicorn

# Copy source code
COPY . .

# Set environment
ENV PYTHONPATH=/app/src
ENV ENV=production

# Run migrations on startup and start server with gunicorn + uvicorn workers
CMD gunicorn src.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --workers 4 --timeout 120 --access-logfile - --error-logfile -
