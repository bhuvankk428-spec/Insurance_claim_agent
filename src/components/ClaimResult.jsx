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
    <div className="min-h-screen bg-gradient-to-br from-black via-[#050816] to-[#111827] flex items-center justify-center px-4">
      <Navbar />

      <div className="max-w-xl w-full bg-[#0f1117]/90 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-black text-white text-center mb-6">
          Claim Result
        </h1>

        {/* STATUS */}
        <div
          className={`mb-6 p-4 rounded-xl text-center font-semibold ${
            isPartial
              ? "bg-yellow-900/40 text-yellow-300"
              : "bg-emerald-900/40 text-emerald-300"
          }`}
        >
          {isPartial ? "⚠️ Partially Approved" : "✅ Approved"}
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
          <div className="mt-6 p-4 bg-black/40 rounded-xl text-sm text-neutral-200">
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
          className="mt-8 w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 transition text-white font-bold"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
