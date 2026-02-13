# Deployment Guide (Vercel + Railway)

This project deploys as:
- Frontend on Vercel (Vite)
- Backends on Railway (Node/Express)

## 1) Create Two Railway Services
Create two services from the same repository.

### Service A: Chat (RAG)
- Start command: `node backend/chat/server.js`
- Required env:
  - `NODE_ENV=production`
  - `DATABASE_URL`
  - `OPENAI_API_KEY`
  - `CORS_ORIGIN`
- Recommended:
  - `OPENAI_CHAT_MODEL=gpt-4o-mini`
  - `OPENAI_EMBED_MODEL=text-embedding-3-small`
  - `RATE_LIMIT_MAX=60`
  - `RATE_LIMIT_WINDOW_MS=60000`

### Service B: Claimcheck
- Start command: `node backend/claimcheck/server.js`
- Required env:
  - `NODE_ENV=production`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - `ADMIN_TOKEN` (must be non-default)
  - `CORS_ORIGIN`
- Recommended:
  - `STRICT_GEO=true`
  - `ALLOW_FAKE_GEO=false`
  - `RATE_LIMIT_MAX=60`
  - `RATE_LIMIT_WINDOW_MS=60000`

Behavior note:
- Story decision path uses OpenAI when available.
- If OpenAI fails or returns invalid output during story analysis, backend falls back to `partially_approved` (manual review), not auto-approval.

## 2) Configure CORS on Both Railway Services
Set `CORS_ORIGIN` to Vercel production + preview:

```env
CORS_ORIGIN=https://your-app.vercel.app,https://*.vercel.app
```

You can add a custom domain too:

```env
CORS_ORIGIN=https://your-app.vercel.app,https://app.yourdomain.com,https://*.vercel.app
```

## 3) Deploy Frontend on Vercel
Set environment variables:
- `VITE_CHAT_API_URL=https://<chat-service>.up.railway.app`
- `VITE_CLAIM_API_URL=https://<claim-service>.up.railway.app`
- `VITE_API_URL=https://<claim-service>.up.railway.app`
- `VITE_ADMIN_EMAIL=<admin email>`
- `VITE_ADMIN_PASSWORD=<admin password>`
- `VITE_ADMIN_TOKEN=<must match ADMIN_TOKEN on claim service>`

Then deploy/redeploy.

## 4) Token Matching Requirement
Admin dashboard API auth requires:

- `VITE_ADMIN_TOKEN` (Vercel frontend)
- `ADMIN_TOKEN` (Railway claim backend)

These two values must be exactly the same.

## 5) Health Checks
Verify both backends:
- `https://<chat-service>.up.railway.app/healthz`
- `https://<chat-service>.up.railway.app/readyz`
- `https://<claim-service>.up.railway.app/healthz`
- `https://<claim-service>.up.railway.app/readyz`

Expected:
- Chat root: `RAG API running`
- Claim root: `Claim backend running`

## 6) Common Issues
### Chatbot fails in production
- `VITE_CHAT_API_URL` missing or wrong in Vercel
- Chat Railway service missing `OPENAI_API_KEY`
- Chat Railway service CORS not allowing Vercel origin

### Admin dashboard fails
- `VITE_ADMIN_TOKEN` missing in Vercel
- `ADMIN_TOKEN` mismatch between frontend and claim backend
- `VITE_API_URL` / `VITE_CLAIM_API_URL` missing or wrong

### CORS errors
- Missing `https://*.vercel.app` in `CORS_ORIGIN`
- Trailing spaces or malformed comma-separated origins

### Geo-tag confusion on claim evidence
- Geo verification requires EXIF GPS metadata in uploaded photo files.
- Location watermark text on the image is not treated as geo metadata.

## 7) Deploy Order (Recommended)
1. Railway chat service
2. Railway claim service
3. Vercel frontend

## 8) Env Templates in This Repo
Use these helper files locally (do not commit secrets):
- `.env.railway.chat.production`
- `.env.railway.claim.production`
- `.env.vercel.production`
