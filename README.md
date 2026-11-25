# GOVIND TUBE

**Watch · Create · Share · Discover**

An original video-sharing platform with a custom neon-purple identity. This repository contains a shared FastAPI backend, a Next.js web client, and an Expo React Native Android client.

## Current implementation

- FastAPI API with MongoDB connection and indexes
- Email registration, login, JWT authentication, and authenticated profile endpoint
- Authenticated MP4/WebM/QuickTime uploads with streaming size limits
- Public video discovery, title search, and video metadata
- HTTP video delivery with byte-range requests (206 Partial Content), HEAD, ETag, and 416 range handling
- Web discovery feed connected to the API with an in-page HTML5 video player
- Expo Android starter client and original SVG brand identity
- Docker Compose development services

## Local setup

1. Copy `.env.example` to `.env`; replace the JWT secret with a long random value.
2. For Docker Compose, set `MONGODB_URL=mongodb://mongodb:27017` in `.env`.
3. Start MongoDB: `docker compose -f deployment/docker-compose.yml up -d mongodb`
4. Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
5. Website: `cd website && npm install && npm run dev`
6. Android: `cd android && npm install && npx expo start`

Backend docs: `http://localhost:8000/docs`.

## Video API

- `GET /api/v1/videos` — public discovery feed; supports `limit`, `skip`, and title query `q`
- `GET /api/v1/videos/{video_id}` — public video metadata
- `GET /api/v1/videos/{video_id}/stream` — inline video stream with HTTP byte-range support
- `HEAD /api/v1/videos/{video_id}/stream` — stream metadata without downloading the file
- `POST /api/v1/videos/upload` — authenticated multipart upload (Bearer token)
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`

The stream endpoint supports normal playback seeking using `Range: bytes=...`, returns `206 Partial Content` for valid ranges, and `416 Range Not Satisfiable` for invalid ranges.

## Production requirements before public launch

The current upload adapter stores files on local disk for development. A production deployment needs private object storage (for example an S3-compatible bucket), signed uploads, a background media worker, FFmpeg transcoding to HLS, CDN delivery, upload quotas, malware/content checks, moderation/reporting, rate limiting, backups, and monitoring. Configure HTTPS and a strong private JWT secret. Do not commit credentials.

## Roadmap

Channel profiles and subscriptions, Shorts, likes and comments, playlists, watch history, recommendations, creator analytics, notifications, moderation/admin tools, and live streaming.
