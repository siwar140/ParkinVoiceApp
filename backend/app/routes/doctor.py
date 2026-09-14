# app/routes/doctor.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
import os
import shutil
from datetime import datetime
from ..database import get_db
from ..models import User
from ..auth import get_current_user, get_password_hash, verify_password
from ..schemas import UserUpdate, UserPasswordUpdate, UserResponse
from ..config import settings

from ..services.email_service import email_service

router = APIRouter(prefix="/doctor", tags=["doctor"])


@router.get("/profile", response_model=dict)
async def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recuperer le profil du medecin connecte"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "hospital": current_user.hospital,
        "specialty": current_user.specialty,
        "profile_image": current_user.profile_image,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else None
    }


@router.put("/profile", response_model=dict)
async def update_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mettre a jour le profil"""
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "hospital": current_user.hospital,
        "specialty": current_user.specialty,
        "profile_image": current_user.profile_image,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else None
    }


@router.put("/password", response_model=dict)
async def update_password(
    data: UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Changer le mot de passe avec verification par code email"""
    if not data.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le code de verification recu par email est requis"
        )
    
    # Verifier le code envoye par email (change_password ou reset_password)
    is_valid = email_service.verify_code(db, current_user.email, data.code, "change_password")
    if not is_valid:
        is_valid = email_service.verify_code(db, current_user.email, data.code, "reset_password")
        
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code de verification invalide ou expire"
        )

    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ancien mot de passe incorrect"
        )
    
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Mot de passe change avec succes"}


@router.post("/profile-image", response_model=dict)
async def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Uploader une photo de profil"""
    
    # Verifier le type de fichier
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format d'image non supporte (JPEG, PNG, WEBP)"
        )
    
    # Creer le dossier si necessaire
    upload_dir = os.path.join(settings.UPLOAD_DIR, "profiles")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generer un nom unique
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Extension d'image non supportee")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Image trop volumineuse (5 Mo maximum)")
    filename = f"{current_user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}{ext}"
    filepath = os.path.join(upload_dir, filename)
    
    # Sauvegarder
    with open(filepath, "wb") as buffer:
        buffer.write(content)
    
    # Mettre a jour le profil
    current_user.profile_image = filename
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Photo de profil mise a jour",
        "profile_image": filename
    }
