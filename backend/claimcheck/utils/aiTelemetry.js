function emptyState() {
  return {
    calls: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    latencyMs: 0,
    jsonAttempts: 0,
    jsonValid: 0,
    jsonRepaired: 0,
    jsonInvalid: 0,
    byModel: {},
  };
}

let state = emptyState();

export function resetAiTelemetry() {
  state = emptyState();
}

export function recordAiCall({ model, usage, latencyMs = 0 }) {
  const normalizedModel = model || "unknown";
  const promptTokens = Number(usage?.prompt_tokens || 0);
  const completionTokens = Number(usage?.completion_tokens || 0);
  const totalTokens = Number(
    usage?.total_tokens || promptTokens + completionTokens
  );

  state.calls += 1;
  state.promptTokens += promptTokens;
  state.completionTokens += completionTokens;
  state.totalTokens += totalTokens;
  state.latencyMs += Number(latencyMs) || 0;

  if (!state.byModel[normalizedModel]) {
    state.byModel[normalizedModel] = {
      calls: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: 0,
    };
  }

  const modelState = state.byModel[normalizedModel];
  modelState.calls += 1;
  modelState.promptTokens += promptTokens;
  modelState.completionTokens += completionTokens;
  modelState.totalTokens += totalTokens;
  modelState.latencyMs += Number(latencyMs) || 0;
}

export function recordJsonParse({ ok, repaired = false }) {
  state.jsonAttempts += 1;
  if (ok) {
    state.jsonValid += 1;
    if (repaired) state.jsonRepaired += 1;
  } else {
    state.jsonInvalid += 1;
  }
}

export function getAiTelemetry() {
  return JSON.parse(JSON.stringify(state));
}
