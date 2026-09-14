# app/services/email_service.py
import os
import resend
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random
import string
from sqlalchemy.orm import Session
from ..models import Verification

load_dotenv()


class EmailService:
    def __init__(self):
        self.api_key = os.getenv("RESEND_API_KEY")
        self.from_email = os.getenv("FROM_EMAIL", "onboarding@resend.dev")
        
        if self.api_key:
            resend.api_key = self.api_key
            print(f"[OK] Email service configure: {self.from_email}")
        else:
            print("[WARN] RESEND_API_KEY manquante")

    def generate_code(self, length: int = 6) -> str:
        return ''.join(random.choices(string.digits, k=length))

    def send_email(self, recipient: str, subject: str, html: str) -> bool:
        try:
            # Reconfigurer la cle a chaque envoi (au cas ou)
            resend.api_key = self.api_key
            
            params = {
                "from": self.from_email,
                "to": recipient,
                "subject": subject,
                "html": html,
            }
            result = resend.Emails.send(params)
            print(f"[OK] Email envoye a {recipient}: {result}")
            return True
        except Exception as e:
            print(f"[ERREUR] Envoi email: {e}")
            return False

    def send_verification_code(self, db: Session, email: str, purpose: str = "registration") -> dict:
        code = self.generate_code()
        
        db.query(Verification).filter(
            Verification.email == email,
            Verification.purpose == purpose
        ).delete()
        
        expires_at = datetime.utcnow() + timedelta(minutes=15)
        verification = Verification(
            email=email,
            code=code,
            purpose=purpose,
            expires_at=expires_at,
            is_used=False
        )
        db.add(verification)
        db.commit()
        db.refresh(verification)
        
        if purpose == "registration":
            subject = "ParkinVoice - Code de verification"
            title = "Verification de votre compte"
            message = "Merci de vous etre inscrit sur ParkinVoice. Voici votre code :"
        elif purpose == "change_password":
            subject = "ParkinVoice - Changement de mot de passe"
            title = "Confirmation de changement de mot de passe"
            message = "Vous avez demande a modifier votre mot de passe. Voici votre code :"
        else:
            subject = "ParkinVoice - Reinitialisation"
            title = "Reinitialisation de mot de passe"
            message = "Voici votre code de reinitialisation :"
        
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #667eea; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">ParkinVoice</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333;">{title}</h2>
                <p style="color: #666; font-size: 16px;">{message}</p>
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0;">{code}</h1>
                </div>
                <p style="color: #999; font-size: 14px;">Ce code expirera dans 15 minutes.</p>
            </div>
        </div>
        """
        
        success = self.send_email(email, subject, html)
        if not success:
            return {"success": False, "message": "Impossible d'envoyer le code de vérification"}
        return {"success": True, "message": f"Code envoyé à {email}", "email": email, "purpose": purpose}

    def verify_code(self, db: Session, email: str, code: str, purpose: str = "registration") -> bool:
        verification = db.query(Verification).filter(
            Verification.email == email,
            Verification.code == code,
            Verification.purpose == purpose,
            Verification.is_used == False
        ).first()
        
        if not verification:
            return False
        
        if verification.expires_at < datetime.utcnow():
            return False
        
        verification.is_used = True
        db.commit()
        return True


email_service = EmailService()
