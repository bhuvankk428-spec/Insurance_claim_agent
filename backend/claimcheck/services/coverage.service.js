import OpenAI from "openai";

const hasOpenAIKey =
  Boolean(process.env.OPENAI_API_KEY) &&
  !process.env.OPENAI_API_KEY.startsWith("your_");

const openai = hasOpenAIKey
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: Number(process.env.OPENAI_TIMEOUT_MS || 60000),
    })
  : null;

function extractJSON(text) {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalize(text = "") {
  return text.toLowerCase();
}

function findExclusionWindow(policyText, incident) {
  const text = normalize(policyText);
  const incidentKey = normalize(incident);
  const idx = text.indexOf("exclusion");
  if (idx === -1) return false;
  const window = text.slice(idx, idx + 1200);
  return window.includes(incidentKey);
}

function keywordCoverageHeuristic(policyText, incident) {
  if (!policyText || !incident) {
    return {
      status: "unknown",
      reason: "Coverage not found in policy text",
      confidence: 0.2,
    };
  }

  const policy = normalize(policyText);
  const incidentKey = normalize(incident);

  if (findExclusionWindow(policyText, incident)) {
    return {
      status: "excluded",
      reason: "Incident appears in exclusions",
      confidence: 0.8,
    };
  }

  if (policy.includes(incidentKey)) {
    return {
      status: "covered",
      reason: "Incident appears in coverage section",
      confidence: 0.6,
    };
  }

  return {
    status: "unknown",
    reason: "Incident not mentioned in coverage sections",
    confidence: 0.3,
  };
}

export async function checkCoverage({
  policyText,
  incident,
  domain,
  policyData,
  firData,
}) {
  const fallback = keywordCoverageHeuristic(policyText, incident);

  if (!openai) {
    return fallback;
  }

  const prompt = `
You are validating if the incident is covered by the policy.

Domain: ${domain}
Incident from evidence: ${incident || "unknown"}

Policy text:
${policyText || "not available"}

Policy details:
${JSON.stringify(policyData || {}, null, 2)}

Evidence details:
${JSON.stringify(firData || {}, null, 2)}

  Return STRICT JSON only:
  {
  "status": "covered" | "excluded" | "ambiguous" | "not_covered" | "unknown" | "related",
  "reason": "short explanation",
  "confidence": 0.0-1.0
  }
`;

  const handle = async (client, model) => {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content:
            "You check if the incident is covered by the policy. Return strict JSON only.",
        },
        { role: "user", content: prompt },
      ],
    });

    const text = completion.choices?.[0]?.message?.content || "";
    const parsed = extractJSON(text);
    return parsed || null;
  };

  try {
    if (openai) {
      const parsed = await handle(
        openai,
        process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini"
      );
      if (parsed) return parsed;
    }
  } catch {}

  return fallback;
}
