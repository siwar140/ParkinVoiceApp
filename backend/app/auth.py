# app/auth.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, Admin, Patient
from .config import settings

# ============================================================
# CONFIGURATION
# ============================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_admin_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login")
oauth2_patient_scheme = OAuth2PasswordBearer(tokenUrl="/api/patient/login")

# ============================================================
# FONCTIONS DE MOT DE PASSE
# ============================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    '''Vérifier un mot de passe'''
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    '''Hasher un mot de passe'''
    return pwd_context.hash(password)

# ============================================================
# JWT
# ============================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    '''Créer un token JWT'''
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# ============================================================
# AUTH MÉDECIN
# ============================================================

def authenticate_user(db: Session, email: str, password: str):
    '''Authentifier un médecin'''
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    '''Obtenir l'utilisateur connecté'''
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        user_type: str = payload.get("type", "user")
        
        if user_id is None or user_type != "user":
            raise credentials_exception
    except (JWTError, ValueError, TypeError):
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

# Alias pour compatibilité
get_current_doctor = get_current_user

# ============================================================
# AUTH ADMIN
# ============================================================

def authenticate_admin(db: Session, email: str, password: str):
    '''Authentifier un admin'''
    admin = db.query(Admin).filter(Admin.email == email).first()
    if not admin:
        return False
    if not verify_password(password, admin.hashed_password):
        return False
    if not admin.is_active:
        return False
    return admin

def authenticate_patient(db: Session, email: str, password: str):
    patient = db.query(Patient).filter(Patient.email == email).first()
    if not patient or not patient.hashed_password or not patient.is_active:
        return False
    if not verify_password(password, patient.hashed_password):
        return False
    return patient

async def get_current_admin(
    token: str = Depends(oauth2_admin_scheme),
    db: Session = Depends(get_db)
):
    '''Obtenir l'admin connecté'''
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        admin_id: str = payload.get("sub")
        user_type: str = payload.get("type")
        
        if admin_id is None or user_type != "admin":
            raise credentials_exception
    except (JWTError, ValueError, TypeError):
        raise credentials_exception
    
    try:
        admin = db.query(Admin).filter(Admin.id == int(admin_id)).first()
    except (ValueError, TypeError):
        raise credentials_exception
    if admin is None or not admin.is_active:
        raise credentials_exception
    return admin

async def get_current_patient(
    token: str = Depends(oauth2_patient_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate patient credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        patient_id = payload.get("sub")
        if patient_id is None or payload.get("type") != "patient":
            raise credentials_exception
    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    try:
        patient = db.query(Patient).filter(Patient.id == int(patient_id)).first()
    except (ValueError, TypeError):
        raise credentials_exception
    if patient is None or not patient.is_active:
        raise credentials_exception
    return patient
