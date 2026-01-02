export function scorePolicy(policy, user = {}) {
  let score = 0;
  const text = policy.content.toLowerCase();

  /* ---------- CORE COVERAGE (MOST IMPORTANT) ---------- */
  if (user.health) {
    if (text.includes("pre-existing")) score += 12;
    if (text.includes("heart") && text.includes("exclusion")) score -= 25;
  }

  if (user.occupation === "Farmer") {
    if (text.includes("drought")) score += 15;
    if (text.includes("flood") || text.includes("excess rainfall")) score += 15;
    if (text.includes("natural calamity")) score += 10;
  }

  /* ---------- AFFORDABILITY ---------- */
  if (user.budget?.toLowerCase().includes("low")) {
    if (text.includes("subsidy") || text.includes("government")) {
      score += 10;
    }
  }

  /* ---------- FAMILY SUITABILITY ---------- */
  if (user.family) {
    if (text.includes("family floater")) score += 8;
    if (text.includes("individual only")) score -= 5;
  }

  /* ---------- LOCATION (WEAK SIGNAL) ---------- */
  if (user.location) {
    if (text.includes(user.location.toLowerCase())) score += 5;
  }

  /* ---------- BASE RELEVANCE ---------- */
  score += Math.min(10, policy.similarity * 10);

  return score;
}
