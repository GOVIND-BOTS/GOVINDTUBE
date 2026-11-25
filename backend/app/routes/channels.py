import re
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..database import get_database
from ..security import current_user

router = APIRouter(prefix="/channels", tags=["Creator Channels"])
USERNAME = re.compile(r"^[a-zA-Z0-9_]{3,24}$")


class ChannelCreate(BaseModel):
    username: str = Field(min_length=3, max_length=24)
    display_name: str = Field(min_length=2, max_length=60)
    bio: str = Field(default="", max_length=500)


def serialize_channel(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "user_id": doc["user_id"],
        "username": doc["username"],
        "display_name": doc["display_name"],
        "bio": doc.get("bio", ""),
        "subscribers": doc.get("subscribers", 0),
        "created_at": doc.get("created_at"),
    }


@router.post("", status_code=201)
async def create_channel(data: ChannelCreate, user: dict = Depends(current_user)):
    username = data.username.strip().lower()
    if not USERNAME.fullmatch(username):
        raise HTTPException(422, "Username must be 3-24 characters: letters, numbers, underscore")
    db = get_database()
    if await db.channels.find_one({"user_id": str(user["_id"])}):
        raise HTTPException(409, "You already have a creator channel")
    if await db.channels.find_one({"username": username}):
        raise HTTPException(409, "This channel username is already taken")
    doc = {
        "user_id": str(user["_id"]),
        "username": username,
        "display_name": data.display_name.strip(),
        "bio": data.bio.strip(),
        "subscribers": 0,
        "created_at": datetime.now(timezone.utc),
    }
    try:
        result = await db.channels.insert_one(doc)
    except Exception:
        raise HTTPException(409, "Channel could not be created; check username availability")
    doc["_id"] = result.inserted_id
    return serialize_channel(doc)


@router.get("/me")
async def my_channel(user: dict = Depends(current_user)):
    doc = await get_database().channels.find_one({"user_id": str(user["_id"])})
    if not doc:
        return {"channel": None}
    return {"channel": serialize_channel(doc)}


@router.get("/{username}")
async def get_channel(username: str):
    doc = await get_database().channels.find_one({"username": username.lower()})
    if not doc:
        raise HTTPException(404, "Channel not found")
    return serialize_channel(doc)
