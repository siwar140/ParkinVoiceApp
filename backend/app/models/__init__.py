# app/models/__init__.py
# Importer tous les modèles

from .user import User
from .patient import Patient
from .prediction import Prediction
from .verification import Verification
from .admin import Admin

# Alias pour compatibilité
Doctor = User
VerificationCode = Verification

__all__ = [
    "User",
    "Doctor",
    "Patient",
    "Prediction",
    "Verification",
    "VerificationCode",
    "Admin",
]
