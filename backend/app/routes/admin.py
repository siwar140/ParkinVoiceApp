# app/routes/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta
from typing import List, Optional
from ..database import get_db
from ..models import Admin, User, Patient, Prediction
from ..auth import (
    authenticate_admin, create_access_token, get_password_hash,
    get_current_admin, verify_password
)
from ..schemas import (
    AdminLogin, AdminCreate, AdminResponse, AdminUpdate, AdminPasswordUpdate,
    DashboardStats, DoctorStats
)
from ..config import settings

router = APIRouter(prefix="/admin", tags=["admin"])

# ============================================================
# AUTHENTIFICATION ADMIN
# ============================================================

@router.post("/login", response_model=dict)
async def admin_login(request: AdminLogin, db: Session = Depends(get_db)):
    '''Connexion admin'''
    admin = authenticate_admin(db, request.email, request.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    
    access_token = create_access_token(
        data={"sub": str(admin.id), "type": "admin"},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "full_name": admin.full_name,
        }
    }

@router.post("/register", response_model=AdminResponse)
async def admin_register(
    request: AdminCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    '''Créer un nouvel admin'''
    existing = db.query(Admin).filter(Admin.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé"
        )
    
    admin = Admin(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name,
        phone=request.phone,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin

@router.get("/me", response_model=AdminResponse)
async def get_admin_profile(current_admin: Admin = Depends(get_current_admin)):
    '''Profil de l'admin connecté'''
    return current_admin

# ============================================================
# DASHBOARD STATISTIQUES
# ============================================================

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    '''Statistiques globales du dashboard'''
    
    total_doctors = db.query(User).count()
    total_patients = db.query(Patient).count()
    total_predictions = db.query(Prediction).count()
    
    parkinson_count = db.query(Prediction).filter(Prediction.result == 'PD').count()
    normal_count = db.query(Prediction).filter(Prediction.result == 'HC').count()
    
    avg_confidence = db.query(func.avg(Prediction.confidence)).scalar() or 0
    
    model_accuracy = 73.28
    
    return DashboardStats(
        total_doctors=total_doctors,
        total_patients=total_patients,
        total_predictions=total_predictions,
        parkinson_count=parkinson_count,
        normal_count=normal_count,
        avg_confidence=round(avg_confidence, 2),
        model_accuracy=model_accuracy
    )

# ============================================================
# GESTION DES MÉDECINS
# ============================================================

@router.get("/doctors", response_model=List[dict])
async def get_all_doctors(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    '''Liste de tous les médecins'''
    doctors = db.query(User).offset(skip).limit(limit).all()
    
    result = []
    for doctor in doctors:
        patient_count = db.query(Patient).filter(Patient.doctor_id == doctor.id).count()
        prediction_count = db.query(Prediction).filter(Prediction.doctor_id == doctor.id).count()
        
        result.append({
            "id": doctor.id,
            "email": doctor.email,
            "full_name": doctor.full_name,
            "phone": doctor.phone,
            "hospital": doctor.hospital,
            "specialty": doctor.specialty,
            "total_patients": patient_count,
            "total_predictions": prediction_count,
            "created_at": doctor.created_at.isoformat() if doctor.created_at else None
        })
    
    return result

@router.get("/doctors/{doctor_id}", response_model=dict)
async def get_doctor_details(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    '''Détails d'un médecin'''
    doctor = db.query(User).filter(User.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")
    
    patient_count = db.query(Patient).filter(Patient.doctor_id == doctor.id).count()
    prediction_count = db.query(Prediction).filter(Prediction.doctor_id == doctor.id).count()
    parkinson_count = db.query(Prediction).filter(
        Prediction.doctor_id == doctor.id,
        Prediction.result == 'PD'
    ).count()
    
    return {
        "id": doctor.id,
        "email": doctor.email,
        "full_name": doctor.full_name,
        "phone": doctor.phone,
        "hospital": doctor.hospital,
        "specialty": doctor.specialty,
        "total_patients": patient_count,
        "total_predictions": prediction_count,
        "parkinson_count": parkinson_count,
        "normal_count": prediction_count - parkinson_count,
        "created_at": doctor.created_at.isoformat() if doctor.created_at else None
    }

@router.delete("/doctors/{doctor_id}", response_model=dict)
async def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    '''Supprimer un médecin et toutes ses données'''
    doctor = db.query(User).filter(User.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")
    
    db.query(Prediction).filter(Prediction.doctor_id == doctor_id).delete()
    db.query(Patient).filter(Patient.doctor_id == doctor_id).delete()
    db.delete(doctor)
    db.commit()
    
    return {"message": "Médecin et toutes ses données supprimés"}

# ============================================================
# SUPERVISION DES ANALYSES
# ============================================================

@router.get("/predictions", response_model=List[dict])
async def get_all_predictions(
    skip: int = 0,
    limit: int = 100,
    doctor_id: Optional[int] = None,
    result: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    '''Liste de toutes les prédictions avec filtres'''
    query = db.query(Prediction)
    
    if doctor_id:
        query = query.filter(Prediction.doctor_id == doctor_id)
    if result:
        query = query.filter(Prediction.result == result)
    
    predictions = query.order_by(Prediction.created_at.desc()).offset(skip).limit(limit).all()
    
    result_list = []
    for pred in predictions:
        doctor = db.query(User).filter(User.id == pred.doctor_id).first()
        patient = db.query(Patient).filter(Patient.id == pred.patient_id).first() if pred.patient_id else None
        
        result_list.append({
            "id": pred.id,
            "doctor_name": doctor.full_name if doctor else "N/A",
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "N/A",
            "result": pred.result,
            "confidence": pred.confidence,
            "probability": pred.probability,
            "created_at": pred.created_at.isoformat() if pred.created_at else None
        })
    
    return result_list

# ============================================================
# STATISTIQUES PAR MÉDECIN
# ============================================================

@router.get("/stats/doctors", response_model=List[DoctorStats])
async def get_doctors_stats(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    '''Statistiques par médecin'''
    doctors = db.query(User).all()
    
    result = []
    for doctor in doctors:
        patient_count = db.query(Patient).filter(Patient.doctor_id == doctor.id).count()
        prediction_count = db.query(Prediction).filter(Prediction.doctor_id == doctor.id).count()
        parkinson_count = db.query(Prediction).filter(
            Prediction.doctor_id == doctor.id,
            Prediction.result == 'PD'
        ).count()
        
        result.append(DoctorStats(
            doctor_id=doctor.id,
            full_name=doctor.full_name,
            email=doctor.email,
            total_patients=patient_count,
            total_predictions=prediction_count,
            parkinson_count=parkinson_count,
            normal_count=prediction_count - parkinson_count
        ))
    
    return result

# ============================================================
# GESTION DES ADMINS
# ============================================================

@router.get("/admins", response_model=List[AdminResponse])
async def get_all_admins(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    '''Liste de tous les admins'''
    return db.query(Admin).all()

@router.put("/change-password", response_model=dict)
async def change_admin_password(
    request: AdminPasswordUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    '''Changer le mot de passe de l'admin'''
    if not verify_password(request.old_password, current_admin.hashed_password):
        raise HTTPException(status_code=400, detail="Ancien mot de passe incorrect")
    
    current_admin.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Mot de passe changé avec succès"}
