# QK.AI - Intelligent Insurance Policy Advisor

QK.AI is an insurance assistant with two backend services:
1. Chat (RAG) for policy guidance.
2. Claimcheck for claim verification and admin review.

## Features
- Streaming chatbot answers (`/api/rag-chat`)
- Claim workflow: policy PDF -> evidence -> story analysis
- Admin dashboard backed by Supabase
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
2. Start frontend:
```bash
npm run dev
```
3. Start both backends:
```bash
npm run backend
```

Default local ports:
- Frontend: `http://localhost:5173`
- Chat backend: `http://localhost:5175`
- Claim backend: `http://localhost:5174`

## Environment Variables
Use `example.env` as template.

Important:
- Keep secrets only in `.env` (never commit real keys).
- Production requires explicit API URLs and admin token alignment.

### Core frontend vars (Vercel)
- `VITE_CHAT_API_URL`
- `VITE_CLAIM_API_URL`
- `VITE_API_URL` (claim/admin fallback)
- `VITE_ADMIN_EMAIL`
- `VITE_ADMIN_PASSWORD`
- `VITE_ADMIN_TOKEN`

### Chat backend vars (Railway)
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `CORS_ORIGIN`
- Optional: `OPENAI_CHAT_MODEL`, `OPENAI_EMBED_MODEL`, `RATE_LIMIT_*`

### Claim backend vars (Railway)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ADMIN_TOKEN`
- `CORS_ORIGIN`
- Optional: `STRICT_GEO`, `ALLOW_FAKE_GEO`, `NEWS_*`

### Token matching rule
`VITE_ADMIN_TOKEN` (frontend) must exactly match `ADMIN_TOKEN` (claim backend).

## Production Deployment
Frontend is intended for Vercel and backends for Railway.
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

## Author
Bhuvan KK  
Email: bhuvankk2005@gmail.com
