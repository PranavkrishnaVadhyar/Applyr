from uuid import UUID
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from supabase import Client
from supabase_auth.errors import AuthApiError
from db.database import bearer, get_supabase


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    supabase: Client = Depends(get_supabase),
) -> UUID:
    unauthorized = HTTPException(
        status_code=401, detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        response = supabase.auth.get_user(credentials.credentials)
    except AuthApiError as exc:
        if exc.status >= 500:
            raise HTTPException(503, "Authentication service unavailable") from exc
        raise unauthorized from exc
    if not response or not response.user:
        raise unauthorized
    return UUID(response.user.id)
