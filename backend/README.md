# FastAPI Backend

## Setup

1. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

- The API docs will be available at [http://localhost:8000/docs](http://localhost:8000/docs)
- The health check endpoint is at [http://localhost:8000/health](http://localhost:8000/health) 