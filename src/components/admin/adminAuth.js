const FALLBACK_ADMIN_EMAIL = "admin@insure.ai";
const PLACEHOLDER_ADMIN_EMAILS = new Set([
  "your-admin-firebase-email@example.com",
  "your-admin-email@example.com",
  "admin@example.com",
]);

function parseAdminEmails(rawValue) {
  return String(rawValue || "")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
    .filter(email => !PLACEHOLDER_ADMIN_EMAILS.has(email));
}

const configuredAdminEmails = parseAdminEmails(
  import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL
);

export const ADMIN_EMAILS = configuredAdminEmails.length
  ? configuredAdminEmails
  : [FALLBACK_ADMIN_EMAIL];

export const ADMIN_EMAIL = ADMIN_EMAILS[0];
export const ADMIN_TOKEN =
  import.meta.env.VITE_ADMIN_TOKEN || "qk-admin-2026";
export const HAS_CONFIGURED_ADMIN_TOKEN = Boolean(import.meta.env.VITE_ADMIN_TOKEN);

export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(String(email || "").trim().toLowerCase());
}
