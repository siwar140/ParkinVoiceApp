from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, Float, Text
from datetime import datetime
from typing import Optional

from app.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    patient_id: Mapped[Optional[int]] = mapped_column(ForeignKey("patients.id"), nullable=True)
    patient_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_path: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    result: Mapped[str] = mapped_column(String(20), nullable=False)
    probability: Mapped[float] = mapped_column(Float, default=0.0)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    duration: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relations
    doctor: Mapped["User"] = relationship("User", back_populates="predictions")
    patient: Mapped[Optional["Patient"]] = relationship("Patient", back_populates="predictions")

    def __repr__(self):
        return f"<Prediction {self.result} - {self.confidence}%>"
