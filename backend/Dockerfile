FROM python:3.13-slim

WORKDIR /app

ENV PYTHONPATH=/app

# Upgrade pip and copy project files
RUN pip install --no-cache-dir --upgrade pip

# Copy pyproject.toml and source code
COPY pyproject.toml ./
COPY ./app ./app

# Install Python dependencies
RUN pip install --no-cache-dir -e .[all]

EXPOSE 8000

CMD ["ddtrace-run","uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]