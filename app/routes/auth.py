# users_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from db.models import Users
from schemas.users import UserCreate, UserOut, UserUpdate, TokenResponse, UserLogin
from services.auth_service import hash_password, verify_password, create_access_token, oauth2_scheme, decode_access_token

router = APIRouter(prefix="/users", tags=["users"])


# Helper: get current user dependency
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Users:
    payload = decode_access_token(token)
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(Users).filter(Users.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


# Create user (register)
@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    # check username/email uniqueness
    if db.query(Users).filter(Users.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(Users).filter(Users.mail == payload.mail).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(payload.password)
    user = Users(
        username=payload.username,
        password=hashed,
        name=payload.name,
        job_role=payload.job_role,
        mail=payload.mail
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# Login -> returns JWT
@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    # Using UserCreate for fields username + password (mail/name ignored)
    user = db.query(Users).filter(Users.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


# Get current user's profile
@router.get("/me", response_model=UserOut)
def read_own_profile(current_user: Users = Depends(get_current_user)):
    return current_user


# Get user by id (admin-like)
@router.get("/{user_id}", response_model=UserOut)
def read_user(user_id: int, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# Update current user
@router.put("/me", response_model=UserOut)
def update_own_profile(payload: UserUpdate, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    user = current_user
    if payload.name is not None:
        user.name = payload.name
    if payload.job_role is not None:
        user.job_role = payload.job_role
    if payload.mail is not None:
        # check email uniqueness
        exists = db.query(Users).filter(Users.mail == payload.mail, Users.id != user.id).first()
        if exists:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.mail = payload.mail
    if payload.password is not None:
        user.password = hash_password(payload.password)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# Delete current user
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_own_profile(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    db.delete(current_user)
    db.commit()
    return {"detail": "deleted"}


# List users (admin-like)
@router.get("/", response_model=List[UserOut])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    # For now allow any authenticated user to list; you can add role checks later
    users = db.query(Users).offset(skip).limit(limit).all()
    return users
