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

Setup and Run Instructions
bash
# Install frontend and backend dependencies
npm i

# Start backend server in terminal one
node server.js

# Start frontend dev server in terminal two
npm run dev
Backend default port: 5174

Frontend runs with live reload and routing support

Future Plans
Advanced Claim Analysis: Utilize trained ML models for deeper Semantic/NER analysis of claim forms.

User Profiles & Persistence: Implement secure login sessions, data persistence, chat history, and claim tracking.

OCR Support: Add support for scanned photos of documents with text extraction.

Multi-Language & Accessibility: Broaden accessibility with multiple languages and assistive technologies.

Visual Analytics Dashboard: Provide visual summaries of policy coverages and user claims.

Project Structure
text
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
Requirements
Node.js (16+)

npm

Google Gemini API key (set in .env file as GEMINI_API_KEY)

This README details the core goals, current functionality, usage instructions, and roadmap for the qk.ai Insurance Assistant project.