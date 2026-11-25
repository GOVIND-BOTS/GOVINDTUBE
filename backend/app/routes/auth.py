from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from ..database import get_database
from ..security import current_user, hash_password, verify_password, make_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterData(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class LoginData(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterData):
    db = get_database()
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(409, "Email is already registered")
    doc = {
        "name": data.name.strip(),
        "email": email,
        "password_hash": hash_password(data.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(doc)
    return {"id": str(result.inserted_id), "name": doc["name"], "email": email}


@router.post("/login")
async def login(data: LoginData):
    user = await get_database().users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    return {
        "access_token": make_token(str(user["_id"])),
        "token_type": "bearer",
        "user": {"id": str(user["_id"]), "name": user["name"], "email": user["email"]},
    }


@router.get("/me")
async def me(user: dict = Depends(current_user)):
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "user"),
        "created_at": user.get("created_at"),
    }
