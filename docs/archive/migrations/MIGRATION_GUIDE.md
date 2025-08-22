# Migration to pyproject.toml

This project has been migrated from `requirements.txt` to `pyproject.toml` for modern Python package management.

## What Changed

- ✅ **Modern packaging**: Using `pyproject.toml` instead of `requirements.txt`
- ✅ **Organized dependencies**: Dependencies are now categorized into logical groups
- ✅ **Tool configuration**: All tool configurations are now in one file
- ✅ **Better version management**: Using compatible version ranges instead of exact pinning
- ✅ **Development tools**: Added modern development tools like `ruff` and `pre-commit`

## Installation Commands

### Basic Installation (Production)
```bash
pip install -e .
```

### Development Installation (Recommended)
```bash
pip install -e ".[dev,test,monitoring]"
```

### Specific Groups
```bash
# Development tools only
pip install -e ".[dev]"

# Testing tools only  
pip install -e ".[test]"

# Monitoring tools only
pip install -e ".[monitoring]"

# Everything
pip install -e ".[all]"
```

## Dependency Groups

### Core Dependencies (always installed)
- FastAPI, Uvicorn, Pydantic
- Supabase client libraries
- Database drivers (asyncpg, psycopg2)
- Authentication & security libraries
- HTTP clients

### Optional Dependencies

#### `dev` - Development Tools
- **black**: Code formatter
- **isort**: Import sorter  
- **mypy**: Type checker
- **ruff**: Modern linter (alternative to flake8)
- **pre-commit**: Git hooks
- **ipython**: Enhanced REPL
- **rich**: Beautiful terminal output

#### `test` - Testing Tools
- **pytest**: Testing framework
- **pytest-cov**: Coverage reporting
- **pytest-asyncio**: Async test support
- **pytest-mock**: Mocking utilities
- **coverage**: Coverage analysis

#### `monitoring` - Production Monitoring
- **datadog**: Datadog integration
- **ddtrace**: Distributed tracing

## Tool Configuration

All tool configurations are now centralized in `pyproject.toml`:

- **Black**: Code formatting (88 char line length)
- **isort**: Import sorting (compatible with Black)
- **mypy**: Type checking with strict settings
- **pytest**: Testing configuration with coverage
- **ruff**: Modern linting (alternative to flake8)

## Usage Examples

### Code Formatting
```bash
python -m black .
python -m isort .
# Or use ruff for both:
python -m ruff format .
```

### Linting
```bash
python -m mypy .
python -m ruff check .
```

### Testing
```bash
python -m pytest
python -m pytest --cov=app
```

### Pre-commit Hooks (Optional)
```bash
pre-commit install
pre-commit run --all-files
```

## Migration Benefits

1. **Modern Standard**: pyproject.toml is the modern Python packaging standard
2. **Better Dependency Management**: Organized into logical groups
3. **Flexible Installation**: Install only what you need
4. **Tool Integration**: All tool configs in one place
5. **Version Flexibility**: Compatible ranges instead of exact pins
6. **Development Experience**: Better tooling for development workflow

## Migration Status

✅ **Migration Complete**: The project has been successfully migrated to `pyproject.toml`

### Files Changed
- ✅ Created `pyproject.toml` with all dependencies and tool configurations
- ✅ Removed `requirements.txt` (backup saved as `requirements.txt.backup`)
- ✅ Removed `pytest.ini` (configurations moved to `pyproject.toml`)
- ✅ Added `.pre-commit-config.yaml` for modern development workflow
- ✅ Created this migration guide

### Backup Files
- `requirements.txt.backup` - Original requirements file (can be removed after confirming migration works)

## Troubleshooting

### Python Version Issues
If you see Python version errors, ensure you're using Python 3.10+:
```bash
python --version  # Should be 3.10+
```

### Dependency Conflicts
If you encounter dependency conflicts, try:
```bash
pip install --upgrade pip
pip install -e ".[dev,test,monitoring]" --force-reinstall
```

### Tool Configuration Issues
All tool configurations are in `pyproject.toml`. If you have old config files (`.flake8`, `setup.cfg`, etc.), they can be removed. 