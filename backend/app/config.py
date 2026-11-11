import os

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg2://walks:walks@localhost:5432/walks"
)
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost,https://localhost,capacitor://localhost").split(",")]
