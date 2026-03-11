const STORAGE_PREFIX = "claim-context:";

function getStorageKey(claimId) {
  return `${STORAGE_PREFIX}${claimId}`;
}

export function saveClaimContext(claimId, context) {
  if (typeof window === "undefined" || !claimId || !context) return;

  try {
    window.sessionStorage.setItem(
      getStorageKey(claimId),
      JSON.stringify(context)
    );
  } catch {
    // Ignore storage failures and rely on in-memory/server flow.
  }
}

export function loadClaimContext(claimId) {
  if (typeof window === "undefined" || !claimId) return null;

  try {
    const raw = window.sessionStorage.getItem(getStorageKey(claimId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearClaimContext(claimId) {
  if (typeof window === "undefined" || !claimId) return;

  try {
    window.sessionStorage.removeItem(getStorageKey(claimId));
  } catch {
    // Ignore storage failures.
  }
}
