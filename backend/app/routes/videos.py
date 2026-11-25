import mimetypes
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import Response, StreamingResponse

from ..config import settings
from ..database import get_database
from ..security import current_user

router = APIRouter(prefix="/videos", tags=["Videos"])
ALLOWED_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
CHUNK_SIZE = 1024 * 1024


def _public_video(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", "Untitled video"),
        "description": doc.get("description", ""),
        "owner_id": doc.get("owner_id"),
        "owner_name": doc.get("owner_name", "GOVIND TUBE creator"),
        "size_bytes": doc.get("size_bytes", 0),
        "content_type": doc.get("content_type", "video/mp4"),
        "views": doc.get("views", 0),
        "created_at": doc.get("created_at"),
        "duration_seconds": doc.get("duration_seconds"),
        "stream_url": f"/api/v1/videos/{doc['_id']}/stream",
    }


def _video_path(doc: dict) -> Path:
    # Never trust a path supplied by a database document or by the client.
    filename = doc.get("filename", "")
    if not filename or Path(filename).name != filename:
        raise HTTPException(404, "Video file not found")
    root = Path(settings.upload_dir).resolve()
    path = (root / filename).resolve()
    if path.parent != root or not path.is_file():
        raise HTTPException(404, "Video file is unavailable")
    return path


def _parse_range(value: str, size: int) -> tuple[int, int]:
    match = re.fullmatch(r"bytes=(\d*)-(\d*)", value.strip())
    if not match or (not match.group(1) and not match.group(2)):
        raise HTTPException(416, "Invalid byte range", headers={"Content-Range": f"bytes */{size}"})
    first, last = match.groups()
    if not first:
        suffix = int(last)
        if suffix <= 0:
            raise HTTPException(416, "Invalid byte range", headers={"Content-Range": f"bytes */{size}"})
        start, end = max(0, size - suffix), size - 1
    else:
        start = int(first)
        end = int(last) if last else size - 1
    if start >= size or end < start:
        raise HTTPException(416, "Requested range is not satisfiable", headers={"Content-Range": f"bytes */{size}"})
    return start, min(end, size - 1)


def _file_iterator(path: Path, start: int, length: int) -> Iterator[bytes]:
    with path.open("rb") as source:
        source.seek(start)
        remaining = length
        while remaining:
            chunk = source.read(min(CHUNK_SIZE, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


@router.get("")
async def list_videos(
    limit: int = Query(24, ge=1, le=50),
    skip: int = Query(0, ge=0),
    q: str | None = Query(None, max_length=120),
):
    query: dict = {"status": "published"}
    if q and q.strip():
        query["title"] = {"$regex": re.escape(q.strip()), "$options": "i"}
    cursor = get_database().videos.find(query).sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        items.append(_public_video(doc))
    return {"items": items, "limit": limit, "skip": skip}


@router.post("/upload", status_code=201)
async def upload_video(
    title: str = Form(min_length=2, max_length=120),
    description: str = Form(default="", max_length=5000),
    file: UploadFile = File(...),
    user: dict = Depends(current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, "Upload an MP4, WebM, or QuickTime video")
    original_ext = Path(file.filename or "").suffix.lower()
    ext = original_ext if original_ext in {".mp4", ".webm", ".mov"} else {
        "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov"
    }[file.content_type]
    folder = Path(settings.upload_dir).resolve()
    folder.mkdir(parents=True, exist_ok=True)
    filename = uuid.uuid4().hex + ext
    path = folder / filename
    total = 0
    try:
        with path.open("xb") as out:
            while chunk := await file.read(CHUNK_SIZE):
                total += len(chunk)
                if total > settings.max_upload_size_mb * 1024 * 1024:
                    raise HTTPException(413, "Upload exceeds the configured size limit")
                out.write(chunk)
        if total == 0:
            raise HTTPException(400, "The uploaded video is empty")
        doc = {
            "title": title.strip(),
            "description": description.strip(),
            "owner_id": str(user["_id"]),
            "owner_name": user["name"],
            "filename": filename,
            "size_bytes": total,
            "content_type": file.content_type,
            "status": "published",
            "visibility": "public",
            "views": 0,
            "created_at": datetime.now(timezone.utc),
        }
        result = await get_database().videos.insert_one(doc)
        doc["_id"] = result.inserted_id
        return _public_video(doc)
    except Exception:
        path.unlink(missing_ok=True)
        raise
    finally:
        await file.close()


@router.get("/{video_id}")
async def get_video(video_id: str):
    if not ObjectId.is_valid(video_id):
        raise HTTPException(404, "Video not found")
    doc = await get_database().videos.find_one({"_id": ObjectId(video_id), "status": "published"})
    if not doc:
        raise HTTPException(404, "Video not found")
    return _public_video(doc)


@router.api_route("/{video_id}/stream", methods=["GET", "HEAD"])
async def stream_video(video_id: str, request: Request):
    if not ObjectId.is_valid(video_id):
        raise HTTPException(404, "Video not found")
    db = get_database()
    doc = await db.videos.find_one({"_id": ObjectId(video_id), "status": "published"})
    if not doc:
        raise HTTPException(404, "Video not found")
    path = _video_path(doc)
    stat = path.stat()
    size = stat.st_size
    media_type = doc.get("content_type") or mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    etag = f'"{stat.st_mtime_ns:x}-{size:x}"'
    common = {
        "Accept-Ranges": "bytes",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
        "ETag": etag,
        "X-Content-Type-Options": "nosniff",
    }
    if request.headers.get("if-none-match") == etag and not request.headers.get("range"):
        return Response(status_code=304, headers=common)
    range_header = request.headers.get("range")
    if range_header and request.headers.get("if-range") not in (None, etag):
        range_header = None
    if range_header:
        start, end = _parse_range(range_header, size)
        length = end - start + 1
        headers = {**common, "Content-Range": f"bytes {start}-{end}/{size}", "Content-Length": str(length)}
        if request.method == "HEAD":
            return Response(status_code=206, media_type=media_type, headers=headers)
        return StreamingResponse(_file_iterator(path, start, length), status_code=206, media_type=media_type, headers=headers)
    headers = {**common, "Content-Length": str(size)}
    if request.method == "HEAD":
        return Response(status_code=200, media_type=media_type, headers=headers)
    await db.videos.update_one({"_id": doc["_id"]}, {"$inc": {"views": 1}})
    return StreamingResponse(_file_iterator(path, 0, size), media_type=media_type, headers=headers)
