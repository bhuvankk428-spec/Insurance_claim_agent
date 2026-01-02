qk.ai — AI-Assisted Insurance Claim & Advisory System
Project Overview

qk.ai is a modern, AI-powered web application designed to simplify insurance interactions by helping users understand claim eligibility, policy suitability, and next steps with clear explanations.

The system combines:

Retrieval-Augmented Generation (RAG)

Rule-based policy evaluation

LLM-powered explanations (Gemini / OpenAI / Ollama)

⚠️ qk.ai does not guess claim ratios, hospital availability, or medical eligibility.
If data is unavailable, the system clearly states it.

What’s New (Important)
🧠 Hybrid AI Engine (NEW)

qk.ai now uses a two-layer intelligence system:

Rule Engine (Primary)

Evaluates policies using structured data

Checks eligibility, exclusions, affordability, family fit, occupation, and risks

Produces a score + explanation

LLM (Secondary)

Explains the decision

Compares Policy A vs Policy B

Picks exactly one best policy

Never overrides rules

Key Features
🔐 Authentication

Email/password login & registration

Google Authentication

Firebase Authentication

🚗 3-Step Claim Workflow

Policy PDF Verification

FIR / Complaint Upload

Accident Photo Upload

Each step includes validation, progress locking, and clear feedback.

📝 Claim Story Analysis

Users describe incidents in natural language

Backend validates coverage + evidence

AI explains:

Coverage likelihood

Required documents

Next steps

🔍 Policy Search, Comparison & Recommendation (UPDATED)

Users can ask:

“Best health insurance for family with heart condition”

“Low premium crop insurance for drought & flood”

System output:

Policy A vs Policy B comparison

Exactly one recommendation

Score breakdown explaining why

Clear claim process explanation

How the Recommendation System Works
User Query
   ↓
Semantic Search (RAG)
   ↓
Rule Engine (structured + text)
   ↓
Score + Explanation
   ↓
LLM Comparison & Final Recommendation

Rule Engine Checks:

Pre-existing disease handling

Heart / chronic condition exclusions

Family suitability

Government subsidy & affordability

Occupation (e.g., farmer)

Natural calamity coverage

Explicit exclusions (heavy penalties)

Output Example:
{
  "score": 61,
  "reasons": [
    "Covers pre-existing diseases after waiting period",
    "Family floater structure suits multi-member families",
    "Strong hospital network nationally"
  ]
}

Technology Stack
Frontend

React + Vite

Tailwind CSS

Firebase Authentication

Markdown-based chatbot UI

Optional voice output (browser-based)

Backend

Node.js + Express

PostgreSQL + pgvector (for RAG)

Custom Rule Engine (explainable scoring)

LLM support:

Ollama (local, free)

Google Gemini

OpenAI (optional)

Running the Project Locally (FULL PROCESS)
1️⃣ Prerequisites

Node.js 16+

npm

(Optional but recommended) Ollama

Install Ollama and pull a model:

ollama pull llama3

2️⃣ Backend Setup
cd backend
npm install


Create backend/.env:

Option A — Run fully local (FREE, recommended)
PORT=5174
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3


Start Ollama:

ollama run llama3

Option B — Gemini (optional)
PORT=5174
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_api_key_here

3️⃣ Build RAG Data (One-time)
node scripts/buildChunks.js
node -r dotenv/config scripts/embedChunks.js


Expected:

✅ Built chunks
✅ All chunks embedded & stored

4️⃣ Start Backend Server
npm start


Backend runs at:

http://localhost:5174

5️⃣ Frontend Setup
cd ../frontend
npm install


Create frontend/.env:

VITE_API_URL=http://localhost:5174


Start frontend:-

npm run dev


Frontend runs at:

http://localhost:5173

Project Structure (Simplified)
gemini-api/
├── server.js
├── rag.js
├── rules.js              # Rule engine with score explanations
├── policy_chunks.json
├── health_policies.migrated.json
├── scripts/
│   ├── buildChunks.js
│   └── embedChunks.js
└── .env

frontend/
├── src/components/
│   ├── Chatbot.jsx
│   ├── ClaimChecker.jsx
│   └── ...
└── .env

Data Integrity Rules (STRICT)

❌ No hallucinated claim ratios

❌ No assumed disease coverage

❌ No city-level hospital claims without data

✅ “Data not available” shown clearly

✅ All insurer metrics marked indicative

Core Use Cases:-

Policy comparison with explanations

Claim eligibility pre-check

Farmer insurance advisory (drought/flood)

Family & medical-condition-based recommendations

Early-stage claim guidance

Future Enhancements

City-level hospital network data

OCR for scanned documents

Multilingual support

User dashboards & saved comparisons

Claim status tracking

Summary:-

qk.ai is not just a chatbot.

It is an explainable insurance advisory engine built with:

Rule validation

Transparent AI reasoning

No hallucination

Local & cloud LLM support