from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://localhost:5432/bput_career"
    jwt_secret: str = "dev-secret-change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    google_client_id: str = ""
    google_client_secret: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""
    # --- AI / LLM ---
    # "ollama" for local dev, "groq" in deployment (Render cannot reach a laptop).
    llm_provider: str = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:3b"
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_base_url: str = "https://api.groq.com/openai/v1"
    cloudinary_url: str = ""
    cors_origins: str = ""

    # --- OAuth redirect targets ---
    # Public URL of this API (used to build the provider callback URL) and of the
    # frontend (where the user lands with a token once the callback completes).
    backend_base_url: str = "http://127.0.0.1:8000"
    frontend_base_url: str = "http://localhost:5173"

    # --- Sign-up verification ---
    student_email_domain: str = "bput.ac.in"
    recruiter_blocked_domains: str = "gmail.com,yahoo.com,outlook.com,hotmail.com,icloud.com,protonmail.com,aol.com"
    verification_code_expire_minutes: int = 15

    # --- SMTP (for sending verification codes) ---
    # Leave smtp_host empty to run in dev mode: codes are printed to the backend
    # console instead of emailed, so registration still works without mail setup.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "no-reply@bput-career.local"
    smtp_use_tls: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        if not self.cors_origins.strip():
            return ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"]
        return [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def google_oauth_enabled(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    @property
    def github_oauth_enabled(self) -> bool:
        return bool(self.github_client_id and self.github_client_secret)

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")


settings = Settings()

