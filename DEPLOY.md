# Deployment Guide (Vercel + Railway)

This project is set up for:
- Frontend on **Vercel** (Vite app)
- Backend on **Railway** (Node/Express services)

After you push to GitHub, follow these steps.

---

## 1) Prerequisites
- GitHub repo pushed
- Railway account
- Vercel account
- Your backend API keys ready (ex: `OPENAI_API_KEY`)

---

## 2) Deploy Backend on Railway

Create **two services** in Railway from the same GitHub repo:

### Service 1: Chat (RAG)
- Build command: `npm ci`
- Start command: `node backend/chat/server.js`
- Env:
  - `OPENAI_API_KEY`
  - `DATABASE_URL`
  - `CORS_ORIGIN` = your Vercel URL (example: `https://your-app.vercel.app`)
  - Optional: `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, `OPENAI_MAX_RETRIES`

### Service 2: Claimcheck
- Build command: `npm ci`
- Start command: `node backend/claimcheck/server.js`
- Env:
  - `CORS_ORIGIN` = your Vercel URL
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_TOKEN` = secure random string (required in production)
  - Optional: `MAX_PDF_MB`, `MAX_PHOTO_MB`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`

When deployed, copy both Railway service URLs:
- Chat URL: `https://<your-chat>.railway.app`
- Claim URL: `https://<your-claim>.railway.app`

---

## 3) Deploy Frontend on Vercel

1. Go to Vercel dashboard.
2. Click **Add New Project** and select your GitHub repo.
3. Framework preset: **Vite**
4. Set Environment Variables:
   - `VITE_CHAT_API_URL` = Railway chat URL
   - `VITE_CLAIM_API_URL` = Railway claim URL
   - `VITE_API_URL` = Railway claim URL
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
- `https://<chat-service>.railway.app/`
- `https://<claim-service>.railway.app/`

Additional health endpoints:
- `https://<chat-service>.railway.app/healthz`
- `https://<chat-service>.railway.app/readyz`
- `https://<claim-service>.railway.app/healthz`
- `https://<claim-service>.railway.app/readyz`

You should see:
- `RAG API running ✅` (chat)
- `Claim backend running` (claimcheck)

---

## 5) Common Issues + Fixes

### CORS Error
Set `CORS_ORIGIN` on both Railway services to your Vercel URL.

### Chatbot not responding
Make sure `OPENAI_API_KEY` is set in Railway (chat service).

### Wrong API URLs in frontend
Double-check Vercel env vars and redeploy.

---

## 6) Optional: Staging vs Production
You can deploy two Railway projects and two Vercel projects if you want
staging and production with different environment variables.

---

## Done
Once these are set, every push to `main` will auto-deploy.
