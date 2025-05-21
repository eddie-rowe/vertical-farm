from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "Vertical Farm API"
    DEBUG: bool = False
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None # Usually service role key for backend
    SUPABASE_JWT_SECRET: Optional[str] = None # For direct secret validation, if ever needed
    SUPABASE_JWKS_URI: Optional[str] = None # e.g., "https://<project_ref>.supabase.co/auth/v1/jwks"

    # Placeholder table names, these should be defined based on your actual Supabase setup
    SUPABASE_TABLE_FARMS: str = "farms"
    SUPABASE_TABLE_USERS: str = "users" # Or auth.users if using Supabase Auth
    SUPABASE_TABLE_USER_PERMISSIONS: str = "user_permissions"
    SUPABASE_TABLE_ROWS: str = "rows"
    SUPABASE_TABLE_RACKS: str = "racks"
    SUPABASE_TABLE_SHELVES: str = "shelves"
    
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Vertical Farm API"

    # Security settings for JWT
    SECRET_KEY: str = "a_very_secret_key_that_should_be_in_env_or_kms"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    # Example of how to load from .env file
    # class Config:
    #     env_file = ".env"
    #     env_file_encoding = "utf-8"

settings = Settings() 