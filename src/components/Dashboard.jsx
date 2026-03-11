import { useEffect, useMemo, useState } from "react";
import Navbar from "./ui/Navbar";
import { auth } from "../firebase";

const API_BASE = "";

export default function Dashboard() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const endpointBase = API_BASE ? `${API_BASE}/api` : "/api";
      const email = auth.currentUser?.email;
      if (!email) {
        setLoading(false);
        setError("Please log in to view your claims dashboard.");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const encodedEmail = encodeURIComponent(email);
        const res = await fetch(
          `${endpointBase}/my-claims?email=${encodedEmail}&limit=500`
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load claims dashboard");
        }
        setClaims(Array.isArray(data.claims) ? data.claims : []);
      } catch (err) {
        setError(err.message || "Failed to load claims dashboard");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const stats = useMemo(() => {
    const summary = {
      totalApplied: claims.length,
      approved: 0,
      partial: 0,
      rejected: 0,
      pending: 0,
      geoTagged: 0,
    };

    claims.forEach((claim) => {
      const status = getDisplayStatus(claim);
      if (status === "approved") summary.approved += 1;
      else if (status === "partial") summary.partial += 1;
      else if (status === "rejected") summary.rejected += 1;
      else summary.pending += 1;

      if (claim.geo_tagged) summary.geoTagged += 1;
    });

    return summary;
  }, [claims]);

  const recentClaims = useMemo(() => {
    return [...claims]
      .sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 10);
  }, [claims]);

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-24 pb-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300 mb-2">
            Claims Analytics
          </p>
          <h1 className="text-3xl sm:text-4xl font-black">Dashboard</h1>
          <p className="text-neutral-300 mt-2 text-sm sm:text-base">
            View claim activity and outcomes. Total applied claims means total claim
            entries created in your backend records.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard label="Claims Applied" value={stats.totalApplied} tone="cyan" />
          <StatCard label="Approved" value={stats.approved} tone="green" />
          <StatCard label="Partial" value={stats.partial} tone="amber" />
          <StatCard label="Rejected" value={stats.rejected} tone="red" />
          <StatCard label="Pending" value={stats.pending} tone="blue" />
          <StatCard label="Geo Tagged" value={stats.geoTagged} tone="teal" />
        </div>

        {loading && (
          <div className="rounded-2xl border border-neutral-800 bg-black/30 px-4 py-8 text-center text-neutral-300">
            Loading dashboard...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-900/20 px-4 py-4 text-red-100">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="rounded-3xl border border-[#1f2734] bg-[#111827]/85 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1f2734]">
              <h2 className="text-lg font-semibold">Recent Claims</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/30 text-neutral-300">
                  <tr>
                    <th className="text-left px-4 py-3">Claim ID</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Risk</th>
                    <th className="text-left px-4 py-3">Geo</th>
                    <th className="text-left px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClaims.length === 0 && (
                    <tr>
                      <td className="px-4 py-4 text-neutral-400" colSpan={5}>
                        No claims found.
                      </td>
                    </tr>
                  )}
                  {recentClaims.map((claim) => (
                    <tr key={claim.claim_id} className="border-t border-[#1f2734]">
                      <td className="px-4 py-3 font-mono">{claim.claim_id || "-"}</td>
                      <td className="px-4 py-3">{getDisplayStatus(claim)}</td>
                      <td className="px-4 py-3">{claim.risk_level || "-"}</td>
                      <td className="px-4 py-3">
                        {claim.geo_tagged === null
                          ? "-"
                          : claim.geo_tagged
                            ? "Tagged"
                            : "Missing"}
                      </td>
                      <td className="px-4 py-3">
                        {claim.created_at
                          ? new Date(claim.created_at).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function getDisplayStatus(claim) {
  const adminDecision = String(claim?.admin_decision || "").toLowerCase();
  if (
    adminDecision === "approved" ||
    adminDecision === "partial" ||
    adminDecision === "rejected"
  ) {
    return adminDecision;
  }
  if (adminDecision === "pending") {
    return "pending";
  }

  const eligibility = String(claim?.eligibility_status || "pending").toLowerCase();
  if (["approved", "partial", "rejected", "pending"].includes(eligibility)) {
    return eligibility;
  }
  return "pending";
}

function StatCard({ label, value, tone = "cyan" }) {
  const toneClass =
    tone === "green"
      ? "text-emerald-200 border-emerald-500/30 bg-emerald-500/10"
      : tone === "amber"
        ? "text-amber-200 border-amber-500/30 bg-amber-500/10"
        : tone === "red"
          ? "text-red-200 border-red-500/30 bg-red-500/10"
          : tone === "blue"
            ? "text-blue-200 border-blue-500/30 bg-blue-500/10"
            : tone === "teal"
              ? "text-teal-200 border-teal-500/30 bg-teal-500/10"
              : "text-cyan-200 border-cyan-500/30 bg-cyan-500/10";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs opacity-85">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}
