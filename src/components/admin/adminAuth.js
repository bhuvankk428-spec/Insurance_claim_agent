export const ADMIN_EMAIL =
  import.meta.env.VITE_ADMIN_EMAIL || "admin@qk.ai";
export const ADMIN_TOKEN =
  import.meta.env.VITE_ADMIN_TOKEN || "qk-admin-2026";
export const HAS_CONFIGURED_ADMIN_TOKEN = Boolean(import.meta.env.VITE_ADMIN_TOKEN);

export function isAdminEmail(email) {
  return (
    String(email || "").trim().toLowerCase() ===
    String(ADMIN_EMAIL || "").trim().toLowerCase()
  );
}
