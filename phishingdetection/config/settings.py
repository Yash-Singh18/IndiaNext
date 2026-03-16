from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GROQ_API_KEY_TRIAGE: str = ""
    GROQ_API_KEY_DEEP: str = ""
    TRIAGE_MODEL: str = "llama-3.1-8b-instant"
    DEEP_MODEL: str = "llama-3.3-70b-versatile"
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    VIRUSTOTAL_API_KEY: str = ""
    GOOGLE_SAFE_BROWSING_KEY: str = ""
    HOST: str = "0.0.0.0"
    PORT: int = 8001

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
