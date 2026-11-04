from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routers import auth, comments, users, walks

app = FastAPI(
    title="Прогулки вместе — API",
    description="REST API сервиса поиска людей для совместных прогулок",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth.router, users.router, walks.router, comments.router):
    app.include_router(r, prefix="/api")


@app.get("/api/health", tags=["service"])
def health():
    return {"status": "ok"}
