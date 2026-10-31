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

const LABELS = {
  room_rent_cap: "room rent cap",
  pre_existing_disease: "pre-existing disease",
  daycare: "daycare procedures",
  chronic_management: "chronic disease management",
  ayush: "AYUSH treatments",
  personal_accident: "personal accident cover",
  worldwide_emergency: "worldwide emergency coverage",
  travel: "travel coverage",
  annual_health_checkups: "annual health checkups",
  health_checkups: "health checkups",
  wellness_rewards: "wellness rewards",
  advanced_coverage_design: "advanced coverage",
  natural_calamities: "natural calamities",
  post_harvest_coverage: "post-harvest coverage",
  prevented_sowing: "prevented sowing",
  max_members_supported: "maximum members covered",
  recommended_family_size: "recommended family size",
  family_floater: "family floater",
  government_scheme: "government scheme",
  government_subsidy: "government subsidy",
  premium_level: "premium level",
  premium_affordability: "premium affordability",
  kharif: "Kharif premium",
  rabi: "Rabi premium",
  commercial_horticulture: "commercial horticulture premium",
  subsidy_range_percent: "subsidy range",
  network_strength: "hospital network",
  network_hospitals_estimate: "hospital network",
  claim_settlement_ratio_band: "claim settlement ratio",
  csr_confidence: "claim settlement ratio",
  cashless_focus: "cashless claims",
  digital_claim_support: "digital claim support",
  digital_support: "digital support",
  wellness_benefits: "wellness benefits",
  wellness_orientation: "wellness focus",
  add_on_flexibility: "add-on flexibility",
  customization_focus: "customization",
  chronic_care_focus: "chronic care",
  urban_focus: "urban focus",
  age_band: "eligible age band",
  occupation: "eligible occupation",
  portability_supported: "portability",
  adult_and_family_variants: "adult and family variants",
  medical_underwriting: "medical underwriting",
  relationship_rules_apply: "relationship rules",
  age_limits_apply: "age limits",
  notified_crops_required: "notified crops",
  area_based_assessment: "area-based assessment",
  trigger_type: "claim trigger",
  assessment_method: "assessment method",
  customer_support: "customer support",
  policy_types: "policy types",
  plan_variants: "plan variants",
  perils: "perils",
};

const PATH_LABELS = {
  "family.type": "family type",
};

const SECTION_SENTENCES = {
  "insurer_metrics.network_hospitals_estimate": (raw) =>
    `the network has an estimated ${formatCount(raw)} hospitals`,
  "insurer_metrics.claim_settlement_ratio_band": (raw) =>
    `the claim settlement ratio is typically ${raw}`,
  "insurer_metrics.csr_confidence": (raw) =>
    `the claim settlement ratio is ${describeValue(raw)}`,
  "claim_process.customer_support": (raw) =>
    `customer support is available ${raw}`,
  "claim_process.mode": (raw) =>
    `claims are settled via ${raw.split("; ").join(" or ")}`,
  "claims.trigger_type": (raw) =>
    `claims are triggered by ${describeValue(raw).replace(/ based$/, "")}`,
  "claims.assessment_method": (raw) =>
    `claims are assessed using ${article(describeValue(raw))}`,
  "financials.subsidy_range_percent": (raw) =>
    `the subsidy covers ${raw} of the premium`,
  "coverage.advanced_coverage_design": (raw) =>
    `advanced coverage includes ${describeValue(raw)}`,
};

function humanize(text) {
  return String(text).replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function describeValue(value) {
  const raw = String(value).trim();
  return VALUE_PHRASES[raw] || humanize(raw);
}

function formatCount(raw) {
  if (!/^\d{4,}\+?$/.test(raw)) return raw;
  const digits = raw.replace("+", "");
  return `${Number(digits).toLocaleString("en-US")}${raw.endsWith("+") ? "+" : ""}`;
}

function article(phrase) {
  return /^[aeiou]/i.test(phrase) ? `an ${phrase}` : `a ${phrase}`;
}

function leafKey(sectionPath) {
  const parts = sectionPath
    .split(".")
    .filter((part) => !/^\[\d+\]$/.test(part));
  return parts[parts.length - 1] || "";
}

function labelFor(sectionPath) {
  const normalized = sectionPath.replace(/\.\[\d+\]/g, "");
  if (PATH_LABELS[normalized]) return PATH_LABELS[normalized];
  const key = leafKey(sectionPath);
  return LABELS[key] || humanize(key);
}

function isPlural(label) {
  if (/(focus|status|insurance|coverage|assessment|business)$/.test(label)) {
    return false;
  }
  return /(s|ies)$/.test(label);
}

function beClause(sectionPath, predicate) {
  const label = labelFor(sectionPath);
  return `${label} ${isPlural(label) ? "are" : "is"} ${predicate}`;
}

function isRenderableList(raw) {
  if (!raw.includes("; ")) return false;
  const items = raw.split("; ").map((item) => item.trim()).filter(Boolean);
  return items.length > 1 && items.every((item) => item.length <= 25);
}

function renderList(sectionPath, raw) {
  const items = raw.split("; ").map((item) => item.trim()).filter(Boolean);
  const head = items.slice(0, -1).join(", ");
  const tail = items[items.length - 1];
  const label = labelFor(sectionPath);
  return `${label} ${isPlural(label) ? "include" : "includes"} ${head} and ${tail}`;
}

function renderBoolean(sectionPath, value) {
  const key = sectionPath.toLowerCase();

  if (key.includes("room_rent_cap")) {
    return value ? "a room rent cap applies" : "there is no room rent cap";
  }
  if (key.includes("government_subsidy")) {
    return value ? "government subsidy is available" : "no government subsidy is available";
  }
  if (key.includes("government_scheme")) {
    return value ? "this is a government scheme" : "this is not a government scheme";
  }
  if (key.includes("medical_underwriting")) {
    return value ? "medical underwriting applies" : "no medical underwriting is required";
  }
  if (key.includes("notified_crops_required")) {
    return value ? "only notified crops are covered" : "notified crops are not required";
  }
  if (key.includes("area_based_assessment")) {
    return value ? "assessment is area based" : "assessment is not area based";
  }
  if (key.includes("relationship_rules_apply")) {
    return value ? "relationship rules apply" : "relationship rules do not apply";
  }
  if (key.includes("age_limits_apply")) {
    return value ? "age limits apply" : "age limits do not apply";
  }
  if (key.includes("family_floater")) {
    return beClause(sectionPath, value ? "available" : "not available");
  }
  if (key.includes("post_harvest")) {
    return value ? "post-harvest losses are covered" : "post-harvest losses are not covered";
  }
  if (key.includes("natural_calamities")) {
    return value ? "natural calamities are covered" : "natural calamities are not covered";
  }
  if (key.includes("prevented_sowing")) {
    return value ? "prevented sowing is covered" : "prevented sowing is not covered";
  }
  if (key.includes("adult_and_family_variants")) {
    return value ? "adult and family variants are available" : "adult and family variants are not available";
  }
  if (key.includes("portability_supported")) {
    return beClause(sectionPath, value ? "supported" : "not supported");
  }
  if (key.endsWith(".supported") || key === "supported") {
    const label = key.startsWith("family") ? "family coverage" : labelFor(sectionPath);
    return `${label} ${value ? "is supported" : "is not supported"}`;
  }
  if (key.includes("personal_accident")) {
    return value ? "personal accident cover is included" : "personal accident cover is not included";
  }
  if (leafKey(key) === "health") {
    return value ? "health coverage applies" : "health coverage does not apply";
  }
  if (/(hospitalization|daycare|chronic_management|modern_treatments|ayush|maternity)/.test(key)) {
    return beClause(sectionPath, value ? "covered" : "not covered");
  }
  if (/(restoration|health_checkups|wellness_rewards|wellness_benefits|digital_support|digital_claim_support|cashless_focus|personalization|customization_focus|add_on_flexibility|urban_focus|chronic_care_focus)/.test(key)) {
    return beClause(sectionPath, value ? "available" : "not available");
  }
  return value
    ? `the plan includes ${labelFor(sectionPath)}`
    : `the plan does not include ${labelFor(sectionPath)}`;
}

function renderSentence(sectionPath, rawText) {
  const raw = String(rawText).trim();
  const override = SECTION_SENTENCES[sectionPath];
  if (override) return override(raw);

  if (raw === "true" || raw === "false") {
    return renderBoolean(sectionPath, raw === "true");
  }

  if (isRenderableList(raw)) return renderList(sectionPath, raw);

  const members = raw.match(/^(\d+)(?: members)?$/);
  if (members && /member/.test(sectionPath)) {
    return `up to ${members[1]} members can be covered`;
  }

  const label = labelFor(sectionPath);
  const plural = isPlural(label);
  const phrase = describeValue(raw);

  if (phrase.startsWith("depends on ")) {
    const verb = plural ? "depend on " : "depends on ";
    return `${label} ${phrase.replace(/^depends on /, verb)}`;
  }
  if (phrase.startsWith("optional or ")) {
    const tail = phrase
      .replace(/^optional or /, "")
      .replace(/^depends on /, plural ? "depend on " : "depends on ");
    return `${label} ${plural ? "are" : "is"} optional or ${tail}`;
  }
  return beClause(sectionPath, phrase);
}

function shouldRender(raw) {
  if (raw === "true" || raw === "false") return true;
  if (Object.hasOwn(VALUE_PHRASES, raw)) return true;
  if (/^[a-z0-9]+(_[a-z0-9]+)+$/i.test(raw)) return true;
  if (/^\d+$/.test(raw)) return true;
  if (isRenderableList(raw)) return true;
  return raw.length < 30;
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

  const body = shouldRender(cleanText)
    ? renderSentence(sectionPath, cleanText)
    : cleanText;

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
console.log(`Built ${chunks.length} chunks`);
