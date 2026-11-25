from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from .config import settings
from .database import get_database

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def hash_password(value: str) -> str:
    return pwd.hash(value)

def verify_password(value: str, hashed: str) -> bool:
    return pwd.verify(value, hashed)

def make_token(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode({"sub": user_id, "exp": exp}, settings.jwt_secret, algorithm="HS256")

async def current_user(token: str | None = Depends(oauth)):
    denied = HTTPException(401, "Authentication required")
    if not token:
        raise denied
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        uid = payload.get("sub")
        if not uid or not ObjectId.is_valid(uid):
            raise denied
    except JWTError:
        raise denied
    user = await get_database().users.find_one({"_id": ObjectId(uid)})
    if not user:
        raise denied
    return user
