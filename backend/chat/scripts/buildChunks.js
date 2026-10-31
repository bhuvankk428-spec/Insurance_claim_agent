import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const OUTPUT = path.resolve(__dirname, "../policy_chunks.json");

const VALUE_PHRASES = {
  covered_after_waiting_period: "covered after a waiting period",
  conditional: "conditional",
  variant_dependent: "depends on the plan variant",
  optional_or_variant_dependent: "optional or depends on the plan variant",
  unlimited_variant_dependent: "unlimited in some variants",
  product_dependent: "depends on the product",
  individual_or_family: "individual or family",
  individual_or_family_floater: "individual or family floater",
  family_floater: "family floater",
  large_family_floater: "large family floater",
  "3_to_5_members": "3 to 5 members",
  select_cities_variant_dependent: "available in select cities depending on the variant",
  secure_benefit_plus_restore: "secure benefit plus restoration",
  very_low: "very low",
  mid_to_upper_mid: "mid to upper mid",
  upper_mid: "upper middle",
  strong_urban: "strong in urban areas",
  very_strong: "very strong",
  adult_to_senior: "adult to senior",
  yield_based: "yield based",
  area_approach: "area based approach",
  indicative_not_city_specific: "indicative and not specific to a city",
  indicative_not_product_specific: "indicative and not specific to a product",
};

function humanize(text) {
  return String(text).replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function describeValue(value) {
  const raw = String(value).trim();
  return VALUE_PHRASES[raw] || humanize(raw);
}

function describeBoolean(key, value) {
  if (key.includes("room_rent_cap")) {
    return value ? "a room rent cap applies" : "there is no room rent cap";
  }
  if (key.includes("government_subsidy")) {
    return value ? "government subsidy is available" : "no government subsidy";
  }
  if (key.includes("government_scheme")) {
    return value ? "this is a government scheme" : "this is not a government scheme";
  }
  if (key.includes("medical_underwriting")) {
    return value ? "medical underwriting applies" : "no medical underwriting";
  }
  if (key.includes("notified_crops_required")) {
    return value ? "only notified crops are covered" : "notified crops are not required";
  }
  if (key.includes("area_based_assessment")) {
    return value ? "assessment is area based" : "assessment is not area based";
  }
  if (key.includes("relationship_rules_apply") || key.includes("age_limits_apply")) {
    return value ? "applies" : "does not apply";
  }
  if (key.endsWith("supported") || key.includes("portability_supported")) {
    return value ? "supported" : "not supported";
  }
  if (/(hospitalization|daycare|chronic_management|modern_treatments|ayush|maternity|personal_accident)/.test(key)) {
    return value ? "covered" : "not covered";
  }
  if (/(restoration|health_checkups|wellness_rewards|wellness_benefits|digital_support|digital_claim_support|cashless_focus|personalization|customization_focus|add_on_flexibility|urban_focus|chronic_care_focus)/.test(key)) {
    return value ? "available" : "not available";
  }
  return value ? "yes" : "no";
}

function renderShortText(sectionPath, text) {
  const raw = String(text).trim();
  const key = sectionPath.toLowerCase();

  if (raw === "true") return describeBoolean(key, true);
  if (raw === "false") return describeBoolean(key, false);
  if (/^\d+$/.test(raw) && /member/.test(key)) return `${raw} members`;
  return describeValue(raw);
}

function isPrimitive(value) {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function addChunk({ chunks, domain, policyName, sectionPath, text }) {
  const cleanText = String(text ?? "").trim();
  if (!cleanText) return;

  const body =
    cleanText.length >= 30
      ? cleanText
      : renderShortText(sectionPath, cleanText);

  chunks.push({
    domain,
    policy_name: policyName,
    section: sectionPath,
    text: `${sectionPath}: ${body}`,
  });
}

function walkValue({ chunks, domain, policyName, value, pathParts }) {
  if (isPrimitive(value)) {
    addChunk({
      chunks,
      domain,
      policyName,
      sectionPath: pathParts.join("."),
      text: value,
    });
    return;
  }

  if (Array.isArray(value)) {
    const allPrimitive = value.every(isPrimitive);
    if (allPrimitive) {
      addChunk({
        chunks,
        domain,
        policyName,
        sectionPath: pathParts.join("."),
        text: value.join("; "),
      });
      return;
    }

    value.forEach((item, idx) => {
      walkValue({
        chunks,
        domain,
        policyName,
        value: item,
        pathParts: [...pathParts, `[${idx}]`],
      });
    });
    return;
  }

  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      walkValue({
        chunks,
        domain,
        policyName,
        value: child,
        pathParts: [...pathParts, key],
      });
    }
  }
}

function loadAllPolicies() {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const policies = [];

  for (const file of files) {
    const content = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, file), "utf-8")
    );

    if (Array.isArray(content)) {
      policies.push(...content);
    } else {
      policies.push(content);
    }
  }

  return policies;
}

function buildChunks(policies) {
  const chunks = [];

  for (const policy of policies) {
    const domain = policy.domain || "Unknown";
    const policyName = policy.policy_name || "Unknown Policy";

    for (const [key, value] of Object.entries(policy)) {
      if (["domain", "policy_name", "insurer"].includes(key)) continue;
      walkValue({
        chunks,
        domain,
        policyName,
        value,
        pathParts: [key],
      });
    }
  }

  return chunks;
}

const policies = loadAllPolicies();
const chunks = buildChunks(policies);

fs.writeFileSync(OUTPUT, JSON.stringify(chunks, null, 2));
console.log(` Built ${chunks.length} chunks`);
