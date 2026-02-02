import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "./ui/Navbar";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function ClaimStoryChatbot() {
  const { claimId } = useParams(); // ✅ GET claimId
  const navigate = useNavigate();

  const [story, setStory] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claimCode, setClaimCode] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!story.trim()) return;

    // 🚨 Safety check (prevents silent failure)
    if (!claimId) {
      setResponse("Claim session expired. Please restart the claim process.");
      return;
    }

    setLoading(true);
    setResponse(null);
    setClaimCode(null);

    try {
      const res = await fetch(`${API_BASE}/api/claim-story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId, // ✅ REQUIRED
          story,
        }),
      });

      const data = await res.json();

      setResponse(data.answer || data.message || "No response generated.");

      if (data.eligible) {
  navigate(`/claim-result/${data.claimCode}`, {
    state: {
      level: data.level,
      answer: data.answer,
      riskLevel: data.riskLevel
    }
  });
}

    } catch (err) {
      setResponse(
        "Something went wrong while analyzing your story. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-3xl">
          {/* Heading */}
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-sky-400 mb-4">
              Claim Assistant
            </p>
            <h1 className="text-3xl font-black mb-4">
              Tell your claim story
            </h1>
            <p className="text-neutral-300">
              Describe what happened. QK.AI will verify it against your policy
              and evidence.
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#0f1117]/90 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mb-6">
              <label className="font-semibold text-neutral-200">
                Your story
              </label>

              <textarea
                className="w-full border-2 border-neutral-700 bg-black/40 rounded-2xl p-4 resize-none focus:outline-none focus:border-sky-500 min-h-[160px]"
                placeholder="Describe the incident in detail..."
                value={story}
                onChange={(e) => setStory(e.target.value)}
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading || !story.trim()}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 font-bold disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Analyze My Claim"}
              </button>
            </form>

            {/* Response */}
            {response && (
              <div className="mt-6 p-6 rounded-2xl bg-[#1a1f2e] border border-neutral-700">
                <h2 className="font-bold text-sky-300 mb-2">
                  QK.AI Assessment
                </h2>
                <p className="text-neutral-100">{response}</p>

                {claimCode && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-900/40 border border-emerald-500">
                    <span className="font-semibold text-emerald-200">
                      ✅ Claim Eligible
                    </span>
                    <div className="mt-2 font-mono font-bold text-emerald-100">
                      Claim Code: {claimCode}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <p className="mt-6 text-xs text-neutral-500 text-center">
            QK.AI provides guidance only. Always verify with your insurer.
          </p>
        </div>
      </main>
    </div>
  );
}
