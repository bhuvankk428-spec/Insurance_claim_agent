import OpenAI from "openai";
import { retrieveChunks } from "./retrieval.js";
import { scorePolicy } from "./rules.js";
import { getPolicyByName } from "./policyCatalog.js";

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

function buildFallbackAnswer(chunks, language = "en") {
  const groupedPolicies = Array.from(
    chunks.reduce((map, chunk) => {
      const existing = map.get(chunk.policy_name) || {
        policy_name: chunk.policy_name,
        chunks: [],
        bestScore: Number.NEGATIVE_INFINITY,
      };
      existing.chunks.push(chunk);
      existing.bestScore = Math.max(
        existing.bestScore,
        Number(chunk.score ?? chunk.similarity ?? 0)
      );
      map.set(chunk.policy_name, existing);
      return map;
    }, new Map()).values()
  ).sort((a, b) => b.bestScore - a.bestScore);

  const primaryPolicy = groupedPolicies[0];
  const primary = pickPrimaryChunk(primaryPolicy?.chunks || []);
  const comparisons = groupedPolicies.slice(1, 4);

  const templates = {
    en: {
      recommended: "Recommended policy",
      comparison: "Comparison",
      best: "Why this is best",
      process: "Claim process",
      unavailable: "data not available",
      processSteps: [
        "Keep the policy number and insured member details ready.",
        "Collect supporting documents listed in the matched policy sections.",
        "Inform the insurer or hospital/agent and start the claim within the policy timeline.",
        "Submit the claim form and required evidence, then track the insurer response.",
      ],
    },
    hi: {
      recommended: "सुझाई गई पॉलिसी",
      comparison: "तुलना",
      best: "यह सबसे बेहतर क्यों है",
      process: "क्लेम प्रक्रिया",
      unavailable: "data not available",
      processSteps: [
        "पॉलिसी नंबर और बीमित सदस्य की जानकारी तैयार रखें।",
        "मिलान की गई पॉलिसी धाराओं में मांगे गए दस्तावेज़ इकट्ठा करें।",
        "बीमाकर्ता, अस्पताल या एजेंट को समय सीमा के भीतर सूचित करें।",
        "क्लेम फॉर्म और दस्तावेज़ जमा करें, फिर स्टेटस ट्रैक करें।",
      ],
    },
    te: {
      recommended: "సిఫారసు చేసిన పాలసీ",
      comparison: "పోలిక",
      best: "ఇది ఎందుకు ఉత్తమం",
      process: "క్లెయిమ్ ప్రక్రియ",
      unavailable: "data not available",
      processSteps: [
        "పాలసీ నంబర్ మరియు బీమా సభ్యుల వివరాలు సిద్ధంగా ఉంచండి.",
        "సరిపోలిన పాలసీ భాగాల్లో ఉన్న పత్రాలు సేకరించండి.",
        "పాలసీ గడువులో బీమా సంస్థ లేదా ఆసుపత్రికి సమాచారం ఇవ్వండి.",
        "క్లెయిమ్ ఫారం మరియు ఆధారాలు సమర్పించి స్థితిని ట్రాక్ చేయండి.",
      ],
    },
    kn: {
      recommended: "ಶಿಫಾರಸು ಮಾಡಿದ ಪಾಲಿಸಿ",
      comparison: "ಹೋಲಿಕೆ",
      best: "ಇದು ಏಕೆ ಉತ್ತಮ",
      process: "ಕ್ಲೇಮ್ ಪ್ರಕ್ರಿಯೆ",
      unavailable: "data not available",
      processSteps: [
        "ಪಾಲಿಸಿ ಸಂಖ್ಯೆ ಮತ್ತು ವಿಮಿತ ಸದಸ್ಯರ ವಿವರಗಳನ್ನು ಸಿದ್ಧವಾಗಿಡಿ.",
        "ಹೊಂದಾಣಿಕೆಯಾದ ಪಾಲಿಸಿ ವಿಭಾಗಗಳಲ್ಲಿ ಕೇಳಿರುವ ದಾಖಲೆಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ.",
        "ಗಡುವಿನೊಳಗೆ ವಿಮಾ ಸಂಸ್ಥೆ ಅಥವಾ ಆಸ್ಪತ್ರೆ ಅಥವಾ ಏಜೆಂಟ್‌ಗೆ ತಿಳಿಸಿ.",
        "ಕ್ಲೇಮ್ ಫಾರ್ಮ್ ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ಸಲ್ಲಿಸಿ, ನಂತರ ಸ್ಥಿತಿಯನ್ನು ಗಮನಿಸಿ.",
      ],
    },
  };

  const t = templates[language] || templates.en;
  const bestSection = humanizeSection(primary?.section, t.unavailable);
  const bestContent = summarizeChunk(primary) || t.unavailable;

  const comparisonLines = comparisons.length
    ? comparisons.map(
        (policy) =>
          `- **${policy.policy_name}**: ${comparisonSummary(policy.chunks, t.unavailable)}`
      )
    : [`- ${t.unavailable}`];

  const whyBest = [
    `- **${primary?.policy_name || t.unavailable}** matched the request most closely.`,
    `- Strongest evidence came from ${bestSection}.`,
    `- Relevant detail: ${bestContent.slice(0, 220) || t.unavailable}`,
  ];

  const processLines = t.processSteps.map((step) => `1. ${step}`);

  return [
    `**${t.recommended}**`,
    `${primary?.policy_name || t.unavailable}`,
    "",
    `### ${t.comparison}`,
    ...comparisonLines,
    "",
    `### ${t.best}`,
    ...whyBest,
    "",
    `### ${t.process}`,
    ...processLines,
  ].join("\n");
}

function pickPrimaryChunk(chunks) {
  if (!chunks.length) return null;
  const priorities = ["raw_text", "best_for"];
  for (const section of priorities) {
    const match = chunks.find((chunk) => chunk.section === section);
    if (match) return match;
  }
  const coverageMatch = chunks.find((chunk) => chunk.section?.startsWith("coverage."));
  if (coverageMatch) return coverageMatch;
  return chunks[0];
}

function summarizeChunk(chunk) {
  if (!chunk?.content) return "";
  return String(chunk.content)
    .replace(/^[a-z_.]+:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function humanizeSection(section, fallback) {
  if (!section) return fallback;

  const labels = {
    raw_text: "the policy overview",
    best_for: "the best-fit criteria",
    "claim_process.notes": "the claim support details",
  };

  if (labels[section]) return labels[section];
  if (section.startsWith("coverage.")) {
    return `coverage details about ${section.split(".").slice(1).join(" ")}`;
  }
  if (section.startsWith("family.")) {
    return "family suitability details";
  }
  if (section.startsWith("financials.")) {
    return "pricing and financial details";
  }
  return section.replace(/\./g, " ");
}

function comparisonSummary(chunks, fallback) {
  const primary = pickPrimaryChunk(chunks);
  const text = summarizeChunk(primary);
  return text ? text.slice(0, 120) : fallback;
}

function takeTopDistinctPolicies(chunks, limit = 4) {
  const seenPolicies = new Set();
  const selected = [];

  for (const chunk of chunks) {
    if (seenPolicies.has(chunk.policy_name)) continue;
    seenPolicies.add(chunk.policy_name);
    selected.push(chunk);
    if (selected.length >= limit) break;
  }

  return selected;
}

function extractUserSignals(question, details = {}) {
  const detailText =
    typeof details?.text === "string"
      ? details.text
      : typeof details === "string"
        ? details
        : Object.values(details || {}).join(" ");
  const combined = `${question || ""} ${detailText}`.toLowerCase();

  const signals = {
    raw_text: combined,
  };

  if (
    /\bfamily\b|\bparents\b|\bchildren\b|\bchild\b|\bspouse\b|\bmembers\b/.test(
      combined
    )
  ) {
    signals.family = true;
  }

  const familySizeMatch = combined.match(/(?:family size|members?)\s*(?:is|=|:)?\s*(\d+)/);
  if (familySizeMatch) {
    signals.family_size = Number(familySizeMatch[1]);
  }

  if (
    /\bhealth\b|\bhospital\b|\bmedical\b|\bpre-existing\b|\bpre existing\b|\bheart\b/.test(
      combined
    )
  ) {
    signals.health = combined;
  }

  if (/\blow budget\b|\bcheap\b|\baffordable\b|\blow premium\b/.test(combined)) {
    signals.budget = "low";
  }

  return signals;
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

  const userSignals = extractUserSignals(question, details);
  const rankedChunks = rawChunks
    .map((c) => ({
      ...c,
      policy: getPolicyByName(c.policy_name),
    }))
    .map((c) => {
      const scoredPolicy = c.policy
        ? { ...c.policy, similarity: c.similarity, content: c.content }
        : { ...c, similarity: c.similarity };
      return {
        ...c,
        score: scorePolicy(scoredPolicy, userSignals) * 0.7 + c.similarity * 0.3,
      };
    })
    .sort((a, b) => b.score - a.score);

  const chunks = takeTopDistinctPolicies(rankedChunks, 4);

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
    try {
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
    } catch (err) {
      console.warn(
        `OpenAI chat failed, returning fallback response: ${err.message}`
      );
      onToken(buildFallbackAnswer(chunks, language));
      return;
    }
  }

  onToken(buildFallbackAnswer(chunks, language));
}
