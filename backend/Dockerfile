FROM python:3.13.7-slim

WORKDIR /app

ENV PYTHONPATH=/app

# Upgrade pip and copy project files
RUN pip install --no-cache-dir --upgrade pip

# Copy pyproject.toml and source code
COPY pyproject.toml ./
COPY ./app ./app

# Install Python dependencies
RUN pip install --no-cache-dir -e .[all]

# Create non-root user for security
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 --disabled-password appuser

# Change ownership of app directory to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 8000

CMD ["ddtrace-run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]