# services/auth_service.py

import os
from datetime import datetime, timedelta
from typing import Optional

from passlib.context import CryptContext
import jwt
from fastapi import HTTPException
from fastapi.security import HTTPBearer

# Load secret from env
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "please-change-this-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# This enables Swagger UI "Authorize" box for Bearer token
auth_scheme = HTTPBearer()


# -----------------------
# Password Hashing
# -----------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# -----------------------
# JWT Creation
# -----------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token


# -----------------------
# JWT Decode
# -----------------------
def decode_access_token(token: str) -> dict:
    print("DECODE START")
    print("TOKEN:", token)

    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
