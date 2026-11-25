# GOVIND TUBE

**Watch · Create · Share · Discover**

An original video-sharing platform with a custom neon-purple identity. This repository contains a FastAPI backend, Next.js web client, and Expo React Native Android client.

## Current development features

- FastAPI API with MongoDB connection and indexes
- Email registration, login, JWT authentication, and authenticated profile endpoint
- Creator channel creation and public channel lookup
- Authenticated MP4/WebM/QuickTime uploads with streaming size limits
- Public video discovery, title search, metadata and HTTP byte-range streaming
- Web sign-in/register, creator setup, upload form and HTML5 video player
- Android sign-in/register, secure token storage, creator channel setup, video picker/upload and native playback
- Responsive dark-purple brand UI and a draft privacy-policy page

## Local setup

1. Copy `.env.example` to `.env`; set a long random JWT secret.
2. For Docker Compose, set `MONGODB_URL=mongodb://mongodb:27017` in `.env`.
3. Start MongoDB: `docker compose -f deployment/docker-compose.yml up -d mongodb`
4. Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
5. Website: `cd website && npm install && npm run dev`
6. Android: `cd android && npm install && npx expo start`

Backend docs: `http://localhost:8000/docs`.

For a physical Android phone, set `EXPO_PUBLIC_API_URL` to a reachable HTTPS API URL (or your computer's LAN IP during local testing). The default `10.0.2.2` address is for the Android emulator.

## API routes

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- `POST /api/v1/channels` — authenticated channel creation
- `GET /api/v1/channels/me` — current user's channel
- `GET /api/v1/channels/{username}` — public channel
- `GET /api/v1/videos` — public discovery feed; supports `limit`, `skip`, and title query `q`
- `GET /api/v1/videos/{video_id}` — public video metadata
- `GET /api/v1/videos/{video_id}/stream` — video stream with byte-range support
- `POST /api/v1/videos/upload` — authenticated multipart upload

## Public service vs private source repository

The GitHub repository can be made private later without making the deployed website or API private. Public users will access the hosted website and mobile app, not the GitHub repository. Keep all secrets in hosting environment variables and never embed database credentials or JWT signing secrets in the web or Android clients.

Before making the repository private, confirm that the deployment platform can still build from a private GitHub repository and that its GitHub App/OAuth integration retains access. Public mobile distribution must use a public HTTPS API and public app-store listing.

## Production and Google Play launch gates

The current upload adapter stores files on local disk for development only. Before public launch:
- Move media to private S3-compatible object storage with signed uploads/downloads.
- Add FFmpeg background processing, thumbnails, HLS adaptive streaming and CDN delivery.
- Add upload quotas, content-type/file-signature validation, moderation/reporting, abuse controls, rate limiting, backups and monitoring.
- Enforce HTTPS, rotate a strong JWT secret, configure production CORS and review privacy/security.
- Implement account deletion and content-removal workflows; publish a complete privacy policy and support contact.
- Complete Google Play Data safety, content rating, target audience, app access, store listing, screenshots, signed Android App Bundle (AAB), testing tracks and policy declarations.
- Verify current Google Play target API and testing requirements at release time.

The privacy page in `website/app/privacy/page.tsx` is a draft and must be completed with the operator's real legal/contact details and actual production data practices before store submission. The Android client is source code only; no signed APK/AAB has been built or submitted.

## Roadmap

Shorts, subscriptions, likes/comments, playlists, watch history, recommendations, creator analytics, notifications, live streaming and admin/moderation tools.
