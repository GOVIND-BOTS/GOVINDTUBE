# GOVIND TUBE

**Watch · Create · Share · Discover**

An original video-sharing platform with a custom neon-purple identity. This repository contains a shared FastAPI backend, a Next.js web client, and an Expo React Native Android client.

## First foundation release

Implemented in this commit: API health check, MongoDB connection and indexes, account registration/login with hashed passwords and JWT, authenticated video uploads, public video listing, responsive web discovery screen, Android starter screen, and original SVG brand mark.

Planned next: object storage and signed uploads, FFmpeg transcoding, HLS adaptive streaming, video playback, Shorts, subscriptions, comments, playlists, notifications, creator analytics, live streaming, and moderation/admin tools.

## Local setup

1. Copy `.env.example` to `.env`; replace the JWT secret with a long random value.
2. Start MongoDB: `docker compose -f deployment/docker-compose.yml up -d mongodb`
3. Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
4. Website: `cd website && npm install && npm run dev`
5. Android: `cd android && npm install && npx expo start`

Backend docs: `http://localhost:8000/docs`.

The first upload implementation stores files on local disk for development only. Do not use local disk for a multi-instance production deployment; configure private object storage, background transcoding, HLS, and CDN delivery first.

Never commit real credentials. See `.env.example`. No license has been selected yet.
