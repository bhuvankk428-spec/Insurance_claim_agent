# qk.ai — AI-Assisted Insurance Claim Helper

## Project Overview
qk.ai is a modern, AI-powered web application designed to simplify insurance interactions by helping users understand claim eligibility, gather required documents, and receive AI-generated guidance.  
Using **Google Gemini LLM**, secure PDF checks, and a step-by-step workflow, users can upload their policy, FIR, accident photos, and describe what happened—after which the AI analyzes everything and provides clear next steps.

The system includes:
- A **three-step claim checker**
- A **claim story analyzer**
- A **policy search & summarizer**
- A modern, responsive frontend with React + Tailwind CSS
- A backend powered by Node.js/Express with Gemini API integration

---

## Key Features

### 🔐 Authentication
- Login + Register with **email/password**
- **Google Authentication** support
- Built using **Firebase Authentication**

### 🚗 3-Step Policy Claim Workflow
1. **Policy PDF Verification**  
   - Upload policy PDF  
   - Backend validates coverage and checks if the claim is even possible  
   - UI shows instant success/error feedback  

2. **FIR / Complaint Upload**  
   - Upload FIR/complaint  
   - Backend checks relevance, structure, and matches it with policy context  

3. **Accident Photo Upload**  
   - Upload scene images  
   - Backend verifies consistency with FIR + policy  
   - Ensures enough evidence before allowing user to proceed  

Each step includes:
- Loading states  
- Success/error banners  
- Step locking until validation passes  

### 📝 Claim Story Analysis
- Users describe what happened in natural language  
- Backend sends text + policy context to **Google Gemini**  
- Returns:
  - Coverage likelihood
  - Explanation in clean Markdown
  - Claim code (when applicable)

### 🔍 Policy Summarizer & Search
- Users can ask insurance questions such as:
  - *“Best car insurance?”*  
  - *“Explain third-party coverage.”*  
- Gemini returns:
  - Markdown summaries
  - Recommendations
  - Easy beginner-friendly explanations  

---

## Additional App Features

- **Interactive Chatbot UI** using Markdown output  
- **PDF Upload & Validation System**  
- **SPA Navigation** with React Router v6  
- **Fully styled Dark Theme** using Tailwind CSS  
- **Node/Express JSON APIs** for:
  - Policy checking  
  - Evidence upload  
  - AI story analysis  

---

## Requirements

- **Node.js 16+**  
- **npm**  
- **Google Gemini API Key**  
  - Create one from **Gemini Studio**
  - Add to backend `.env`:

    ```env
    GEMINI_API_KEY=your_gemini_studio_api_key_here
    ```

---

## Setup and Run Instructions

qk.ai has a **backend (Express + Gemini)** and **frontend (React + Vite/CRA)**.  
Run them separately.

---

### 1. Start the Backend

```bash
cd backend
npm install        # first time only
npm start          # runs server on http://localhost:5174
```

Expected output:

```
Server running on http://localhost:5174
```

Backend `.env` MUST include:

```env
GEMINI_API_KEY=your_gemini_studio_api_key_here
```

---

### 2. Configure the Frontend Environment

Create `.env` inside the frontend folder:

```env
VITE_API_URL=http://localhost:5174
```

> Restart frontend when `.env` changes.

All API calls use:

```js
const API_BASE = import.meta.env.VITE_API_URL;
```

---

### 3. Start the Frontend (React)

```bash
npm install        # first time only
npm run dev        # or npm start for CRA
```

Frontend runs at:

- **Vite:** http://localhost:5173  
- **CRA:**  http://localhost:3000  

> All API requests automatically route to **http://localhost:5174**

---

## Project Structure

```
src/
├── components/
│   ├── LoginForm.jsx
│   ├── RegisterForm.jsx
│   ├── ChooserPage.jsx
│   ├── Chatbot.jsx
│   ├── ClaimChecker.jsx
│   └── ...
├── server.js           # Node.js backend API server
├── policy.json         # Policy database JSON
├── style.css           # Tailwind + global styles
├── App.jsx             # React route declarations
└── ...
```

---

## Architecture Overview

### 🖥️ Frontend (React)
- Tailwind CSS UI  
- Firebase Authentication  
- Step-by-step controlled workflow  
- Intelligent banners + validation  
- Markdown-based chatbot responses  

### ⚙️ Backend (Node + Express)
- Gemini-powered AI reasoning  
- Document validation + evidence analysis  
- JSON API endpoints for upload and story assessment  
- Policy search + summarization  

---

## Core Use Cases

- Determine **whether a claim is likely valid**  
- Guide users in submitting the **right evidence**  
- Provide **AI-generated explanations**  
- Offer simple, understandable insurance knowledge  
- Automate the early stages of the claim process  

---

## Future Plans

- **Advanced Claim Analysis** using ML/NLP  
- **User Profiles & Persistence**  
  - Chat history  
  - Saved claims  
  - Policy tracking  
- **OCR Support** for scanned images  
- **Multi-Language Accessibility**  

---

