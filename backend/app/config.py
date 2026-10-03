import os
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "sentinel_fusion.db")
DEFAULT_STORAGE_PATH = os.path.join(BASE_DIR, "storage")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Sentinel Fusion"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "sentinel_fusion_forensic_jwt_secret_key_2026_secure")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # AI Provider configuration (demo, ollama)
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "demo")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    # Forensic & Storage Settings
    STORAGE_PATH: str = os.getenv("STORAGE_PATH", DEFAULT_STORAGE_PATH)
    OCR_PATH: str = os.getenv("OCR_PATH", "tesseract")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")

    @model_validator(mode="after")
    def normalize_paths(self):
        if self.DATABASE_URL.startswith("sqlite:///./"):
            rel_part = self.DATABASE_URL[12:]
            self.DATABASE_URL = f"sqlite:///{os.path.normpath(os.path.join(BASE_DIR, rel_part))}"
        if not os.path.isabs(self.STORAGE_PATH):
            self.STORAGE_PATH = os.path.normpath(os.path.join(BASE_DIR, self.STORAGE_PATH))
        return self

settings = Settings()
