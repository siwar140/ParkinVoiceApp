# app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from ..database import get_db
from ..schemas import RegisterRequest, LoginRequest, ResetPasswordRequest
from ..auth import (
    authenticate_user, create_access_token, get_password_hash,
    get_current_user
)
from ..models import User
from ..services.email_service import email_service
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=dict)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Inscription d'un nouveau medecin"""
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est deja utilise"
        )
    
    hashed_password = get_password_hash(request.password)
    user = User(
        email=request.email,
        hashed_password=hashed_password,
        full_name=request.full_name,
        phone=request.phone,
        hospital=request.hospital,
        specialty=request.specialty
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "hospital": user.hospital,
        "specialty": user.specialty,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }


@router.post("/login", response_model=dict)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Connexion d'un medecin"""
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id), "type": "user"},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "doctor": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "hospital": user.hospital,
            "specialty": user.specialty,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }


@router.post("/reset-password", response_model=dict)
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reinitialiser le mot de passe"""
    is_valid = email_service.verify_code(db, request.email, request.code, "reset_password")
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code de verification invalide ou expire"
        )
    
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouve"
        )
    
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    db.refresh(user)
    
    return {"message": "Mot de passe reinitialise avec succes"}
