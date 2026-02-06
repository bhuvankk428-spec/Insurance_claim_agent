import OpenAI from "openai";
import { retrieveChunks } from "./retrieval.js";
import { scorePolicy } from "./rules.js";

const hasOpenAIKey =
  Boolean(process.env.OPENAI_API_KEY) &&
  !process.env.OPENAI_API_KEY.startsWith("your_");

const openai = hasOpenAIKey
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: Number(process.env.OPENAI_TIMEOUT_MS || 60000),
    })
  : null;

const MAX_RETRIES = Number(process.env.OPENAI_MAX_RETRIES || 2);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(err) {
  const status = err?.status;
  if (!status) return false;
  return [408, 429, 500, 502, 503, 504].includes(status);
}

async function withRetry(fn, retries = MAX_RETRIES) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > retries || !isRetryable(err)) {
        throw err;
      }
      const backoff = 300 * Math.pow(2, attempt);
      await sleep(backoff);
    }
  }
}

export async function askRAGStream({
  question,
  domain = null,
  details = {},
  onToken,
}) {
  /* Step 1: Retrieve chunks */
  const policyName =
    details?.policy_name || details?.policyName || details?.policy;
  const rawChunks = await retrieveChunks({
    question,
    domain,
    policyName,
    limit: 6,
  });

  if (!rawChunks?.length) {
    onToken("No suitable policy found.\n\nPlease provide more details.");
    return;
  }

  /* Step 2: Rank (hybrid: rules + vector) */
  const chunks = rawChunks
    .map((c) => ({
      ...c,
      score: scorePolicy(c, details) * 0.7 + c.similarity * 0.3,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  /* Step 3: Compact context */
  const context = chunks
    .map(
      (c, i) =>
        `(${i + 1}) ${c.policy_name} - ${c.section}\n${(c.content || "")
          .slice(0, 800)
          .trim()}`
    )
    .join("\n\n");

  /* Step 4: Tight prompt */
  const prompt = `
You are an insurance advisor. Use ONLY the policy excerpts below.
If data is missing, say "data not available".

Question:
${question}

Policy excerpts:
${context}

Answer in Markdown with:
**Recommended policy**
### Comparison (2-4 bullets)
### Why this is best (2-4 bullets)
### Claim process (3-6 steps)
`;

  /* Step 5: Stream from OpenAI */
  const maxTokens = Number(process.env.OPENAI_MAX_TOKENS || 350);

  if (openai) {
    const stream = await withRetry(() =>
      openai.chat.completions.create({
        model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: maxTokens,
        stream: true,
        messages: [
          {
            role: "system",
            content:
              "You are an insurance advisor. Answer only with the given policy excerpts.",
          },
          { role: "user", content: prompt },
        ],
      })
    );

    for await (const chunk of stream) {
      const token = chunk?.choices?.[0]?.delta?.content;
      if (token) onToken(token);
    }
    return;
  }

  const err = new Error("OpenAI API key not configured");
  err.status = 503;
  throw err;
}
