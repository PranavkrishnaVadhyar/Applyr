# routes/users_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from db.models import Users
from schemas.users import UserCreate, UserOut, UserUpdate, TokenResponse, UserLogin
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    auth_scheme
)

router = APIRouter()


# -----------------------
# Extract current user from Bearer Token
# -----------------------
def get_current_user(
    credentials=Depends(auth_scheme),
    db: Session = Depends(get_db)
):
    raw = credentials.credentials
    token = raw.replace("Bearer ", "").strip()  # FIX HERE

    payload = decode_access_token(token)
    username = payload.get("sub")

    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(Users).filter(Users.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


# -----------------------
# Register User
# -----------------------
@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):

    if db.query(Users).filter(Users.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")

    if db.query(Users).filter(Users.mail == payload.mail).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = Users(
        username=payload.username,
        password=hash_password(payload.password),
        name=payload.name,
        job_role=payload.job_role,
        mail=payload.mail
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# -----------------------
# Login User → Returns JWT
# -----------------------
@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):

    user = db.query(Users).filter(Users.username == payload.username).first()

    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = create_access_token({"sub": user.username})

    return {"access_token": token, "token_type": "bearer"}


# -----------------------
# Get own profile
# -----------------------
@router.get("/me", response_model=UserOut)
def read_own_profile(current_user: Users = Depends(get_current_user)):
    return current_user


# -----------------------
# Update own profile
# -----------------------
@router.put("/me", response_model=UserOut)
def update_own_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    user = current_user

    if payload.name:
        user.name = payload.name

    if payload.job_role:
        user.job_role = payload.job_role

    if payload.mail:
        exists = db.query(Users).filter(Users.mail == payload.mail, Users.id != user.id).first()
        if exists:
            raise HTTPException(status_code=400, detail="Email already taken")
        user.mail = payload.mail

    if payload.password:
        user.password = hash_password(payload.password)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# -----------------------
# Delete own account
# -----------------------
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_own_profile(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    db.delete(current_user)
    db.commit()
    return {"detail": "deleted"}


# -----------------------
# List all users (protected)
# -----------------------
@router.get("/", response_model=List[UserOut])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    users = db.query(Users).offset(skip).limit(limit).all()
    return users
