// rules.js

export function scorePolicy(policy, user = {}) {
  // Simple score-only version (used by existing code)
  const result = scorePolicyWithExplanation(policy, user);
  return result.score;
}

export function scorePolicyWithExplanation(policy, user = {}) {
  let score = 0;
  const reasons = [];

  const text = (
    policy.raw_text ||
    policy.content ||
    ""
  ).toLowerCase();

  /* ---------- PRE-EXISTING / HEALTH ---------- */
  if (user.health) {
    if (policy.coverage?.pre_existing_disease) {
      score += 12;
      reasons.push("Covers pre-existing diseases after waiting period");
    } else if (text.includes("pre-existing")) {
      score += 8;
      reasons.push("Mentions pre-existing disease coverage");
    }
  }

  /* ---------- HEART CONDITIONS ---------- */
  if (user.health?.includes("heart")) {
    if (policy.coverage?.heart_conditions === "covered") {
      score += 15;
      reasons.push("Explicit heart condition coverage");
    } else if (policy.coverage?.heart_conditions === "conditional") {
      score += 5;
      reasons.push("Heart condition covered after conditions/waiting period");
    } else {
      score -= 25;
      reasons.push("Heart conditions excluded or unclear");
    }
  }

  /* ---------- FAMILY ---------- */
  if (user.family || user.family_size >= 3) {
    if (policy.family?.type?.includes("floater")) {
      score += 10;
      reasons.push("Family floater suitable for multiple members");
    }
  }

  /* ---------- AFFORDABILITY ---------- */
  if (user.budget?.includes("low")) {
    if (policy.financials?.government_scheme) {
      score += 10;
      reasons.push("Government subsidy improves affordability");
    }
  }

  /* ---------- INSURER TRUST ---------- */
  if (policy.insurer_metrics?.claim_settlement_ratio_band) {
    score += 5;
    reasons.push("Insurer has acceptable historical claim settlement ratio");
  }

  /* ---------- RAG SIMILARITY ---------- */
  if (policy.similarity) {
    const simScore = Math.min(10, policy.similarity * 10);
    score += simScore;
    reasons.push("Policy closely matches the query context");
  }

  return { score, reasons };
}
