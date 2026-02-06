# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (if any needed for torch/numpy usually)
# and clean up to keep image size small
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app/backend/
COPY backend/requirements.txt ./backend/requirements.txt

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the rest of the backend code
COPY backend ./backend

# Copy the recommendation engine (models and scripts)
COPY recommendation_engine ./recommendation_engine

# Copy dataset.json as it is referenced by recommendation service
COPY dataset.json ./dataset.json
# Also copy serviceAccountKey.json if it exists in backend (it should be there for now)
# Note: In production you'd mount this as a secret volume usage, but for this "Industrial Grade" 
# upgrade of an existing repo, copying it if present is the immediate step. 
# We'll assume the user handles the key placement.

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run the app. 
# We run from /app so "from backend.main" works
CMD ["python", "-m", "backend.main"]
