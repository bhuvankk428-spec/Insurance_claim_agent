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

const PAIRS = {
  gemini_grok: ["Gemini", "Grok"],
  openai_grok: ["OpenAI", "Grok"],
  openai_gemini: ["OpenAI", "Gemini"],
};

const TRENDING_TOPICS = [
  "AI spending and mega-cap earnings impact on global markets",
  "Interest-rate outlook and bond market reactions",
  "Bitcoin and ETF flows versus risk-on equities",
  "Oil price volatility and inflation expectations",
  "Retail investing behavior in high-volatility sectors",
];

function pickTrendingTopic() {
  const index = Math.floor(Math.random() * TRENDING_TOPICS.length);
  return TRENDING_TOPICS[index];
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (_err) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("Model output was not valid JSON");
  }
}

export async function generateFinancePodcast({
  topic,
  pair = "gemini_grok",
  durationMinutes = 10,
}) {
  if (!openai) {
    const err = new Error("OpenAI API key not configured");
    err.status = 503;
    throw err;
  }

  const [speakerA, speakerB] = PAIRS[pair] || PAIRS.gemini_grok;
  const selectedTopic = (topic || "").trim() || pickTrendingTopic();
  const targetWords = Math.max(500, Math.min(2200, durationMinutes * 125));
  const turnCount = Math.max(10, Math.min(24, Math.round(durationMinutes * 1.8)));

  const prompt = `
Create a finance podcast-style dialogue in JSON.

Requirements:
- Topic: "${selectedTopic}"
- Speakers: "${speakerA}" and "${speakerB}"
- Alternate turns in a natural Q&A podcast format.
- One host asks challenging questions and the other answers with concrete finance reasoning.
- Keep tone informative, practical, and easy to follow.
- Target spoken length around ${durationMinutes} minutes (~${targetWords} words total).
- Total turns: around ${turnCount} turns.
- No markdown. No bullet points inside dialogue lines.

Return ONLY strict JSON with this shape:
{
  "title": "string",
  "topic": "string",
  "estimatedDurationMinutes": number,
  "pair": "string",
  "dialogue": [
    { "speaker": "${speakerA}", "text": "string" },
    { "speaker": "${speakerB}", "text": "string" }
  ]
}
`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
    temperature: 0.6,
    max_tokens: Number(process.env.OPENAI_PODCAST_MAX_TOKENS || 2500),
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You generate realistic, factual, and educational finance podcast scripts in valid JSON.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion?.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse(raw);
  const dialogue = Array.isArray(parsed.dialogue)
    ? parsed.dialogue
        .map((line) => ({
          speaker: String(line?.speaker || "").trim(),
          text: String(line?.text || "").trim(),
        }))
        .filter((line) => line.speaker && line.text)
    : [];

  if (!dialogue.length) {
    const err = new Error("Failed to generate podcast dialogue");
    err.status = 502;
    throw err;
  }

  return {
    title: String(parsed.title || `${speakerA} x ${speakerB}: Finance Talk`),
    topic: String(parsed.topic || selectedTopic),
    pair,
    estimatedDurationMinutes: Number(parsed.estimatedDurationMinutes || durationMinutes),
    dialogue,
  };
}
