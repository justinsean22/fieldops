from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENV: str = "dev"
    PROJECT_NAME: str = "FieldOps"
    API_BASE_URL: str = "http://localhost:8000"

settings = Settings()
