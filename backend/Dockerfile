# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /code

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file
COPY backend/requirements.txt ./backend/requirements.txt

# Install packages
RUN pip install --no-cache-dir -r backend/requirements.txt

# Create a non-root user (Hugging Face expects UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy the rest of the backend code and models
COPY --chown=user backend ./backend
COPY --chown=user recommendation_engine ./recommendation_engine
COPY --chown=user dataset.json ./dataset.json

# Hugging Face Spaces uses 7860
EXPOSE 7860

# Run the app.
CMD ["python", "-m", "backend.main"]
