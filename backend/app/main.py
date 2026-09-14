# app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import time
import os

from .database import init_db
from .routes import auth, doctor, patients, prediction, verification, admin
from .config import settings

# ============================================================
# LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Démarrage
    print("="*80)
    print("🚀 DÉMARRAGE DE ParkinVoice API")
    print("="*80)
    print(f"🌍 Environnement: {settings.ENVIRONMENT}")
    print(f"🐛 Debug: {settings.DEBUG}")
    print(f"📁 Base de données: {settings.DATABASE_URL.split('@')[-1]}")
    print("="*80)
    
    # Initialiser la base
    init_db()
    
    # Créer les dossiers nécessaires
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "profiles"), exist_ok=True)
    
    yield
    
    # Arrêt
    print("🛑 Arrêt de ParkinVoice API")

# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="ParkinVoice API",
    description="API pour l'analyse vocale de la maladie de Parkinson",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
)

# Les fichiers audio restent privés; seules les images de profil sont servies.
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
PROFILE_UPLOAD_DIR = os.path.join(settings.UPLOAD_DIR, "profiles")
os.makedirs(PROFILE_UPLOAD_DIR, exist_ok=True)
app.mount("/uploads/profiles", StaticFiles(directory=PROFILE_UPLOAD_DIR), name="profile_uploads")

# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"],
)

# ============================================================
# MIDDLEWARE DE PERFORMANCE
# ============================================================

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "microphone=(self), camera=()"
    return response

# ============================================================
# GESTION DES ERREURS
# ============================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc), "type": type(exc).__name__}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Erreur interne du serveur"}
    )

# ============================================================
# ROUTES
# ============================================================

app.include_router(auth.router, prefix="/api")
app.include_router(doctor.router, prefix="/api")
app.include_router(patients.router, prefix="/api")
app.include_router(patients.patient_auth_router, prefix="/api")
app.include_router(prediction.router, prefix="/api")
app.include_router(verification.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
async def health_check():
    """Vérification de l'état de l'API"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """Page d'accueil de l'API"""
    return {
        "name": "ParkinVoice API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if not settings.is_production else "disabled"
    }
