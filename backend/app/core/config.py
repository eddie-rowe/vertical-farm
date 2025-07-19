from functools import lru_cache
from typing import Optional, List, Union

from pydantic import field_validator, AnyUrl, BeforeValidator, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal, Annotated


# Helper function to parse CORS origins from a string
def parse_cors(v: Union[str, List[str]]) -> List[str]:
    print(f"DEBUG parse_cors: Input value: {v}, Type: {type(v)}")

    if isinstance(v, str) and not v.startswith("["):
        result = [i.strip() for i in v.split(",")]
        print(f"DEBUG parse_cors: Comma-separated string result: {result}")
        return result
    elif isinstance(
        v, (list, str)
    ):  # str for case when it's already a JSON list string
        # If it's a string that starts with '[', it might be a JSON list string
        if isinstance(v, str) and v.startswith("["):
            try:
                import json

                print(f"DEBUG parse_cors: Attempting to parse JSON string: {v}")
                # Attempt to parse it as JSON, handle if it contains escaped quotes like "[\"http://host\"]"
                # A more robust way might be needed if formats are very diverse
                # For now, assume if it starts with [ and is a string, it *should* be valid JSON or the escaped format
                if (
                    '\\"' in v
                ):  # crude check for escaped quotes from some env var setters
                    print(f"DEBUG parse_cors: Found escaped quotes, replacing...")
                    v = v.replace('\\"', '"')  # replace \" with "
                    print(f"DEBUG parse_cors: After escape replacement: {v}")
                result = json.loads(v)
                print(f"DEBUG parse_cors: JSON parsing successful, result: {result}")
                return result
            except json.JSONDecodeError as e:
                print(f"DEBUG parse_cors: JSON parsing failed: {e}")
                raise ValueError(
                    "BACKEND_CORS_ORIGINS string starts with '[' but is not valid JSON"
                )
        print(f"DEBUG parse_cors: Returning as-is (list): {v}")
        return v  # If it's already a list (e.g., from direct Python usage, not env var)

    print(f"DEBUG parse_cors: Invalid input type")
    raise ValueError("BACKEND_CORS_ORIGINS must be a string or a list of strings")


class Settings(BaseSettings):
    """
    Application settings configuration.

    This class automatically loads environment variables and validates them.
    Settings are loaded in this order (highest to lowest priority):
    1. Environment variables
    2. .env file (searches multiple locations)
    3. Default values
    """

    # Application settings
    APP_NAME: str = "Vertical Farm API"
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Vertical Farm API"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"
    FRONTEND_HOST: Optional[AnyUrl] = None

    # Supabase Configuration (required)
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str  # Service role key for backend operations (bypasses RLS)
    SUPABASE_ANON_KEY: str  # Public anonymous key for RLS operations

    # Optional Supabase JWT Configuration
    SUPABASE_JWT_SECRET: Optional[str] = None
    # SUPABASE_JWKS_URI will be dynamically generated if not set
    SUPABASE_JWKS_URI_OVERRIDE: Optional[str] = None
    SUPABASE_AUDIENCE: str = "authenticated"
    # SUPABASE_ISSUER will be dynamically generated if not set
    SUPABASE_ISSUER_OVERRIDE: Optional[str] = None

    # Database table names (configurable via env vars)
    SUPABASE_TABLE_FARMS: str = "farms"
    SUPABASE_TABLE_USERS: str = "users"
    SUPABASE_TABLE_USER_PERMISSIONS: str = "user_permissions"
    SUPABASE_TABLE_ROWS: str = "rows"
    SUPABASE_TABLE_RACKS: str = "racks"
    SUPABASE_TABLE_SHELVES: str = "shelves"
    SUPABASE_TABLE_SENSOR_DEVICES: str = "sensor_devices"

    # Security settings for JWT (if needed for custom auth)
    SECRET_KEY: str = "dev-secret-key-change-in-production"  # CHANGE THIS!
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # CORS settings
    BACKEND_CORS_ORIGINS: List[AnyUrl] = []

    # Home Assistant Integration settings
    HOME_ASSISTANT_URL: Optional[str] = None
    HOME_ASSISTANT_TOKEN: Optional[str] = None
    HOME_ASSISTANT_ENABLED: bool = False

    # Cloudflare Access settings (for protected Home Assistant instances)
    CLOUDFLARE_SERVICE_CLIENT_ID: Optional[str] = None
    CLOUDFLARE_SERVICE_CLIENT_SECRET: Optional[str] = None
    CLOUDFLARE_ACCESS_PROTECTED: bool = False

    # Configure Pydantic to load from .env files and other settings
    model_config = SettingsConfigDict(
        env_file=[
            ".env",
            "../.env",
            "../../.env",
        ],  # Look in current, parent, and grandparent dirs
        env_file_encoding="utf-8",
        case_sensitive=False,  # Environment variables are typically case-insensitive
        extra="ignore",
        env_ignore_empty=True,
    )

    @field_validator("SUPABASE_URL")
    @classmethod
    def validate_supabase_url(cls, v: str) -> str:
        """Validate that SUPABASE_URL is a valid URL."""
        if not v:
            raise ValueError("SUPABASE_URL must be set")
        # Basic check, AnyUrl will do more thorough validation if needed later
        if not v.startswith(("http://", "https://")):
            raise ValueError("SUPABASE_URL must be a valid HTTP/HTTPS URL")
        return v.rstrip("/")

    @field_validator("SUPABASE_SERVICE_KEY", "SUPABASE_ANON_KEY")
    @classmethod
    def validate_supabase_keys(cls, v: str, info) -> str:
        """Validate that Supabase keys are not empty and have a reasonable length."""
        if not v or len(v.strip()) < 20:  # Typical Supabase keys are longer
            raise ValueError(
                f"{info.field_name} must be a valid non-empty string of sufficient length"
            )
        return v.strip()

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse CORS origins from environment variable string or list."""
        return parse_cors(v)

    @property
    def supabase_jwks_uri(self) -> str:
        """Generate JWKS URI from Supabase URL if not explicitly overridden."""
        if self.SUPABASE_JWKS_URI_OVERRIDE:
            return self.SUPABASE_JWKS_URI_OVERRIDE
        if not self.SUPABASE_URL:  # Should be caught by validator, but good for safety
            raise ValueError(
                "SUPABASE_URL is not set, cannot generate supabase_jwks_uri"
            )
        return f"{self.SUPABASE_URL}/auth/v1/.well-known/jwks.json"

    @property
    def supabase_issuer(self) -> str:
        """Generate issuer from Supabase URL if not explicitly overridden."""
        if self.SUPABASE_ISSUER_OVERRIDE:
            return self.SUPABASE_ISSUER_OVERRIDE
        if not self.SUPABASE_URL:  # Should be caught by validator, but good for safety
            raise ValueError("SUPABASE_URL is not set, cannot generate supabase_issuer")
        return f"{self.SUPABASE_URL}/auth/v1"

    @computed_field
    @property
    def all_cors_origins(self) -> list[str]:
        origins = [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS]
        if self.FRONTEND_HOST:
            origins.append(str(self.FRONTEND_HOST).rstrip("/"))
        return list(
            set(origins)
        )  # Use set to ensure uniqueness if FRONTEND_HOST duplicates an entry


@lru_cache
def get_settings() -> Settings:
    """
    Get cached settings instance.

    Uses lru_cache to ensure settings are only loaded once,
    which is important for performance and consistency.
    This also ensures that environment variables are read only once.
    """
    return Settings()


# Global settings instance for convenience and backward compatibility.
# It's generally recommended to use `Depends(get_settings)` in FastAPI routes.
settings = get_settings()
