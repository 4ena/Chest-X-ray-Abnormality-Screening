FROM python:3.14-slim

WORKDIR /app
# Install Python deps
COPY requirements.txt ./api/requirements.txt
RUN pip install -r api/requirements.txt

# Copy source
COPY config.py ./config.py
# COPY src /app/src

# Create models dir (mount or copy .pth here)
# EXPOSE 8000

# CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
