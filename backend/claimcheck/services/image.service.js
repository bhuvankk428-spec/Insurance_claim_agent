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

const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
const MIN_CONFIDENCE = Number(process.env.OPENAI_VISION_MIN_CONFIDENCE || 0.6);

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

function toBase64DataUrl(buffer, mimeType = "image/jpeg") {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

export async function verifyIncidentWithVision({
  image,
  incident,
  domain,
  policyData,
  firData,
}) {
  if (!openai || !image) {
    return { status: "skipped", reason: "Vision not configured" };
  }

  const incidentText = incident || "unknown incident";
  const prompt = `
You are verifying whether an incident photo matches the claim evidence and assessing image quality.

Domain: ${domain}
Incident described in documents: ${incidentText}
Policy details: ${JSON.stringify(policyData || {}, null, 2)}
Evidence details: ${JSON.stringify(firData || {}, null, 2)}

Return STRICT JSON only:
{
  "consistent": true | false | "uncertain",
  "reason": "short explanation",
  "confidence": 0.0-1.0,
  "quality": {
    "blur": true | false,
    "irrelevant": true | false,
    "suspected_fake": true | false,
    "notes": "short note"
  }
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: VISION_MODEL,
      temperature: 0.2,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content:
            "You verify whether a photo matches the described incident and return strict JSON.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: toBase64DataUrl(image.buffer, image.mimetype),
              },
            },
          ],
        },
      ],
    });

    const text = response.choices?.[0]?.message?.content || "";
    const parsed = extractJSON(text);
    if (!parsed) {
      return { status: "skipped", reason: "Vision response invalid" };
    }

    const confidence = Number(parsed.confidence ?? 0);
    const quality = parsed.quality || {};

    if (quality.suspected_fake || quality.irrelevant) {
      return {
        status: "reject",
        reason:
          quality.notes ||
          "Image appears irrelevant or manipulated and cannot be verified",
        confidence,
        quality,
      };
    }

    if (quality.blur) {
      return {
        status: "partial",
        reason: quality.notes || "Image is blurry or low quality",
        confidence,
        quality,
      };
    }

    if (parsed.consistent === false) {
      return {
        status: "reject",
        reason: parsed.reason || "Image does not match incident",
        confidence,
        quality,
      };
    }

    if (parsed.consistent === "uncertain") {
      return {
        status: "partial",
        reason: parsed.reason || "Image evidence uncertain",
        confidence,
        quality,
      };
    }

    const okStatus =
      confidence < MIN_CONFIDENCE ? "partial" : "ok";

    return {
      status: okStatus,
      reason: parsed.reason || "Image matches incident",
      confidence,
      quality,
    };
  } catch (err) {
    return {
      status: "skipped",
      reason: err?.message || "Vision verification failed",
    };
  }
}
