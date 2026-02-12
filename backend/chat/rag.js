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
  language = "en",
  details = {},
  onToken,
}) {
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

  const chunks = rawChunks
    .map((c) => ({
      ...c,
      score: scorePolicy(c, details) * 0.7 + c.similarity * 0.3,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const context = chunks
    .map(
      (c, i) =>
        `(${i + 1}) ${c.policy_name} - ${c.section}\n${(c.content || "")
          .slice(0, 800)
          .trim()}`
    )
    .join("\n\n");

  const languageConfig = {
    en: {
      label: "English",
      rule: "Respond only in English.",
      structure: `Answer in Markdown with:
**Recommended policy**
### Comparison (2-4 bullets)
### Why this is best (2-4 bullets)
### Claim process (3-6 steps)`,
    },
    hi: {
      label: "Hindi",
      rule:
        "Respond only in Hindi (Devanagari script). Do not answer in English except exact policy/product names.",
      structure: `उत्तर Markdown में इस संरचना में दें:
**सुझाई गई पॉलिसी**
### तुलना (2-4 बिंदु)
### यह सबसे बेहतर क्यों है (2-4 बिंदु)
### क्लेम प्रक्रिया (3-6 चरण)`,
    },
    te: {
      label: "Telugu",
      rule:
        "Respond only in Telugu script. Do not answer in English except exact policy/product names.",
      structure: `Markdown లో ఈ నిర్మాణంలో సమాధానం ఇవ్వండి:
**సిఫారసు చేసిన పాలసీ**
### పోలిక (2-4 పాయింట్లు)
### ఇది ఎందుకు ఉత్తమం (2-4 పాయింట్లు)
### క్లెయిమ్ ప్రక్రియ (3-6 దశలు)`,
    },
    kn: {
      label: "Kannada",
      rule:
        "Respond only in Kannada script. Do not answer in English except exact policy/product names.",
      structure: `Markdown ನಲ್ಲಿ ಈ ರಚನೆಯಲ್ಲಿ ಉತ್ತರಿಸಿ:
**ಶಿಫಾರಸು ಮಾಡಿದ ಪಾಲಿಸಿ**
### ಹೋಲಿಕೆ (2-4 ಅಂಶಗಳು)
### ಇದು ಏಕೆ ಉತ್ತಮ (2-4 ಅಂಶಗಳು)
### ಕ್ಲೇಮ್ ಪ್ರಕ್ರಿಯೆ (3-6 ಹಂತಗಳು)`,
    },
  };
  const selectedLanguage = languageConfig[language] || languageConfig.en;

  const prompt = `
You are an insurance advisor. Use ONLY the policy excerpts below.
If data is missing, say "data not available".
${selectedLanguage.rule}

Question:
${question}

Policy excerpts:
${context}

${selectedLanguage.structure}
`;

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
            content: `You are an insurance advisor. Answer only with the given policy excerpts. The response language must be ${selectedLanguage.label}. Follow language strictly.`,
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
