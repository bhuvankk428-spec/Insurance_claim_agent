# Deployment Guide (Vercel Full Stack)

This project deploys frontend and backend in one Vercel project:
- Frontend: Vite static build
- Backend: Vercel serverless functions under `api/`

## 1) Connect Repository to Vercel
- Import this repository in Vercel.
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

`vercel.json` is already configured to:
- keep `/api/*` routed to functions
- route non-API paths to `index.html` for SPA navigation

## 2) Required Environment Variables
Set these in Vercel Project Settings -> Environment Variables:

### Core backend
- `OPENAI_API_KEY`
- `DATABASE_URL` (PostgreSQL for chat/RAG)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_TOKEN` (must not use default value)

### Frontend auth/admin
- `VITE_ADMIN_EMAIL` or `VITE_ADMIN_EMAILS` (comma-separated)
- `VITE_ADMIN_TOKEN` (must exactly match `ADMIN_TOKEN`)

### Optional
- `CORS_ORIGIN` (comma-separated origins, wildcard supported)
- `OPENAI_CHAT_MODEL`
- `OPENAI_EMBED_MODEL`
- `RATE_LIMIT_MAX`
- `RATE_LIMIT_WINDOW_MS`
- `STRICT_GEO`
- `ALLOW_FAKE_GEO`
- `REQUIRE_DB_READY`
- `REQUIRE_SUPABASE_READY`

## 3) API Endpoints in Vercel
These are available from the same domain:
- `/api/rag-chat`
- `/api/claim-check`
- `/api/claim-evidence`
- `/api/claim-story`
- `/api/my-claims`
- `/api/finance-news`
- `/api/admin/claims`
- `/api/admin/claims/:claimId`

Frontend now supports same-origin fallback for these routes, so separate `VITE_CHAT_API_URL` and `VITE_CLAIM_API_URL` are optional.

## 4) Health Checks
After deploy, verify:
- `/healthz`
- `/readyz`

Note: health/readiness routes are provided by the backend Express apps. If you need dedicated API health paths, add explicit `api/healthz.js` and `api/readyz.js` handlers.

## 5) Common Issues
### Admin dashboard unauthorized
- `VITE_ADMIN_TOKEN` does not match `ADMIN_TOKEN`
- `ADMIN_TOKEN` not set in production
- Admin email does not match configured `VITE_ADMIN_EMAIL`/`VITE_ADMIN_EMAILS`

### Chat or claim APIs fail
- Missing `OPENAI_API_KEY`, `DATABASE_URL`, or Supabase vars
- CORS misconfiguration in `CORS_ORIGIN`

### Claim story works locally but fails in production
- Older deployments depended on in-memory claim session state between `/api/claim-check`, `/api/claim-evidence`, and `/api/claim-story`
- Current flow returns `claimContext` from step 1 and step 2, stores it in browser `sessionStorage`, and sends it back on the story request
- If claim eligibility is failing after deploy, confirm the latest frontend and claim backend are deployed together; a mixed old/new deploy can break the handoff

### Build succeeds but runtime fails
- Missing production env vars in Vercel (Preview/Production scopes checked incorrectly)

## 6) Rollout Order
1. Set Vercel environment variables
2. Deploy
3. Verify user flows: chat, claim check, claim evidence, claim story, admin dashboard
4. Verify the full claim flow in production without relying on the same server instance between requests

## 7) Production Security Note
- Current admin route gating uses frontend email checks plus admin token for API calls.
- For stronger security, move admin authorization to backend-verified identity claims (for example Firebase custom claims) and treat frontend checks as UX only.
