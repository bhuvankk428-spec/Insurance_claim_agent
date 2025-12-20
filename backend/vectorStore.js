// backend/vectorStore.js

const vectors = []; // { id, domain, policy_name, insurer, text, embedding:number[] }

export function saveVector(doc) {
  vectors.push(doc);
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// searchVectors({ embedding, k, domain })
export function searchVectors({ embedding, k = 5, domain = null }) {
  const scored = vectors
    .filter((v) => !domain || v.domain === domain)
    .map((v) => ({
      ...v,
      score: cosineSimilarity(embedding, v.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return scored;
}

// Optional: check if loaded
export function getVectorCount() {
  return vectors.length;
}
