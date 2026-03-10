import os
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Extract and verify Supabase JWT token
    """

    token = credentials.credentials

    try:
        user = supabase.auth.get_user(token)

        if not user.user:
            raise HTTPException(status_code=401, detail="Invalid authentication token")

        return user.user

    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")