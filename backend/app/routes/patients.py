# app/routes/patients.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Patient, User, Prediction
from ..auth import get_current_user, get_current_patient, authenticate_patient, create_access_token, get_password_hash
from ..schemas import PatientLogin, PatientCreate
from datetime import timedelta
from ..config import settings

router = APIRouter(prefix="/patients", tags=["patients"])

patient_auth_router = APIRouter(prefix="/patient", tags=["patient"])


@patient_auth_router.post("/login", response_model=dict)
async def patient_login(request: PatientLogin, db: Session = Depends(get_db)):
    patient = authenticate_patient(db, request.email, request.password)
    if not patient:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")

    token = create_access_token(
        {"sub": str(patient.id), "type": "patient"},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer", "role": "patient", "patient": patient_payload(patient)}


@patient_auth_router.get("/me", response_model=dict)
async def patient_profile(current_patient: Patient = Depends(get_current_patient)):
    return patient_payload(current_patient)


@patient_auth_router.get("/predictions", response_model=List[dict])
async def patient_predictions(
    db: Session = Depends(get_db),
    current_patient: Patient = Depends(get_current_patient),
):
    return [
        {
            "id": item.id,
            "result": item.result,
            "probability": item.probability,
            "confidence": item.confidence,
            "notes": item.notes,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in db.query(Prediction)
        .filter(Prediction.patient_id == current_patient.id)
        .order_by(Prediction.created_at.desc())
        .all()
    ]


def patient_payload(patient: Patient) -> dict:
    return {
        "id": patient.id,
        "email": patient.email,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "full_name": f"{patient.first_name} {patient.last_name}",
        "birth_date": patient.birth_date,
        "gender": patient.gender,
        "phone": patient.phone,
        "doctor_id": patient.doctor_id,
    }


@router.get("", response_model=List[dict])
async def get_patients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recuperer tous les patients du medecin connecte"""
    patients = db.query(Patient).filter(
        Patient.doctor_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return [
        {
            "id": p.id,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "birth_date": p.birth_date,
            "gender": p.gender,
            "phone": p.phone,
            "email": p.email,
            "notes": p.notes,
            "doctor_id": p.doctor_id,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None
        }
        for p in patients
    ]


@router.post("", response_model=dict)
async def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creer un nouveau patient"""
    if patient_data.email and db.query(Patient).filter(Patient.email == patient_data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cet email patient est deja utilise")

    patient = Patient(
        first_name=patient_data.first_name,
        last_name=patient_data.last_name,
        birth_date=patient_data.birth_date,
        gender=patient_data.gender,
        phone=patient_data.phone,
        email=patient_data.email,
        notes=patient_data.notes,
        hashed_password=get_password_hash(patient_data.password),
        doctor_id=current_user.id
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    return {
        "id": patient.id,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "birth_date": patient.birth_date,
        "gender": patient.gender,
        "phone": patient.phone,
        "email": patient.email,
        "notes": patient.notes,
        "doctor_id": patient.doctor_id,
        "created_at": patient.created_at.isoformat() if patient.created_at else None
    }


@router.get("/{patient_id}", response_model=dict)
async def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recuperer un patient specifique"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.doctor_id == current_user.id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient non trouve")
    
    return {
        "id": patient.id,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "birth_date": patient.birth_date,
        "gender": patient.gender,
        "phone": patient.phone,
        "email": patient.email,
        "notes": patient.notes,
        "doctor_id": patient.doctor_id,
        "created_at": patient.created_at.isoformat() if patient.created_at else None,
        "updated_at": patient.updated_at.isoformat() if patient.updated_at else None
    }


@router.put("/{patient_id}", response_model=dict)
async def update_patient(
    patient_id: int,
    patient_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mettre a jour un patient"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.doctor_id == current_user.id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient non trouve")
    
    for field in ["first_name", "last_name", "birth_date", "gender", "phone", "email", "notes"]:
        if field in patient_data:
            setattr(patient, field, patient_data[field])
    
    db.commit()
    db.refresh(patient)
    
    return {
        "id": patient.id,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "birth_date": patient.birth_date,
        "gender": patient.gender,
        "phone": patient.phone,
        "email": patient.email,
        "notes": patient.notes,
        "doctor_id": patient.doctor_id,
        "created_at": patient.created_at.isoformat() if patient.created_at else None
    }


@router.delete("/{patient_id}", response_model=dict)
async def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer un patient"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.doctor_id == current_user.id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient non trouve")
    
    db.delete(patient)
    db.commit()
    
    return {"message": "Patient supprime avec succes"}


@router.get("/{patient_id}/analyses", response_model=List[dict])
async def get_patient_analyses(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recuperer les analyses d'un patient"""
    predictions = db.query(Prediction).filter(
        Prediction.patient_id == patient_id,
        Prediction.doctor_id == current_user.id
    ).order_by(Prediction.created_at.desc()).all()
    
    return [
        {
            "id": p.id,
            "patient_id": p.patient_id,
            "result": p.result,
            "confidence": p.confidence,
            "probability": p.probability,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in predictions
    ]
