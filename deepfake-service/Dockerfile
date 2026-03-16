FROM python:3.11-slim

# System deps: ffmpeg (audio extraction), libgl + glib (OpenCV)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg libglib2.0-0 libsm6 libxext6 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# PyTorch CPU-only (keeps image ~1.5 GB instead of ~5 GB)
RUN pip install --no-cache-dir --timeout 600 --retries 5 \
    torch torchvision \
    --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV HF_HOME=/root/.cache/huggingface
# Disable xet protocol — hangs in container environments
ENV HF_HUB_DISABLE_XET=1

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
