# QK.AI - Intelligent Insurance Policy Advisor

QK.AI is an insurance platform with:
1. Policy Advisor chatbot (RAG).
2. Claimcheck workflow for document verification and admin review.
3. Planning and finance modules in the frontend (`/plan`, `/plan-dashboard`, `/finance-news`).

## Features
- Streaming chatbot answers from `/api/rag-chat`
- Multilingual chat responses (`en`, `hi`, `te`, `kn`) with optional text-to-speech output
- Claim workflow: policy PDF -> evidence -> story analysis
- Admin dashboard backed by Supabase (search, load-more pagination, decision updates, export to printable PDF)
- Finance news feed from `/api/finance-news` (last 24h + refresh)
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
- `VITE_ADMIN_EMAIL`
- `VITE_ADMIN_PASSWORD`
- `VITE_ADMIN_TOKEN`

### Chat backend vars (Railway)
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `CORS_ORIGIN`
- Optional: `OPENAI_CHAT_MODEL`, `OPENAI_EMBED_MODEL`, `RATE_LIMIT_*`, `CHAT_PORT`

### Claim backend vars (Railway)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ADMIN_TOKEN`
- `CORS_ORIGIN`
- Optional: `STRICT_GEO`, `ALLOW_FAKE_GEO`, `CLAIM_PORT`, `NEWS_*`

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
