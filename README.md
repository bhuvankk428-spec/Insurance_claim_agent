# INSURE.AI - Intelligent Insurance Policy Advisor

INSURE.AI is an insurance platform with:
1. Policy Advisor chatbot (RAG).
2. Claim Checker workflow for document verification and admin review.
3. User claims dashboard (`/dashboard`).
4. Planning and finance modules in the frontend (`/plan`, `/plan-dashboard`, `/finance-news`, `/finance-podcast`).

## Features
- Streaming chatbot answers from `/api/rag-chat`
- Multilingual chat responses (`en`, `hi`, `te`, `kn`) with optional text-to-speech output
- Claim workflow: policy PDF -> evidence -> story analysis
- Production-safe claim flow handoff: in-progress claim state is persisted in Supabase, with browser `claimContext` fallback for mixed or stale deployments
- Safe claim fallback: if OpenAI is unavailable or returns invalid story output, claim is marked `partial` for manual review
- User dashboard backed by `/api/my-claims` (status counts, geo-tagged totals, recent claims table)
- Admin dashboard backed by Supabase (search, load-more pagination, decision updates, export to printable PDF)
- Finance news feed from `/api/finance-news` (last 24h + refresh)
- Curated finance podcast picks (`/finance-podcast`)
- AI Finance Podcast page (`/ai-finance-podcast`) currently shows a Coming Soon placeholder
- Firebase login (email/password + Google) with route guards for user and admin pages

## Routes
| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Login |
| `/register` | Public | Registration |
| `/choose` | User | Module chooser |
| `/chatbot` | User | Policy Advisor (RAG chat) |
| `/claim-checker` | User | Claim workflow |
| `/dashboard` | User | My claims dashboard |
| `/plan`, `/plan-dashboard` | User | Planning modules |
| `/finance-news` | User | Finance news |
| `/finance-podcast` | User | Curated podcast picks |
| `/ai-finance-podcast` | User | Coming Soon placeholder |
| `/claim-story/:claimId` | User | Claim story step |
| `/claim-result/:claimId` | User | Claim result |
| `/admin-dashboard` | Admin | Claim review |
| `/about`, `/help`, `/faq`, `/contact` | User | Static pages |

## Tech Stack
- Frontend: React, Vite, Tailwind, React Router, Firebase
- Backend: Node.js, Express, OpenAI, PostgreSQL (chat), Supabase (claim data)

## Model Quality Evaluation
The repo includes a reproducible evaluation harness for measuring model quality, not just manual testing.

- Dataset: `eval/cases/insure-ai-eval-cases.json` (45 cases: 24 claim stories, 5 image checks, 16 RAG policy questions)
- Claim/image results: accuracy, invalid-JSON rate, JSON-repair rate, average latency, average cost per query, and confusion matrix
- RAG results: top-1/top-3 chunk hit rate, MRR, average latency, and average embedding cost per query
- Every run is saved as JSON + Markdown under `eval/results/` (latest, tagged, and history); generated results are gitignored
- Two runs can be compared case-by-case and metric-by-metric

Commands:
```bash
# Validate the dataset (counts, ids, expected RAG chunks)
npm run eval:validate

# Full run. Uses OpenAI for claims and embeddings when configured.
npm run eval -- --tag baseline

# Deterministic keyword-only baseline (no model cost)
npm run eval -- --tag keyword-baseline --claim-mode heuristic --rag-mode keyword

# Re-run after a prompt/chunking change, then compare
npm run eval -- --tag after-change
npm run eval:compare -- baseline after-change
```

Useful options: `--suite claim,image,rag`, `--claim-mode ai|heuristic`, `--rag-mode auto|db|embed|keyword`, `--limit <n>`, `--verbose`, `--no-images`.

Evaluation notes:
- Claim and image cases call the real service functions with fixed policy/FIR/evidence contexts. They do not upload PDFs or rerun OCR/EXIF.
- Supabase persistence is intentionally disabled during evaluation so runs do not write claim records.
- RAG `db` mode uses the real pgvector query. If Postgres is unreachable, `auto` falls back to local embedding retrieval over `backend/chat/policy_chunks.json`; if embeddings are unavailable it falls back to the production keyword scorer.
- Invalid JSON means a model response could not be parsed into the required shape. Repaired JSON means JSON was recovered from prose/Markdown fences (the existing extractor behavior). Unrecoverable JSON follows the existing safe fallback/manual-review path.
- Cost uses `eval/lib/pricing.js` token prices. Live pgvector retrieval does not expose embedding usage, so `db` mode reports cost as `n/a`.
- Image fixtures come from `test_pdf_for_verification/` and `public/`. The text-only placeholder image is expected to be `partial`, not `ok`.
- The RAG run surfaced a domain-filter gap: BrightFuture child-plan chunks are tagged `Education / Child Plan`, but the frontend only offers `Life Insurance`, so that chunk is unreachable under the Life filter.
- RAG `db` ranking is only meaningful when the stored `policy_chunks` embeddings come from the same model/space as the query embeddings (`EMBEDDING_PROVIDER`, `OPENAI_EMBED_MODEL`, `EMBEDDING_DIM`). A `policy_chunks` table seeded with a different model returns near-random order even when the expected text exists.
- See `documentation/model_quality_evaluation.txt` for the full metric definitions and limitations.

## RAG Data Pipeline
The RAG index is derived from `backend/chat/data/*.json`:

1. Build chunks (writes `backend/chat/policy_chunks.json`):
```bash
node backend/chat/scripts/buildChunks.js
```
2. Re-seed the vector table (clear `policy_chunks` first, since the script appends):
```bash
node backend/chat/scripts/embedChunks.js
```

Chunking rules:
- One chunk per leaf value, with the section path as context (`coverage.room_rent_cap: ...`).
- Prose values are stored as-is.
- Short fields are rendered as full sentences, for example:
  - `coverage.room_rent_cap: there is no room rent cap`
  - `coverage.hospitalization: hospitalization is covered`
  - `family.max_members_supported: up to 19 members can be covered`
  - `plan_variants: plan variants include Standard, Silver, Gold and Platinum`
- Rendering is chosen by value type (boolean, enum, number, short list), not by length alone, so long snake_case enums such as `indicative_not_product_specific` are rendered instead of leaking underscores.
- `false`/`0` values are preserved; only empty/null values are skipped.

Important: the embed step and the query path must use the same embedding provider/model and dimension. Re-embed after any model or chunking change, and delete `eval/.cache/` so local evaluation embeddings are rebuilt.

## Project Structure
- `src/`: frontend app
- `api/`: Vercel serverless entrypoints that re-export the backend apps
- `backend/chat/`: RAG backend service
- `backend/claimcheck/`: claim workflow, admin, dashboard, and finance backend service
- `eval/`: model-quality evaluation dataset, runner, reports, and comparison tool
- `documentation/`: architecture and reference docs
- `test_pdf_for_verification/`, `public/`: claim/image fixtures used by evaluation

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
- Frontend uses same-origin `/api` routes in both local and production.
- Production requires admin token alignment.

### Core frontend vars (Vercel)
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
- Optional: `STRICT_GEO`, `ALLOW_FAKE_GEO`, `CLAIM_PORT`, `REQUIRE_SUPABASE_READY`
- Optional finance news: `NEWS_API_KEY`, `NEWS_API_URL`, `NEWS_QUERY`, `NEWS_LANGUAGE`, `NEWS_PAGE_SIZE`, `NEWS_FALLBACK_SYMBOLS`

Claim backend behavior:
- `OPENAI_API_KEY` enables image vision checks, policy coverage reasoning, and story consistency checks.
- If OpenAI is configured but fails/returns invalid JSON during story analysis, claim falls back to `partially_approved` (manual review), not auto-approval.
- Claim step state is persisted to Supabase on each step, then echoed back to the browser as `claimContext`; the frontend stores it in `sessionStorage` and sends it again to `/api/claim-evidence` and `/api/claim-story` as a fallback for mixed or stale deployments.
- Geo verification uses this fallback chain:
  1. EXIF GPS metadata from uploaded image
  2. OCR extraction of visible coordinate text/watermark in the image
  3. OpenAI vision extraction of visible coordinate text (only if `OPENAI_API_KEY` is configured)

Claim workflow notes:
- `POST /api/claim-check` returns `claimId` and `claimContext`
- `POST /api/claim-evidence` returns updated `claimContext`
- `POST /api/claim-story` accepts `{ claimId, story, claimContext? }`
- `GET /api/my-claims?email=<email>&limit=<n>` returns claim history for the signed-in user dashboard
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
- Frontend calls same-origin `/api/*` routes. Local development uses the Vite proxy to forward those routes to the local backends.
See `DEPLOY.md` for complete step-by-step instructions.

Production notes:
- If a fix works locally but not in production, first confirm the backend commit was pushed and the latest Production deployment completed
- For claim document issues, compare the live `/api/claim-check` response with local extraction output before changing validation logic
- PDF extraction in serverless environments can differ from local runs; keep PDF.js asset resolution environment-safe

## CORS Notes
You can provide multiple comma-separated origins in `CORS_ORIGIN`.
Wildcards are supported (example):
```env
CORS_ORIGIN=https://your-app.vercel.app,https://*.vercel.app
```

## Supabase Table
Create table `public.claims` with the SQL in `documentation/supabase_claims_schema.sql` or run:
```sql
create table if not exists public.claims (
  claim_id text primary key,
  email text,
  domain text,
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
  policy_data jsonb,
  policy_text text,
  fir_data jsonb,
  image_analysis jsonb,
  evidence_risk jsonb,
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


## Documentation Index
- `documentation/documentation_frontend.txt` - frontend routes, auth, and component behavior
- `documentation/documentation_backend_design.txt` - service architecture and decision safety
- `documentation/documentation_backend_reference.txt` - file responsibilities and API contracts
- `documentation/model_quality_evaluation.txt` - evaluation metrics, modes, and limitations
- `documentation/supabase_claims_schema.sql` - `public.claims` table schema
- `DEPLOY.md` - production deployment steps

Last updated: October 2026
