// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { embed } from "./embedClient.js";
import { searchVectors } from "./vectorStore.js";
import { buildIndex } from "./buildIndex.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = "gemini-2.5-flash";

app.post("/api/rag-policies", async (req, res) => {
  try {
    const { question, details, domain } = req.body;
    if (!question) {
      return res.json({
        status: "NOT_FOUND",
        answer: "Please ask a valid insurance-related question."
      });
    }

    const query = details
      ? `${question}\nDetails: ${details}`
      : question;

    // 🔹 Retrieve policies
    const qEmbedding = await embed(query);
    const topK = searchVectors({
      embedding: qEmbedding,
      k: 3,
      domain
    });

    if (!topK.length) {
      return res.json({
        status: "NOT_FOUND",
        answer:
          "❌ **No suitable policy found**\n\n" +
          "I couldn’t find a policy matching your requirement.\n\n" +
          "**You can try:**\n" +
          "- Changing the policy domain\n" +
          "- Adding location, budget, or coverage details\n" +
          "- Using a broader search term"
      });
    }

    // 🔹 Build comparison context
    const context = topK
      .map(
        (p, i) => `
Policy ${String.fromCharCode(65 + i)}:
Name: ${p.policy_name}
Domain: ${p.domain}
Insurer: ${p.insurer || "N/A"}
Details:
${p.text}
`
      )
      .join("\n");

    // 🔹 Gemini prompt (decision forced)
    const prompt = `
You are a senior insurance advisor in India.

User question:
${query}

Policies:
${context}

STRICT RULES:
- You MUST compare Policy A vs Policy B.
- You MUST pick exactly ONE best policy.
- If none are suitable, clearly say so.
- DO NOT output JSON.
- Use **bold** for policy names.
- Be confident and decisive.

FORMAT:

✅ **Recommended policy**
<policy name>

### Comparison
**Policy A**: <pros / cons>
**Policy B**: <pros / cons>

### Why this is best
<clear reasoning>

### Claim process
<simple explanation>

If no policy fits, start with:
❌ **No suitable policy found**

Write clean markdown only.
`;

    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim();

    const status = answer.startsWith("❌")
      ? "NOT_FOUND"
      : "FOUND";

    res.json({ status, answer });
  } catch (err) {
    console.error(err);
    res.json({
      status: "NOT_FOUND",
      answer:
        "⚠️ Something went wrong while fetching policy information. Please try again."
    });
  }
});

const PORT = process.env.PORT || 5174;

(async () => {
  await buildIndex();
  app.listen(PORT, () =>
    console.log(`Server running at http://localhost:${PORT}`)
  );
})();
