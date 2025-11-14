# schemas.py
from pydantic import BaseModel, EmailStr, constr
from typing import Optional


class UserCreate(BaseModel):
    username: constr(min_length=3, max_length=255)
    password: constr(min_length=6)
    name: constr(min_length=1, max_length=255)
    job_role: Optional[str] = None
    mail: EmailStr

class UserLogin(BaseModel):
    username: constr(min_length=3, max_length=255)
    password: constr(min_length=6)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    job_role: Optional[str] = None
    mail: Optional[EmailStr] = None
    password: Optional[constr(min_length=6)] = None


class UserOut(BaseModel):
    id: int
    username: str
    name: str
    job_role: Optional[str] = None
    mail: str

    class Config:
        orm_mode = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
