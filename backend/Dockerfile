FROM python:3.13-slim

WORKDIR /app

ENV PYTHONPATH=/app

# Ensure pip is upgraded and no cache is used for requirements installation
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY ./app ./app

EXPOSE 8000

CMD ["ddtrace-run","uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]