from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from db.database import supabase
from core.security import get_current_user
from uuid import UUID

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

@router.get("/me")
async def get_me(current_user: UUID = Depends(get_current_user)):
    response = (
        supabase
        .table("users")
        .select("*")
        .eq("id", str(current_user))
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="User profile not found")

    return response.data


@router.post("/logout")
async def logout():
    """
    Signs out the user by clearing the session in Supabase.
    """
    try:
        # We try to sign out, but if it fails (e.g. no active session on shared client), 
        # we still want the frontend to proceed with clearing local tokens.
        supabase.auth.sign_out()
    except Exception as e:
        print(f"Supabase sign_out error: {e}")
        # We don't necessarily want to block logout if the server-side sign_out fails
    
    return {"message": "Logged out successfully"}