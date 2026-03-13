import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import {
  ADMIN_EMAIL,
  ADMIN_TOKEN,
  HAS_CONFIGURED_ADMIN_TOKEN,
} from "./adminAuth";

const API_BASE = "";

const decisionOptions = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "partial", label: "Partially Approved" },
  { value: "rejected", label: "Rejected" },
];

const isLocalhost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  function normalizeForSearch(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  }

  function normalizeId(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  useEffect(() => {
    if (!isLocalhost && !HAS_CONFIGURED_ADMIN_TOKEN) {
      setLoading(false);
      setError(
        "Missing VITE_ADMIN_TOKEN in production environment for admin API access."
      );
      return;
    }

    async function loadClaims() {
      setLoading(true);
      setError("");
      try {
        const endpoint = API_BASE
          ? `${API_BASE}/api/admin/claims?limit=${limit}`
          : `/api/admin/claims?limit=${limit}`;
        const res = await fetch(endpoint, {
          headers: { "x-admin-token": ADMIN_TOKEN },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load");
        const nextClaims = data.claims || [];
        setClaims(nextClaims);
        setHasMore(nextClaims.length >= limit);
      } catch (err) {
        setError(err.message || "Failed to load claims");
      } finally {
        setLoading(false);
      }
    }

    loadClaims();
  }, [limit]);

  const filteredClaims = useMemo(() => {
    if (!search.trim()) return claims;
    const q = normalizeForSearch(search);
    const qId = normalizeId(search);

    return claims.filter((c) => {
      const claimId = normalizeForSearch(c.claim_id);
      const claimIdCompact = normalizeId(c.claim_id);
      const claimCode = normalizeForSearch(c.claim_code);
      const claimCodeCompact = normalizeId(c.claim_code);
      const email = normalizeForSearch(c.email);
      const owner = normalizeForSearch(c.policy_owner_name);
      const eligibility = normalizeForSearch(c.eligibility_status);
      const adminDecision = normalizeForSearch(c.admin_decision);

      return (
        claimId.includes(q) ||
        (qId.length > 0 && claimIdCompact.includes(qId)) ||
        claimCode.includes(q) ||
        (qId.length > 0 && claimCodeCompact.includes(qId)) ||
        email.includes(q) ||
        owner.includes(q) ||
        eligibility.includes(q) ||
        adminDecision.includes(q)
      );
    });
  }, [claims, search]);

  const stats = useMemo(() => {
    const summary = {
      total: claims.length,
      approved: 0,
      rejected: 0,
      partial: 0,
      pending: 0,
    };

    claims.forEach((c) => {
      const status = c.eligibility_status || "pending";
      if (status === "approved") summary.approved += 1;
      else if (status === "rejected") summary.rejected += 1;
      else if (status === "partial") summary.partial += 1;
      else summary.pending += 1;
    });

    return summary;
  }, [claims]);

  async function handleSave(claim) {
    setSavingId(claim.claim_id);
    setError("");
    try {
      const endpoint = API_BASE
        ? `${API_BASE}/api/admin/claims/${claim.claim_id}`
        : `/api/admin/claims/${claim.claim_id}`;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": ADMIN_TOKEN,
        },
        body: JSON.stringify({
          adminDecision: claim.admin_decision || "pending",
          adminNotes: claim.admin_notes || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");
      setClaims((prev) =>
        prev.map((c) => (c.claim_id === claim.claim_id ? data.claim : c))
      );
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  function handleLogout() {
    signOut(auth).finally(() => {
      navigate("/");
    });
  }

  function handleExportPdf() {
    const now = new Date().toLocaleString();
    const rows = filteredClaims
      .map(
        (c) => `
        <tr>
          <td>${c.claim_id || "-"}</td>
          <td>${c.email || "-"}</td>
          <td>${c.policy_owner_name || "-"}</td>
          <td>${c.eligibility_status || "pending"}</td>
          <td>${c.admin_decision || "pending"}</td>
          <td>${c.risk_level || "-"}</td>
          <td>${c.claim_code || "-"}</td>
        </tr>
      `
      )
      .join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>INSURE.AI Claims Summary</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0b0f14; padding: 24px; }
            h1 { margin: 0 0 6px; font-size: 22px; }
            .meta { font-size: 12px; color: #475569; margin-bottom: 16px; }
            .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
            .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; font-size: 12px; }
            .label { color: #64748b; font-size: 11px; }
            .value { font-weight: 700; font-size: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            th { background: #f8fafc; }
            .footer { margin-top: 16px; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <h1>Claims Summary</h1>
          <div class="meta">Generated: ${now}</div>
          <div class="stats">
            <div class="card"><div class="label">Total</div><div class="value">${stats.total}</div></div>
            <div class="card"><div class="label">Approved</div><div class="value">${stats.approved}</div></div>
            <div class="card"><div class="label">Rejected</div><div class="value">${stats.rejected}</div></div>
            <div class="card"><div class="label">Partial</div><div class="value">${stats.partial}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Email</th>
                <th>Owner</th>
                <th>Eligibility</th>
                <th>Admin Decision</th>
                <th>Risk</th>
                <th>Claim Code</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="7">No claims found.</td></tr>`}
            </tbody>
          </table>
          <div class="footer">INSURE.AI Admin Dashboard</div>
        </body>
      </html>
    `;

    const popup = window.open("", "_blank", "width=980,height=720");
    if (!popup) return;
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">

      <div className="relative overflow-hidden pt-24 pb-16 px-4">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-24 h-96 w-96 rounded-full bg-cyan-500/12 blur-[140px]" />
          <div className="absolute top-16 right-[-120px] h-96 w-96 rounded-full bg-amber-400/12 blur-[130px]" />
          <div className="absolute -bottom-36 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-[150px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] [background-size:28px_28px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f14] via-[#0b0f14]/90 to-[#0b0f14]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-3">
                Admin Console
              </p>
              <h1 className="text-3xl sm:text-4xl font-black mb-2">
                Claims Review Dashboard
              </h1>
              <p className="text-neutral-300 text-sm sm:text-base max-w-2xl">
                Monitor eligibility, approve manual checks, and keep a clear
                record of final decisions.
              </p>
            </div>

            <div className="bg-[#111827]/80 border border-cyan-500/30 rounded-2xl p-4 flex items-center gap-4">
              <div>
                <p className="text-xs text-neutral-400">Signed in as</p>
                <p className="font-semibold text-white">{ADMIN_EMAIL}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 transition font-semibold"
              >
                Log out
              </button>
            </div>
          </div>

          <div className="bg-[#111827]/85 border border-[#1f2734] rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                  <span className="text-cyan-300 font-bold">IA</span>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total claims</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.total}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by email, claim ID, status..."
                  className="w-full sm:w-80 px-4 py-2 rounded-xl bg-black/40 border border-neutral-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleExportPdf}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 transition text-white font-semibold"
                >
                  Export PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="rounded-2xl border border-neutral-800/80 bg-black/40 p-4">
                <p className="text-xs text-neutral-500">Approved</p>
                <p className="text-xl font-semibold text-emerald-200">
                  {stats.approved}
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-800/80 bg-black/40 p-4">
                <p className="text-xs text-neutral-500">Rejected</p>
                <p className="text-xl font-semibold text-red-200">
                  {stats.rejected}
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-800/80 bg-black/40 p-4">
                <p className="text-xs text-neutral-500">Partial</p>
                <p className="text-xl font-semibold text-amber-200">
                  {stats.partial}
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-800/80 bg-black/40 p-4">
                <p className="text-xs text-neutral-500">Pending</p>
                <p className="text-xl font-semibold text-cyan-200">
                  {stats.pending}
                </p>
              </div>
            </div>

            {loading && (
              <div className="text-center text-neutral-300 py-10">
                Loading claims...
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-900/30 px-4 py-3 text-red-100 text-sm">
                {error}
              </div>
            )}

            {!loading && filteredClaims.length === 0 && (
              <div className="text-center text-neutral-400 py-10">
                No claims found.
              </div>
            )}

            {!loading && filteredClaims.length > 0 && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setLimit((prev) => prev + 10)}
                  disabled={!hasMore}
                  className="px-5 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition disabled:opacity-50"
                >
                  {hasMore ? "Load more" : "No more claims"}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5">
              {filteredClaims.map((claim) => (
                <div
                  key={claim.claim_id}
                  className="rounded-3xl border border-[#1d2534] bg-[#0c111b]/80 p-6 shadow-xl"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                      <p className="text-xs text-neutral-400">Claim ID</p>
                      <p className="font-mono text-lg text-white tracking-wider">
                        {claim.claim_id}
                      </p>
                      <p className="text-sm text-neutral-300 mt-1">
                        {claim.email || "Email not captured"}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {claim.policy_owner_name || "Owner name not captured"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-200">
                        Eligibility: {claim.eligibility_status || "pending"}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
                        Risk: {claim.risk_level || "n/a"}
                      </span>
                      {claim.claim_code && (
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-200">
                          Code: {claim.claim_code}
                        </span>
                      )}
                      {claim.geo_tagged !== null && (
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-200">
                          Geo: {claim.geo_tagged ? "Tagged" : "Missing"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-neutral-400">
                        Admin decision
                      </label>
                      <select
                        value={claim.admin_decision || "pending"}
                        onChange={(e) =>
                          setClaims((prev) =>
                            prev.map((c) =>
                              c.claim_id === claim.claim_id
                                ? { ...c, admin_decision: e.target.value }
                                : c
                            )
                          )
                        }
                        className="mt-2 w-full rounded-xl bg-black/40 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                      >
                        {decisionOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="text-xs text-neutral-400">
                        Admin notes
                      </label>
                      <input
                        value={claim.admin_notes || ""}
                        onChange={(e) =>
                          setClaims((prev) =>
                            prev.map((c) =>
                              c.claim_id === claim.claim_id
                                ? { ...c, admin_notes: e.target.value }
                                : c
                            )
                          )
                        }
                        placeholder="Add manual review notes..."
                        className="mt-2 w-full rounded-xl bg-black/40 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                    <div className="rounded-2xl border border-neutral-800/80 bg-black/40 p-4">
                      <p className="text-xs text-neutral-500">Policy</p>
                      <p className="text-neutral-200">
                        Bike: {claim.policy_bike_number || "n/a"}
                      </p>
                      <p className="text-neutral-400 text-xs mt-1">
                        Land: {claim.policy_land_location || "n/a"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-neutral-800/80 bg-black/40 p-4">
                      <p className="text-xs text-neutral-500">FIR</p>
                      <p className="text-neutral-200">
                        Incident: {claim.fir_incident || "n/a"}
                      </p>
                      <p className="text-neutral-400 text-xs mt-1">
                        Bike: {claim.fir_bike_number || "n/a"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-neutral-800/80 bg-black/40 p-4">
                      <p className="text-xs text-neutral-500">Location</p>
                      <p className="text-neutral-200">
                        FIR: {claim.fir_location || "n/a"}
                      </p>
                      <p className="text-neutral-400 text-xs mt-1">
                        Image: {claim.image_location || "n/a"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      Created:{" "}
                      {claim.created_at
                        ? new Date(claim.created_at).toLocaleString()
                        : "n/a"}
                    </span>
                    <button
                      onClick={() => handleSave(claim)}
                      disabled={savingId === claim.claim_id}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 transition text-white font-semibold disabled:opacity-50"
                    >
                      {savingId === claim.claim_id ? "Saving..." : "Save decision"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
