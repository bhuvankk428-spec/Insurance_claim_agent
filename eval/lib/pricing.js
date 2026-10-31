export const PRICING_USD_PER_MILLION_TOKENS = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1": { input: 2, output: 8 },
  "text-embedding-3-small": { input: 0.02, output: 0 },
  "text-embedding-3-large": { input: 0.13, output: 0 },
};

export function getPricing(model) {
  return PRICING_USD_PER_MILLION_TOKENS[model] || null;
}

export function estimateCostUsd(model, promptTokens = 0, completionTokens = 0) {
  const pricing = getPricing(model);
  if (!pricing) return null;

  return (
    (Number(promptTokens) / 1_000_000) * pricing.input +
    (Number(completionTokens) / 1_000_000) * pricing.output
  );
}

export function costFromTelemetry(telemetry) {
  const byModel = telemetry?.byModel || {};
  let total = 0;
  const unknownModels = [];

  for (const [model, usage] of Object.entries(byModel)) {
    const cost = estimateCostUsd(
      model,
      usage.promptTokens,
      usage.completionTokens
    );
    if (cost === null) {
      unknownModels.push(model);
    } else {
      total += cost;
    }
  }

  return {
    costUsd: unknownModels.length ? null : total,
    knownCostUsd: total,
    unknownModels,
  };
}

export function roundUsd(value) {
  if (value === null || value === undefined) return null;
  return Number(value.toFixed(8));
}
