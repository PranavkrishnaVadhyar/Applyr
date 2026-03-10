from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from db.database import supabase

router = APIRouter()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = "user"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str



@router.post("/signup")
async def signup(payload: SignupRequest):

    # Create auth user
    response = supabase.auth.sign_up({
        "email": payload.email,
        "password": payload.password
    })

    if not response.user:
        raise HTTPException(status_code=400, detail="Signup failed")

    user_id = response.user.id

    # Insert profile
    supabase.table("users").insert({
        "id": user_id,
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "role": payload.role,
        "email": payload.email,
        "active": True
    }).execute()

    return {
        "message": "User created successfully",
        "user_id": user_id
    }


@router.post("/signin")
async def signin(payload: LoginRequest):

    response = supabase.auth.sign_in_with_password({
        "email": payload.email,
        "password": payload.password
    })

    if not response.session:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = response.user
    user_id = user.id

    # Ensure profile exists
    supabase.table("users").upsert({
        "id": user_id,
        "email": user.email,
        "active": True
    }).execute()

    return {
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token,
        "user_id": user_id
    }