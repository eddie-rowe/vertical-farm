# Docker Guide for pyproject.toml Setup

## Available Dockerfiles

### 1. `Dockerfile` (Simple & Current)
- **Best for**: Quick development and current setup
- **Features**: Direct replacement of requirements.txt approach
- **Usage**: `docker build -t vertical-farm-backend .`

### 2. `Dockerfile.optimized` (Recommended)
- **Best for**: Better performance and security
- **Features**: 
  - Optimized layer caching
  - Non-root user
  - Better security practices
- **Usage**: `docker build -f Dockerfile.optimized -t vertical-farm-backend:optimized .`

### 3. `Dockerfile.multistage` (Advanced)
- **Best for**: Both development and production
- **Features**: 
  - Separate dev/prod builds
  - Hot reload in development
  - Minimal production image
- **Usage**: 
  ```bash
  # Development
  docker build -f Dockerfile.multistage --target development -t vertical-farm-backend:dev .
  
  # Production
  docker build -f Dockerfile.multistage --target production -t vertical-farm-backend:prod .
  ```

## Docker Compose Options

### Current Setup (docker-compose.yml)
```bash
docker-compose up
```

### Enhanced Development (docker-compose.dev.yml)
```bash
docker-compose -f docker-compose.dev.yml up
```
- Uses development target from multistage build
- Includes hot reload
- Mounts source code for live updates

## Key Changes from requirements.txt

| **Old Approach** | **New Approach** |
|------------------|------------------|
| `COPY requirements.txt ./` | `COPY pyproject.toml ./` |
| `pip install -r requirements.txt` | `pip install -e .` |
| Single dependency file | Organized dependency groups |
| Exact version pinning | Compatible version ranges |

## Installation Options

### Production (Core dependencies only)
```dockerfile
RUN pip install --no-cache-dir .
```

### All Dependencies (Complete setup)
```dockerfile
RUN pip install --no-cache-dir -e ".[all]"
```
*Installs all dependency groups: monitoring, test, and dev tools*

### Development (All tools included)
```dockerfile
RUN pip install --no-cache-dir -e ".[dev,test,monitoring]"
```

### Specific Groups
```dockerfile
# Just testing tools
RUN pip install --no-cache-dir -e ".[test]"

# Just monitoring
RUN pip install --no-cache-dir -e ".[monitoring]"

# Just development tools
RUN pip install --no-cache-dir -e ".[dev]"
```

## Performance Tips

### 1. **Layer Caching**
Copy `pyproject.toml` before source code to cache dependency installation:
```dockerfile
COPY pyproject.toml ./
RUN mkdir -p app && touch app/__init__.py
RUN pip install -e .
COPY ./app ./app  # This layer changes frequently
```

### 2. **Multi-stage Benefits**
- **Development**: Includes dev tools, hot reload
- **Production**: Minimal dependencies, security hardened

### 3. **Volume Mounting for Development**
```yaml
volumes:
  - ./backend/app:/app/app:ro  # Hot reload
```

## Security Considerations

### Non-root User (Recommended for Production)
```dockerfile
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser
```

### Environment Variables
```dockerfile
ENV PYTHONDONTWRITEBYTECODE=1  # Don't write .pyc files
ENV PYTHONUNBUFFERED=1         # Don't buffer stdout/stderr
```

## Testing the Build

```bash
# Test basic build
docker build -t test-backend .

# Test with specific target
docker build -f Dockerfile.multistage --target development -t test-backend:dev .

# Test run
docker run -p 8000:8000 test-backend

# Test with docker-compose
docker-compose up --build
```

## Troubleshooting

### Common Issues

1. **"No module named 'app'"**
   - Ensure `COPY ./app ./app` comes after dependency installation
   - Check that `pyproject.toml` is copied correctly

2. **Dependencies not found**
   - Verify `pyproject.toml` syntax
   - Check that optional dependencies are installed if needed

3. **Permission errors**
   - Use non-root user in production
   - Set proper ownership with `chown`

### Build Cache Issues
```bash
# Force rebuild without cache
docker build --no-cache -t vertical-farm-backend .

# Clean up
docker system prune -f
```

## Migration Checklist

- ✅ Update Dockerfile to use `pyproject.toml`
- ✅ Test Docker build locally
- ✅ Update docker-compose.yml if needed
- ✅ Test full application startup
- ✅ Verify all dependencies are installed
- ✅ Check development tools work (if using dev image)
- ✅ Update CI/CD pipelines if applicable 