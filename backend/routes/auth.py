from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from supabase import Client
from supabase_auth.errors import AuthApiError
from core.security import get_current_user
from db.database import bearer, get_supabase

router = APIRouter()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=256)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(default="", max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=4096)


def session_payload(session):
    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "expires_at": session.expires_at,
        "user_id": session.user.id,
    }


def ensure_profile(client: Client, user):
    # Never overwrite existing roles, active flags, or edited names on login.
    metadata = user.user_metadata or {}
    client.table("users").upsert({
        "id": user.id, "email": user.email,
        "first_name": metadata.get("first_name", ""),
        "last_name": metadata.get("last_name", ""),
        "role": "user", "active": True,
    }, on_conflict="id", ignore_duplicates=True).execute()


@router.post("/signup")
def signup(payload: SignupRequest, response: Response, supabase: Client = Depends(get_supabase)):
    response.headers["Cache-Control"] = "no-store"
    try:
        result = supabase.auth.sign_up({
            "email": payload.email, "password": payload.password,
            "options": {"data": {
                "first_name": payload.first_name, "last_name": payload.last_name,
            }},
        })
    except AuthApiError as exc:
        raise HTTPException(400, "Unable to register. Check your details and try again.") from exc
    if not result.user:
        raise HTTPException(400, "Unable to register")
    if result.session:
        ensure_profile(supabase, result.user)
        return {"requires_email_confirmation": False, **session_payload(result.session)}
    # Confirmation-enabled projects have no authenticated session yet.
    return {"requires_email_confirmation": True,
            "message": "Check your email to confirm your account, then sign in."}


@router.post("/signin")
def signin(payload: LoginRequest, response: Response, supabase: Client = Depends(get_supabase)):
    response.headers["Cache-Control"] = "no-store"
    try:
        result = supabase.auth.sign_in_with_password(payload.model_dump())
    except AuthApiError as exc:
        raise HTTPException(401, "Unable to sign in. Check your credentials and email confirmation.") from exc
    if not result.session or not result.user:
        raise HTTPException(401, "Invalid credentials")
    ensure_profile(supabase, result.user)
    return session_payload(result.session)


@router.post("/refresh")
def refresh(payload: RefreshRequest, response: Response, supabase: Client = Depends(get_supabase)):
    response.headers["Cache-Control"] = "no-store"
    try:
        result = supabase.auth.refresh_session(payload.refresh_token)
    except AuthApiError as exc:
        if exc.status >= 500:
            raise HTTPException(503, "Authentication service unavailable") from exc
        raise HTTPException(401, "Session expired. Please sign in again.") from exc
    if not result.session:
        raise HTTPException(401, "Session expired. Please sign in again.")
    return session_payload(result.session)


@router.get("/me")
def get_me(current_user: UUID = Depends(get_current_user), supabase: Client = Depends(get_supabase)):
    result = supabase.table("users").select("*").eq("id", str(current_user)).limit(1).execute()
    if not result.data:
        raise HTTPException(404, "User profile not found")
    return result.data[0]


@router.post("/logout")
def logout(
    current_user: UUID = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    supabase: Client = Depends(get_supabase),
):
    # Sends the caller's JWT to /logout; no service-role key is used.
    supabase.auth.admin.sign_out(credentials.credentials, scope="local")
    return {"message": "Logged out successfully"}
