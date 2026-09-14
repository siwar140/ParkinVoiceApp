# app/routes/verification.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import SendCodeRequest, VerifyCodeRequest
from ..services.email_service import email_service

router = APIRouter(prefix="/verification", tags=["verification"])


@router.post("/send-code", response_model=dict)
async def send_verification_code(
    request: SendCodeRequest,
    db: Session = Depends(get_db)
):
    """Envoyer un code de verification par email"""
    try:
        result = email_service.send_verification_code(
            db=db,
            email=request.email,
            purpose=request.purpose
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Erreur lors de l'envoi du code")
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur send-code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur serveur: {str(e)}"
        )


@router.post("/verify-code", response_model=dict)
async def verify_code(
    request: VerifyCodeRequest,
    db: Session = Depends(get_db)
):
    """Verifier un code de verification"""
    try:
        is_valid = email_service.verify_code(
            db=db,
            email=request.email,
            code=request.code,
            purpose=request.purpose
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Code invalide ou expire"
            )
        
        return {
            "success": True,
            "message": "Code verifie avec succes",
            "email": request.email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur verify-code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur serveur: {str(e)}"
        )
