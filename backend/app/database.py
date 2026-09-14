# app/database.py
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# ============================================================
# CONFIGURATION DE LA BASE DE DONNÉES
# ============================================================

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# ============================================================
# CRÉATION DE L'ENGINE
# ============================================================

if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # Configuration PostgreSQL
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,
        echo=settings.DEBUG and not settings.is_production,
    )
    print(f"🐘 PostgreSQL connecté: {SQLALCHEMY_DATABASE_URL.split('@')[-1]}")
else:
    # Fallback SQLite (développement)
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=settings.DEBUG,
    )
    print(f"📁 SQLite connecté: {SQLALCHEMY_DATABASE_URL}")

# ============================================================
# SESSION
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

# ============================================================
# BASE
# ============================================================

Base = declarative_base()

# ============================================================
# FONCTIONS
# ============================================================

def get_db():
    """Obtenir une session de base de données"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialiser la base de données"""
    from .models import Doctor, Patient, Prediction, VerificationCode, Admin
    Base.metadata.create_all(bind=engine)
    _ensure_patient_auth_columns()
    print("✅ Base de données initialisée")

def _ensure_patient_auth_columns():
    columns = {column["name"] for column in inspect(engine).get_columns("patients")}
    statements = []
    if "hashed_password" not in columns:
        statements.append("ALTER TABLE patients ADD COLUMN hashed_password VARCHAR(255)")
    if "is_active" not in columns:
        statements.append("ALTER TABLE patients ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL")
    if statements:
        with engine.begin() as connection:
            for statement in statements:
                connection.execute(text(statement))
