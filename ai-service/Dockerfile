FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 curl \
    && rm -rf /var/lib/apt/lists/*

# YuNet + LPD-YuNet ONNX (opencv_zoo, MIT)
RUN mkdir -p /app/models \
    && curl -fsSL -o /app/models/face_detection_yunet_2023mar.onnx \
      "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx" \
    && curl -fsSL -o /app/models/license_plate_detection_yunet_2023mar.onnx \
      "https://github.com/opencv/opencv_zoo/raw/main/models/license_plate_detection_yunet/license_plate_detection_yunet_2023mar.onnx"

COPY ai-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY docs/mevzuat /app/docs/mevzuat
COPY ai-service/app /app/app
COPY ai-service/demo /app/demo

ENV PYTHONPATH=/app
ENV DEMO_MODE=true
EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
