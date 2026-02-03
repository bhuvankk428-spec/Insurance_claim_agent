# QK.AI � Intelligent Insurance Policy Advisor

QK.AI is an AI-powered insurance assistant that helps users understand, compare, and evaluate insurance policies using natural language. It includes:
- Policy Q&A with streaming responses
- Claim eligibility checking with document and photo evidence
- Secure authentication (Email + Google)

## Features
- AI-powered policy advisor (RAG-style retrieval)
- Policy data stored in structured JSON format
- Semantic search via vector embeddings (pgvector)
- Streaming AI responses for real-time interaction
- Firebase authentication (Email and Google)
- Confidence-based recommendations
- Modern, responsive UI (React + Tailwind)

## Tech Stack
Frontend
- React (Vite)
- Tailwind CSS
- React Router
- Firebase Authentication

Backend
- Node.js (Express)
- PostgreSQL + pgvector (SUPERBASE DB)
- RAG architecture with streaming responses

## Project Structure
- frontend (root): React app
- backend/chat: Policy advisor backend (chat/RAG)
- backend/claimcheck: Claim eligibility check backend

## How It Works
1. User asks a question in natural language
2. Relevant policy chunks are retrieved via vector similarity
3. Results are ranked and sent to the model
4. AI streams an explainable recommendation in real time

## Claim Eligibility Check (Process)
The claim eligibility flow validates a policy PDF and then accepts FIR/complaint and incident photos to assess coverage.

Steps:
1. Upload Policy PDF to verify coverage and generate a claim ID
2. Upload FIR/complaint document
3. Upload incident photos
4. Submit evidence to continue to the claim story and result

This flow requires the `backend/claimcheck` server running.

## Admin Dashboard & Supabase
The claim decision (approved, rejected, partial) is persisted to Supabase and shown on the admin dashboard.

Required env vars in `backend/claimcheck/.env`:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_TOKEN` (default is `qk-admin-2026`)

Create the `claims` table in Supabase:
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

Admin login is configurable via Vite env (fallbacks are hardcoded):
- `VITE_ADMIN_EMAIL`
- `VITE_ADMIN_PASSWORD`
- `VITE_ADMIN_TOKEN`

## Run Locally
Use separate terminals (recommended) or start both backends with one command.

### 1) Install dependencies (root)
```bash
npm install
```

### 2) Start frontend
```bash
npm run dev
```
Frontend runs on:
```
http://localhost:5173
```

### 3) Start backends (one command)
```bash
npm run backend
```
This runs:
- Chat (RAG) backend on `http://localhost:5175`
- Claimcheck backend on `http://localhost:5174`

### Optional: start backends separately
```bash
cd backend/chat
npm install
npm start
```
```bash
cd backend/claimcheck
npm install
npm start
```

Note: Claim eligibility requires the claimcheck backend running. The policy advisor requires the chat backend running.

## Environment Setup (Single Root .env)
All environment variables now live in the root `.env`.

Example `.env` (edit your keys/URLs):
```env
VITE_API_URL=http://localhost:5174
VITE_CHAT_API_URL=http://localhost:5175
VITE_CLAIM_API_URL=http://localhost:5174

# Chat backend (RAG)
DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/postgres
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=phi3
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_NUM_CTX=2048
OLLAMA_MAX_TOKENS=350
OLLAMA_TIMEOUT_MS=20000
CHAT_PORT=5175

# Claimcheck backend
GROQ_API_KEY=your_groq_key
ALLOW_FAKE_GEO=true
STRICT_GEO=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_TOKEN=qk-admin-2026
CLAIM_PORT=5174
CORS_ORIGIN=http://localhost:5173

# Admin login (frontend)
VITE_ADMIN_EMAIL=admin@qk.ai
VITE_ADMIN_PASSWORD=QKAdmin#2026
VITE_ADMIN_TOKEN=qk-admin-2026
```


## Ollama (Local LLM)
For faster, hackathon-friendly responses, use `phi3` with Ollama.

Install the model:
```bash
ollama pull phi3
```

Set in root `.env`:
```env
OLLAMA_CHAT_MODEL=phi3
```

## Authentication
- Email & Password login
- Google OAuth login
- Protected routes after login

## Data Format
Insurance policies are stored as JSON chunks. Each chunk typically includes:
- Policy name
- Domain (Health, Motor, Travel, etc.)
- Section
- Text content
- Vector embedding

## Author
Bhuvan KK
Full-Stack Developer | AI Engineer
Email: bhuvankk2005@gmail.com
Phone: +91 90366 94320

## License
MIT License � open-source and free to use.

QK.AI � Smarter insurance decisions, powered by local AI.
