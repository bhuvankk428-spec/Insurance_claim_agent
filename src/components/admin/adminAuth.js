export const ADMIN_EMAIL =
  import.meta.env.VITE_ADMIN_EMAIL || "admin@qk.ai";
export const ADMIN_PASSWORD =
  import.meta.env.VITE_ADMIN_PASSWORD || "QKAdmin#2026";
export const ADMIN_TOKEN =
  import.meta.env.VITE_ADMIN_TOKEN || "qk-admin-2026";

export function isAdminAuthed() {
  return localStorage.getItem("qk_admin_authed") === "true";
}

export function adminLogin(email, password) {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    localStorage.setItem("qk_admin_authed", "true");
    return true;
  }
  return false;
}

export function adminLogout() {
  localStorage.removeItem("qk_admin_authed");
}
