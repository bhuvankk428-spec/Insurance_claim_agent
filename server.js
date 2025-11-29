import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";
import multer from "multer";
import * as pdfParse from "pdf-parse";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const rawPolicies = fs.readFileSync("./policy.json", "utf-8");
const policies = JSON.parse(rawPolicies);
const policySnippet = JSON.stringify(policies).slice(0, 3000);

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/api/gemini-chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const combinedPrompt = `
Act as an experienced insurance advisor. Based on the following user question and our available policies, present a clear, friendly, and personalized answer.
If possible, recommend the most relevant policy for the user's needs and highlight why it suits them.

User question: ${prompt}

Relevant Policies (JSON): ${policySnippet}

Instructions:
- Greet the user warmly (e.g., "Hi! Here’s your best car insurance match...")
- Use bullet points for benefits and exclusions.
- Briefly explain why this policy is suitable.
- End with a helpful call-to-action (suggest what the user should do next).

Format your answer in clear markdown for best readability.
    `.trim();

    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: combinedPrompt }],
          },
        ],
      }),
    });

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
    res.json({ text });

  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Gemini API Error" });
  }
});

const upload = multer();

app.post("/api/claim-check", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ valid: false, message: "No file." });
    
    // For simple acceptance, no validation:
    // const pdfData = await pdfParse(req.file.buffer);
    // const text = pdfData.text;
    // const isValid = text.includes("Claim Number") && text.includes("Policy Number");
    // const message = isValid ? "Contains required fields." : "Required policy or claim information is missing.";

    // For now just accept:
    res.json({ valid: true, message: "PDF accepted." });
  } catch (error) {
    console.error("Claim check error:", error);
    res.status(500).json({ valid: false, message: "File could not be processed." });
  }
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




app.post("/api/claim-story", async (req, res) => {
  try {
    const { story } = req.body;
    if (!story) return res.status(400).json({ error: "Story required" });

    // Build a Gemini prompt to determine claim eligibility and generate code
    const prompt = `
You are an insurance claims AI assistant.
User Story: ${story}

Based on this story, decide if the claim should be accepted or rejected.
If accepted, generate a unique claim code in format CLAIM-XXXXXX where X are digits.
Respond with eligibility (yes/no), explanation, and claim code if eligible.
`;

    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      }),
    });

    const data = await geminiRes.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    // Parse answer here or trust the AI's reply (for demo, we'll send raw answer)
    // You can also add parsing logic to extract eligibility and claim code

    // Simplified demo response:
    res.json({
      answer,
      eligible: answer.toLowerCase().includes("yes"),
      claimCode: answer.match(/CLAIM-\d{6}/)?.[0] || null
    });
  } catch (error) {
    console.error("Claim story API error:", error);
    res.status(500).json({ error: "Claim story processing failed" });
  }
});
