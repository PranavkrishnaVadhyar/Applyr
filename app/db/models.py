# models.py
from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from db.database import Base


class Users(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, nullable=False)
    username = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    job_role = Column(String(255))
    mail = Column(String(255), unique=True, nullable=False)

    # FIX: specify correct FK for relationship
    resumes = relationship(
        "Resume",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="Resume.user_id"
    )


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    
    # ❗ KEEP ONLY THIS FOREIGN KEY
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # DO NOT KEEP THIS:
    # username = Column(String(255), ForeignKey("users.username"))  <-- REMOVE

    # Resume fields
    skills = Column(Text)
    experience = Column(Text)
    knowledge = Column(Text)
    education = Column(Text)
    projects = Column(Text)
    certifications = Column(Text)

    user = relationship(
        "Users",
        back_populates="resumes",
        foreign_keys=[user_id]
    )
