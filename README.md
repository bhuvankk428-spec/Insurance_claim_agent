qk.ai Insurance Assistant
Project Overview
qk.ai is a modern web application designed to streamline insurance interactions by providing users with personalized policy summaries and claim eligibility verification. Using state-of-the-art AI with Google Gemini LLM and secure PDF claim checks, qk.ai aims to simplify insurance decision-making and claims processing with an intuitive experience.

Features
User Authentication: Login and registration with responsive and polished UI.

Service Selector: Choose between Policy Summarizer or Policy Claim Checker functionality.

Policy Summarizer: AI-powered chatbot delivers personalized, clear, and helpful insurance policy recommendations based on available data.

Policy Claim Checker: Allows secure PDF uploads for claim eligibility checks with backend validations.

Interactive Chatbot UI: AI responses formatted in Markdown for readable and engaging advice.

PDF Upload & Validation: Smooth PDF claim form verification with feedback and controlled progression.

SPA Navigation: Efficient client-side routing with React Router v6.

Consistent Dark Theme: Elegant and user-friendly styling throughout the application with Tailwind CSS.

Requirements
Node.js (16+)

npm

Google Gemini API key

Use Gemini Studio to create an API key.

Set it in your backend .env file as:

env
Copy code
GEMINI_API_KEY=your_gemini_studio_api_key_here
Setup and Run Instructions
qk.ai consists of a backend (Express + Gemini) and a frontend (React + Vite/CRA). Run them separately.

1. Start the backend (Express + Gemini)
From the project root:

bash
Copy code
cd backend
npm install        # only first time
npm start          # starts server.js on http://localhost:5174
Keep this terminal open. You should see something like:

text
Copy code
Server running on http://localhost:5174
Make sure your backend .env contains your Gemini Studio API key:

env
Copy code
GEMINI_API_KEY=your_gemini_studio_api_key_here
2. Configure frontend environment
From the frontend root (where src, public, and package.json for React live), create a .env file:

env
Copy code
VITE_API_URL=http://localhost:5174
Note: Restart the frontend dev server whenever you change .env.

All API calls in the React app should use:

js
Copy code
const API_BASE = import.meta.env.VITE_API_URL;
This will point to your local Express backend at http://localhost:5174.

3. Start the frontend (React app)
From the frontend root:

bash
Copy code
npm install        # only first time
npm run dev        # or npm start if you used CRA
Open the URL printed in the terminal (usually:

http://localhost:5173 for Vite

http://localhost:3000 for Create React App)

React pages run at localhost:5173 (or 3000).

All API calls go to http://localhost:5174 via VITE_API_URL.

Project Structure
text
Copy code
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
├── style.css           # Tailwind and other CSS styles
├── App.jsx             # React router declarations
└── ...

Future Plans:-
Advanced Claim Analysis: Utilize trained ML models for deeper Semantic/NER analysis of claim forms.

User Profiles & Persistence: Implement secure login sessions, data persistence, chat history, and claim tracking.

Multi-Language & Accessibility: Broaden accessibility with multiple languages and assistive technologies.
