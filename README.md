# QK.AI - Intelligent Insurance Policy Advisor

QK.AI is an insurance platform with:
1. Policy Advisor chatbot (RAG).
2. Claim Checker workflow for document verification and admin review.
3. Planning and finance modules in the frontend (`/plan`, `/plan-dashboard`, `/finance-news`).

## Features
- Streaming chatbot answers from `/api/rag-chat`
- Multilingual chat responses (`en`, `hi`, `te`, `kn`) with optional text-to-speech output
- Claim workflow: policy PDF -> evidence -> story analysis
- Production-safe claim flow handoff: frontend stores serialized claim context per `claimId` and resubmits it on evidence/story steps so serverless runtimes do not lose claim state
- Safe claim fallback: if OpenAI is unavailable or returns invalid story output, claim is marked `partial` for manual review
- Admin dashboard backed by Supabase (search, load-more pagination, decision updates, export to printable PDF)
- Finance news feed from `/api/finance-news` (last 24h + refresh)
- AI Finance Podcast page (`/ai-finance-podcast`) currently shows a Coming Soon placeholder
- Firebase login (email/password + Google)

## Tech Stack
- Frontend: React, Vite, Tailwind, React Router, Firebase
- Backend: Node.js, Express, OpenAI, PostgreSQL (chat), Supabase (claim data)

## Project Structure
- `src/`: frontend app
- `backend/chat/`: RAG backend service
- `backend/claimcheck/`: claim workflow + admin backend service
- `documentation/`: architecture and reference docs

## Local Setup
1. Install dependencies:
```bash
npm install
```
2. Create local env from template and set required keys:
```bash
copy example.env .env
```
3. Start frontend:
```bash
npm run dev
```
4. Start both backends:
```bash
npm run backend
```

Default local ports:
- Frontend: `http://localhost:5173`
- Chat backend: `http://localhost:5175` (`CHAT_PORT`)
- Claim backend: `http://localhost:5174` (`CLAIM_PORT`)

## Environment Variables
Use `example.env` as template.

Important:
- Keep secrets only in `.env` (never commit real keys).
- Production requires explicit API URLs and admin token alignment.

### Core frontend vars (Vercel)
- `VITE_CHAT_API_URL`
- `VITE_CLAIM_API_URL`
- `VITE_API_URL` (claim/admin fallback)
- `VITE_ADMIN_EMAIL` or `VITE_ADMIN_EMAILS` (comma-separated)
- `VITE_ADMIN_TOKEN`

### Chat backend vars (Vercel)
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `CORS_ORIGIN`
- Optional: `OPENAI_CHAT_MODEL`, `OPENAI_EMBED_MODEL`, `RATE_LIMIT_*`, `CHAT_PORT`

### Claim backend vars (Vercel)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ADMIN_TOKEN`
- `CORS_ORIGIN`
- Optional: `STRICT_GEO`, `ALLOW_FAKE_GEO`, `CLAIM_PORT`, `NEWS_*`

Claim backend behavior:
- `OPENAI_API_KEY` enables image vision checks, policy coverage reasoning, and story consistency checks.
- If OpenAI is configured but fails/returns invalid JSON during story analysis, claim falls back to `partially_approved` (manual review), not auto-approval.
- Claim step state is created in backend memory first, then echoed back to the browser as `claimContext`; the frontend stores it in `sessionStorage` and sends it again to `/api/claim-evidence` and `/api/claim-story` so production/serverless requests can restore missing context.
- Geo verification uses this fallback chain:
  1. EXIF GPS metadata from uploaded image
  2. OCR extraction of visible coordinate text/watermark in the image
  3. OpenAI vision extraction of visible coordinate text (only if `OPENAI_API_KEY` is configured)

Claim workflow notes:
- `POST /api/claim-check` returns `claimId` and `claimContext`
- `POST /api/claim-evidence` returns updated `claimContext`
- `POST /api/claim-story` accepts `{ claimId, story, claimContext? }`
- Current durability is browser-session scoped for in-progress claims; final decisions are still persisted in Supabase

### Token matching rule
`VITE_ADMIN_TOKEN` (frontend) must exactly match `ADMIN_TOKEN` (claim backend).

### Admin access model (current)
- User authentication is handled by Firebase Auth.
- Admin routing is controlled by email match (`VITE_ADMIN_EMAIL` or `VITE_ADMIN_EMAILS`) in frontend route guards.
- Admin API access is protected by `x-admin-token`.

### Production hardening recommendation
- Do not rely only on frontend email checks for admin authorization.
- Prefer server-verified role checks (for example Firebase custom claims) and enforce admin authorization in backend handlers.

## Production Deployment
Frontend and backend are deployed together on Vercel.
See `DEPLOY.md` for complete step-by-step instructions.

## CORS Notes
You can provide multiple comma-separated origins in `CORS_ORIGIN`.
Wildcards are supported (example):
```env
CORS_ORIGIN=https://your-app.vercel.app,https://*.vercel.app
```

## Supabase Table
Create table `public.claims`:
```sql
create table if not exists public.claims (
  claim_id text primary key,
  email text,
  eligibility_status text,
  risk_level text,
  claim_code text,
  match_level text,
  image_location text,
  geo_tagged boolean,
  policy_owner_name text,
  policy_bike_number text,
  policy_land_location text,
  fir_incident text,
  fir_bike_number text,
  fir_location text,
  admin_decision text,
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Security Checklist
- Rotate any leaked API key immediately.
- Do not use default `ADMIN_TOKEN` in production.
- Do not commit `.env` or `.env.*`.

## Local Troubleshooting
- `EADDRINUSE` on `5174` or `5175` means another process is already using the port.
- Find process: `Get-NetTCPConnection -LocalPort 5174 -State Listen | Select-Object OwningProcess`
- Stop process: `Stop-Process -Id <PID> -Force`
- Or change local ports in `.env` (`CLAIM_PORT`, `CHAT_PORT`) and restart.

## Author
Bhuvan KK  
Email: bhuvankk2005@gmail.com
