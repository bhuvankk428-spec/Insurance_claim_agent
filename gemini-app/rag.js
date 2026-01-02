import { retrieveChunks } from "./retrieval.js";
import { scorePolicy } from "./rules.js";

/**
 * RAG decision engine
 * - No hallucination
 * - Policy comparison enforced
 * - Personalised if details provided
 * - Asks clarifying questions if data missing
 */
export async function askRAG({ question, domain = null, details = {} }) {
  // 1️⃣ Retrieve relevant chunks
  const rawChunks = await retrieveChunks({
  question,
  domain,
  limit: 10,
});

// Apply rules
const scored = rawChunks.map(c => ({
  ...c,
  ruleScore: scorePolicy(c, details),
}));

// Sort by rule score
const chunks = scored
  .sort((a, b) => b.ruleScore - a.ruleScore)
  .slice(0, 6);


  // ❌ If nothing relevant found
  if (!chunks || chunks.length === 0) {
    return {
      answer: `❌ **No suitable policy found**

The available policy documents do not contain enough information to answer this query.

Please provide more details such as:
- Location
- Type of insurance needed
- Budget or priority (low premium / high coverage)

This will help improve the recommendation.`,
      confidence: 30,
    };
  }

  // 2️⃣ Build policy context
  const context = chunks
    .map(
      (c, i) =>
        `(${i + 1}) Policy: ${c.policy_name}\nSection: ${c.section}\n${c.content}`
    )
    .join("\n\n");

  // 3️⃣ Build decision-grade prompt (STRICT)
  const prompt = `
You are a senior insurance advisor in India with 15+ years of experience.

User profile:
- Location: ${details.location || "Not specified"}
- Occupation: ${details.occupation || "Not specified"}
- Family details: ${details.family || "Not specified"}
- Health conditions: ${details.health || "Not specified"}
- Crop type (if farmer): ${details.crop || "Not specified"}
- Budget preference: ${details.budget || "Not specified"}

User question:
${question}

Policies (retrieved ONLY from official policy documents):
${context}

STRICT RULES (VERY IMPORTANT):
- You MUST compare Policy A vs Policy B.
- You MUST pick exactly ONE best policy.
- Use ONLY information present in the policy documents.
- Do NOT invent claim settlement ratios, hospital networks, or insurer reputation.
- If drought, flood, heart disease coverage, or premium subsidy is NOT mentioned, clearly say "data not available".
- If information is insufficient to decide, say so and ask clarifying questions.
- Use **bold** for policy names.
- Be confident, practical, and decisive.
- DO NOT output JSON.
- Write clean Markdown only.

FORMAT (follow strictly):

✅ **Recommended policy**
<policy name>

### Comparison
**Policy A**: <pros / cons>
**Policy B**: <pros / cons>

### Why this is best
<reasoning tied to user profile and region>

### Claim process
<simple explanation>

If no policy fits, start with:
❌ **No suitable policy found**
`;

  // 4️⃣ Call Ollama (local, free)
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      prompt,
      stream: false,
    }),
  });

  const data = await response.json();
  const answer = data.response || "Unable to generate response.";

  // 5️⃣ Confidence score (based on retrieval strength)
  const avgSim =
    chunks.reduce((s, c) => s + c.similarity, 0) / chunks.length;

  const confidence = Math.round(
    Math.min(85, Math.max(35, avgSim * 100))
  );

  return { answer, confidence };
}
