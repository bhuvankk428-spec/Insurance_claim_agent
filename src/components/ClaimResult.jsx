import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./ui/Navbar";

export default function ClaimResult() {
  const { claimId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    level,
    explanation,
    reasons = [],
    riskLevel,
  } = location.state || {};

  const isPartial = level === "partial";

  return (
    <div className="min-h-screen bg-[#0b0f14] flex items-center justify-center px-4 pt-24 pb-12 relative overflow-hidden">
      <Navbar />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-cyan-500/12 blur-[140px]" />
        <div className="absolute top-16 -right-24 h-80 w-80 rounded-full bg-amber-400/12 blur-[130px]" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f14] via-[#0b0f14]/90 to-[#0b0f14]" />
      </div>

      <div className="max-w-xl w-full bg-[#111827]/90 border border-[#1f2734] rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs text-cyan-200 mb-4">
            Claim Summary
          </div>
          <h1 className="text-3xl font-black text-white">
            Claim Result
          </h1>
          <p className="text-sm text-neutral-300 mt-2">
            Review your approval details and next steps.
          </p>
        </div>

        {/* STATUS */}
        <div
          className={`mb-6 p-4 rounded-2xl text-center font-semibold border ${
            isPartial
              ? "bg-yellow-900/30 text-yellow-200 border-yellow-700/40"
              : "bg-emerald-900/30 text-emerald-200 border-emerald-700/40"
          }`}
        >
          {isPartial ? "Partially Approved" : "Approved"}
        </div>

        {/* CLAIM ID */}
        <div className="mb-4 text-center">
          <p className="text-neutral-400 text-sm">Claim ID</p>
          <p className="font-mono text-lg text-white tracking-wider">
            {claimId}
          </p>
        </div>

        {/* RISK */}
        {riskLevel && (
          <div className="mb-4 text-center">
            <p className="text-neutral-400 text-sm">Risk Level</p>
            <p className="text-white font-semibold">{riskLevel}</p>
          </div>
        )}

        {/* EXPLANATION */}
        {(reasons.length > 0 || explanation) && (
          <div className="mt-6 p-5 bg-black/40 border border-neutral-800/70 rounded-2xl text-sm text-neutral-200">
            <p className="font-semibold mb-2 text-white">
              Why this claim was approved
            </p>

            <ul className="list-disc list-inside space-y-1">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>

            {explanation && (
              <p className="mt-3 text-neutral-300 italic">
                {explanation}
              </p>
            )}
          </div>
        )}

        {/* NEXT STEPS */}
        <div className="mt-6 text-center text-neutral-400 text-sm">
          {isPartial
            ? "This claim requires manual review before payout."
            : "Your claim has been sent for financial processing."}
        </div>

        {/* ACTION */}
          <button
          onClick={() => navigate("/choose")}
          className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 transition text-white font-bold shadow-lg"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}



