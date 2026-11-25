import uuid
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from ..config import settings
from ..database import get_database
from ..security import current_user

router = APIRouter(prefix="/videos", tags=["Videos"])
TYPES = {"video/mp4", "video/webm", "video/quicktime"}

@router.get("")
async def list_videos(limit: int = 24, skip: int = 0):
    limit = max(1, min(limit, 50))
    cursor = get_database().videos.find({"status": "published"}).sort("created_at", -1).skip(max(skip, 0)).limit(limit)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc.pop("storage_path", None)
        doc.pop("filename", None)
        items.append(doc)
    return {"items": items, "limit": limit, "skip": max(skip, 0)}

@router.post("/upload", status_code=201)
async def upload_video(title: str = Form(min_length=2, max_length=120), description: str = Form(default="", max_length=5000), file: UploadFile = File(...), user: dict = Depends(current_user)):
    if file.content_type not in TYPES:
        raise HTTPException(415, "Upload MP4, WebM, or QuickTime video")
    folder = Path(settings.upload_dir)
    folder.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "clip.mp4").suffix[:10] or ".mp4"
    name = uuid.uuid4().hex + ext
    path = folder / name
    total = 0
    try:
        with path.open("wb") as out:
            while chunk := await file.read(1024 * 1024):
                total += len(chunk)
                if total > settings.max_upload_size_mb * 1024 * 1024:
                    raise HTTPException(413, "Upload exceeds configured size limit")
                out.write(chunk)
    except Exception:
        path.unlink(missing_ok=True)
        raise
    finally:
        await file.close()
    doc = {"title": title.strip(), "description": description.strip(), "owner_id": str(user["_id"]), "owner_name": user["name"], "filename": name, "storage_path": str(path), "size_bytes": total, "content_type": file.content_type, "status": "published", "views": 0, "created_at": datetime.now(timezone.utc)}
    result = await get_database().videos.insert_one(doc)
    return {"id": str(result.inserted_id), "title": doc["title"], "status": "published"}
