from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.routes.health import router as health_router
from app.routes.jobs import router as jobs_router
from app.routes.agreements import router as agreements_router

app = FastAPI(title=settings.PROJECT_NAME)

# Upload Router
API_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))  # .../fieldops/api
UPLOADS_DIR = os.path.join(API_DIR, "uploads")  # .../fieldops/api/uploads
os.makedirs(UPLOADS_DIR, exist_ok=True)

app.mount("/_dev/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Allow your Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(jobs_router)
app.include_router(agreements_router)
