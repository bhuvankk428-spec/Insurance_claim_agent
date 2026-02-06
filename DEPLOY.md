# Deployment Guide (Vercel + Render)

This project is set up for:
- Frontend on **Vercel** (Vite app)
- Backend on **Render** (Node/Express services)

After you push to GitHub, follow these steps.

---

## 1) Prerequisites
- GitHub repo pushed
- Render account
- Vercel account
- Your backend API keys ready (ex: `OPENAI_API_KEY`)

---

## 2) Deploy Backend on Render

This repo includes `render.yaml` so Render can create both backend services.

### Option A: Blueprint Deploy (recommended)
1. Go to Render dashboard.
2. Click **New > Blueprint**.
3. Connect your GitHub repo and select it.
4. Render reads `render.yaml` and creates services:
   - `qk-ai-chat`
   - `qk-ai-claimcheck`
5. Set environment variables:
   - For **qk-ai-chat**:
     - `OPENAI_API_KEY` = your key
     - `CORS_ORIGIN` = your Vercel URL (example: `https://your-app.vercel.app`)
     - Optional: `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`
     - Optional: `OPENAI_MAX_RETRIES`
   - For **qk-ai-claimcheck**:
     - `CORS_ORIGIN` = your Vercel URL
     - `ADMIN_TOKEN` = secure random string (required in production)
     - Optional: `MAX_PDF_MB`, `MAX_PHOTO_MB`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`
6. Click **Deploy**.

### Option B: Manual Deploy (if you don’t use render.yaml)
Create two Web Services:

**Service 1: Chat**
- Build command: `npm ci`
- Start command: `node backend/chat/server.js`
- Env:
  - `OPENAI_API_KEY`
  - `CORS_ORIGIN`

**Service 2: Claimcheck**
- Build command: `npm ci`
- Start command: `node backend/claimcheck/server.js`
- Env:
  - `CORS_ORIGIN`

When deployed, copy both service URLs:
- Chat URL: `https://<your-chat>.onrender.com`
- Claim URL: `https://<your-claim>.onrender.com`

---

## 3) Deploy Frontend on Vercel

1. Go to Vercel dashboard.
2. Click **Add New Project** and select your GitHub repo.
3. Framework preset: **Vite**
4. Set Environment Variables:
   - `VITE_CHAT_API_URL` = Render chat URL
   - `VITE_CLAIM_API_URL` = Render claim URL
   - `VITE_API_URL` = Render claim URL
5. Click **Deploy**.

Vercel will build using:
- Build command: `npm run build`
- Output: `dist`

---

## 4) Verify Everything Works

### Frontend
Open your Vercel URL and check:
- Chooser page loads
- Chatbot works
- Claim checker uploads work
- Plan builder and dashboard load

### Backend Health
Open these in your browser:
- `https://<chat-service>.onrender.com/`
- `https://<claim-service>.onrender.com/`

Additional health endpoints:
- `https://<chat-service>.onrender.com/healthz`
- `https://<chat-service>.onrender.com/readyz`
- `https://<claim-service>.onrender.com/healthz`
- `https://<claim-service>.onrender.com/readyz`

You should see:
- `RAG API running ✅` (chat)
- `Claim backend running` (claimcheck)

---

## 5) Common Issues + Fixes

### CORS Error
Set `CORS_ORIGIN` on both Render services to your Vercel URL.

### Chatbot not responding
Make sure `OPENAI_API_KEY` is set in Render (chat service).

### Wrong API URLs in frontend
Double‑check Vercel env vars and redeploy.

---

## 6) Optional: Staging vs Production
You can deploy two Render blueprints and two Vercel projects if you want
staging and production with different environment variables.

---

## Done
Once these are set, every push to `main` will auto‑deploy.
