# app/schemas.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
# ============================================================
# AUTH
# ============================================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class PatientLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str
    phone: Optional[str] = None
    hospital: Optional[str] = None
    specialty: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str = Field(min_length=8, max_length=128)

# ============================================================
# USER (MÉDECIN)
# ============================================================

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    hospital: Optional[str] = None
    specialty: Optional[str] = None
    profile_image: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Alias pour compatibilité
DoctorResponse = UserResponse

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    hospital: Optional[str] = None
    specialty: Optional[str] = None
    profile_image: Optional[str] = None

DoctorUpdate = UserUpdate

class UserPasswordUpdate(BaseModel):
    old_password: str
    new_password: str
    code: Optional[str] = None

DoctorPasswordUpdate = UserPasswordUpdate

# ============================================================
# PATIENT
# ============================================================

class PatientBase(BaseModel):
    first_name: str
    last_name: str
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    notes: Optional[str] = None

class PatientCreate(PatientBase):
    password: str = Field(min_length=8, max_length=128)

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    notes: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    doctor_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ============================================================
# PREDICTION
# ============================================================

class PredictionResult(BaseModel):
    result: str
    confidence: float
    probability: float
    patient_name: Optional[str] = None
    patient_id: Optional[int] = None

class PredictionResponse(BaseModel):
    id: int
    doctor_id: int
    patient_id: Optional[int] = None
    patient_name: Optional[str] = None
    file_name: str
    file_path: Optional[str] = None
    result: str
    probability: float
    confidence: float
    duration: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================================
# VERIFICATION
# ============================================================

class SendCodeRequest(BaseModel):
    email: EmailStr
    purpose: str = "registration"

class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str
    purpose: str = "registration"

class VerificationResponse(BaseModel):
    message: str
    email: str
    code: str
    purpose: str

# ============================================================
# ADMIN
# ============================================================

class AdminBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

class AdminCreate(AdminBase):
    password: str = Field(min_length=8, max_length=128)

class AdminResponse(AdminBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class AdminUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

class AdminPasswordUpdate(BaseModel):
    old_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

# ============================================================
# DASHBOARD ADMIN
# ============================================================

class DashboardStats(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    total_doctors: int
    total_patients: int
    total_predictions: int
    parkinson_count: int
    normal_count: int
    avg_confidence: float
    model_accuracy: float

class DoctorStats(BaseModel):
    doctor_id: int
    full_name: str
    email: str
    total_patients: int
    total_predictions: int
    parkinson_count: int
    normal_count: int

# ============================================================
# FIX FORWARD REFERENCES
# ============================================================

UserResponse.model_rebuild()
PatientResponse.model_rebuild()
PredictionResponse.model_rebuild()
AdminResponse.model_rebuild()
