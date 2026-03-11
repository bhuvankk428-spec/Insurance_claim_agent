export function scorePolicy(policy, user = {}) {
  return scorePolicyWithExplanation(policy, user).score;
}

export function scorePolicyWithExplanation(policy, user = {}) {
  let score = 0;
  const reasons = [];

  const text = String(policy?.content || policy?.raw_text || "").toLowerCase();
  const section = String(policy?.section || "").toLowerCase();
  const policyName = String(policy?.policy_name || "").toLowerCase();

  if (policy?.similarity) {
    const simScore = Math.min(10, Number(policy.similarity) * 10);
    score += simScore;
    reasons.push("Policy closely matches the retrieved query context");
  }

  if (section === "best_for") {
    score += 3;
    reasons.push("Best-fit summary is useful for recommendations");
  } else if (section === "raw_text") {
    score += 2.5;
    reasons.push("Policy overview provides broad matching context");
  } else if (section.startsWith("coverage.")) {
    score += 2;
    reasons.push("Coverage details align with the recommendation flow");
  } else if (section.startsWith("claim_process.")) {
    score += 1;
    reasons.push("Claim process details help explain next steps");
  }

  if (user.health) {
    if (
      /\bpre-existing|pre existing|waiting period|hospital|medical|disease|surgery\b/.test(
        text
      )
    ) {
      score += 6;
      reasons.push("Health-related query terms match the policy text");
    }
  }

  if (user.health?.includes("heart")) {
    if (/\bheart|cardiac\b/.test(text)) {
      score += 8;
      reasons.push("Heart-condition wording appears in the matched chunk");
    } else if (section.startsWith("exclusion")) {
      score -= 3;
      reasons.push("Matched text may be an exclusion rather than coverage");
    }
  }

  if (user.family || user.family_size >= 3) {
    if (/\bfamily|floater|members|parents|children|spouse\b/.test(text + " " + policyName)) {
      score += 7;
      reasons.push("Family-oriented wording appears in the matched policy data");
    }
  }

  if (user.budget?.includes("low")) {
    if (
      /\baffordable|low premium|budget|subsid|government|cheap|economical\b/.test(
        text
      )
    ) {
      score += 6;
      reasons.push("Budget-sensitive wording appears in the matched policy data");
    }
  }

  if (/\bclaim settlement|cashless|network hospital|restoration|no room rent cap\b/.test(text)) {
    score += 2;
    reasons.push("Useful differentiators appear in the retrieved chunk");
  }

  return { score, reasons };
}
