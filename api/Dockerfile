FROM python:3.11-slim

WORKDIR /app

# Install Python deps
COPY api/requirements.txt ./api/requirements.txt
RUN pip install --no-cache-dir -r api/requirements.txt

# Copy source
COPY config.py ./config.py
COPY src/ ./src/
COPY api/ ./api/

# Create models dir (mount or copy .pth here)
RUN mkdir -p models

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
