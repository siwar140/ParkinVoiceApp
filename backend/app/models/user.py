from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, Boolean
from datetime import datetime
from typing import List, Optional

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    hospital: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    specialty: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    profile_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    patients: Mapped[List["Patient"]] = relationship("Patient", back_populates="doctor", cascade="all, delete-orphan")
    predictions: Mapped[List["Prediction"]] = relationship("Prediction", back_populates="doctor", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"
