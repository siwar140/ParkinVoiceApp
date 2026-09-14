# app/routes/prediction.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
from ..database import get_db
from ..models import Prediction, Patient, User
from ..auth import get_current_user
from ..config import settings
from ..ml_inference import predict

router = APIRouter(prefix="/prediction", tags=["prediction"])


@router.post("/analyze", response_model=dict)
async def analyze_audio(
    file: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    patient_name: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyser un fichier audio"""
    
    # Verifier le type ou l'extension du fichier audio
    ext = os.path.splitext(file.filename or "")[1].lower()
    allowed_exts = [".wav", ".mp3", ".ogg", ".webm", ".m4a", ".flac", ".aac"]
    is_audio = file.content_type.startswith("audio/") or ext in allowed_exts
    if not is_audio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format audio non supporte (WAV, MP3, OGG, WEBM, M4A)"
        )

    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Fichier audio trop volumineux (25 Mo maximum)")
    
    # Creer le dossier
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    
    # Sauvegarder
    ext_save = ext if ext else ".wav"
    filename = f"{current_user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{ext_save}"
    filepath = os.path.join(upload_dir, filename)
    
    with open(filepath, "wb") as buffer:
        buffer.write(content)
    
    try:
        # Prediction
        result = predict(filepath)
        
        # Recuperer le nom du patient si non fourni explicitement
        final_patient_name = patient_name
        if patient_id:
            patient = db.query(Patient).filter(
                Patient.id == patient_id,
                Patient.doctor_id == current_user.id
            ).first()
            if patient:
                final_patient_name = f"{patient.first_name} {patient.last_name}"
        
        # Enregistrer dans la base
        prediction = Prediction(
            doctor_id=current_user.id,
            patient_id=patient_id,
            patient_name=final_patient_name,
            file_name=filename,
            file_path=filepath,
            result=result.get("result", "Unknown"),
            probability=result.get("probability", 0.0),
            confidence=result.get("confidence", 0.0),
            duration=result.get("total_duration", 0.0),
            notes=notes
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)
        
        return {
            "id": prediction.id,
            "result": prediction.result,
            "confidence": prediction.confidence,
            "probability": prediction.probability,
            "patient_id": prediction.patient_id,
            "patient_name": prediction.patient_name,
            "notes": prediction.notes,
            "created_at": prediction.created_at.isoformat() if prediction.created_at else None,
            "details": result
        }
        
    except Exception as e:
        # Supprimer le fichier en cas d'erreur
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'analyse: {str(e)}"
        )


@router.get("/history", response_model=List[dict])
async def get_history(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Historique des predictions du medecin"""
    predictions = db.query(Prediction).filter(
        Prediction.doctor_id == current_user.id
    ).order_by(Prediction.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": p.id,
            "result": p.result,
            "confidence": p.confidence,
            "probability": p.probability,
            "patient_id": p.patient_id,
            "patient_name": p.patient_name,
            "file_name": p.file_name,
            "duration": p.duration,
            "notes": p.notes,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in predictions
    ]


@router.get("/{prediction_id}", response_model=dict)
async def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recuperer une prediction specifique"""
    prediction = db.query(Prediction).filter(
        Prediction.id == prediction_id,
        Prediction.doctor_id == current_user.id
    ).first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction non trouvee")
    
    return {
        "id": prediction.id,
        "result": prediction.result,
        "confidence": prediction.confidence,
        "probability": prediction.probability,
        "patient_id": prediction.patient_id,
        "patient_name": prediction.patient_name,
        "file_name": prediction.file_name,
        "duration": prediction.duration,
        "notes": prediction.notes,
        "created_at": prediction.created_at.isoformat() if prediction.created_at else None
    }


@router.delete("/{prediction_id}", response_model=dict)
async def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer une prediction"""
    prediction = db.query(Prediction).filter(
        Prediction.id == prediction_id,
        Prediction.doctor_id == current_user.id
    ).first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction non trouvee")
    
    # Supprimer le fichier
    if prediction.file_path and os.path.exists(prediction.file_path):
        os.remove(prediction.file_path)
    
    db.delete(prediction)
    db.commit()
    
    return {"message": "Prediction supprimee avec succes"}
