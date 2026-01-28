# 🚀 QK.AI — Intelligent Insurance Policy Advisor

**QK.AI** is an AI-powered insurance assistant that helps users **understand, compare, and evaluate insurance policies** using natural language.

It leverages a **Retrieval-Augmented Generation (RAG)** pipeline with **local LLMs via Ollama**, ensuring fast, private, and cost-free AI inference — no paid APIs required.

---

## ✨ Features

* 🧠 AI-powered insurance policy advisor
* 📂 Policy data stored and processed in **structured JSON format**
* 🔎 Semantic search using **pgvector embeddings**
* ⚡ **Streaming AI responses** for real-time interaction
* 🔐 Secure authentication with **Firebase (Email & Google)**
* 🎯 Confidence-based policy recommendations
* 🖥️ Modern, responsive UI (React + Tailwind)

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* React Router
* Firebase Authentication

### Backend

* Node.js (Express)
* PostgreSQL + pgvector
* Ollama (Local LLM + Embeddings)
* RAG Architecture
* Streaming NDJSON responses

---

## 🧩 How It Works

1. User asks a question in natural language
2. Relevant policy chunks are retrieved from PostgreSQL using vector similarity
3. Results are ranked using business rules
4. Context-aware prompts are sent to a local Ollama LLM
5. AI streams an explainable insurance recommendation in real time

---

## ⚙️ How to Run the Project (Step-by-Step)

> ⚠️ **Use three separate terminals**

---

### 🟢 Terminal 1 — Start Ollama

```bash
ollama serve
```

Ensure required models are installed:

```bash
ollama pull llama3
ollama pull nomic-embed-text
```

---

### 🔵 Terminal 2 — Start Backend

```bash
cd backend/gemini-app
npm install
npm start
```

Backend runs on:

```
http://localhost:5174
```

---

### 🟣 Terminal 3 — Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## 🔐 Authentication

* Email & Password login
* Google OAuth login
* Firebase-backed authentication
* Protected routes after login

---

## 📂 Data Format

* Insurance policies are stored as **JSON chunks**
* Each chunk includes:

  * Policy name
  * Domain (Health, Motor, Travel, etc.)
  * Section
  * Text content
  * Vector embedding

This structure enables fast retrieval and explainable AI responses.

---

## 👨‍💻 Author

**Bhuvan KK**
Full-Stack Developer | AI Engineer
📧 [bhuvankk2005@gmail.com](mailto:bhuvankk2005@gmail.com)
📞 +91 90366 94320

---

## 📜 License

MIT License — open-source and free to use.

---

> **QK.AI** — *Smarter insurance decisions, powered by local AI.*


