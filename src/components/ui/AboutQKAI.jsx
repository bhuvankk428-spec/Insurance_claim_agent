import Navbar from "./Navbar.jsx";
import { useNavigate } from "react-router-dom";

// AboutQKAI.jsx
export default function AboutQKAI() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#0b0f14] text-white px-4 pb-12 pt-24 sm:pb-16 sm:pt-28">
        <div className="max-w-5xl mx-auto w-full grid gap-8 sm:gap-10 md:grid-cols-[1.2fr_1fr] items-start md:items-center">
          {/* Left: Text */}
          <div className="order-2 md:order-1 space-y-6 sm:space-y-8">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 mb-3">
              About QK.AI
            </p>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 sm:mb-6 leading-tight">
              Insurance clarity for people,
              <span className="block bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                teams, and every claim moment
              </span>
            </h1>

            <div className="space-y-4 text-neutral-300 text-sm sm:text-base leading-relaxed">
              <p>
                QK.AI is an AI platform built to simplify insurance decisions from
                day one. We turn dense policy wording, scattered claim evidence, and
                complex eligibility rules into clear, usable guidance.
              </p>
              <p>
                Whether you are reviewing coverage before purchase or validating a
                claim under pressure, QK.AI helps you move faster with fewer blind
                spots and less legal jargon.
              </p>
            </div>

            {/* Key points */}
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 mb-6">
              <FeatureItem
                title="Plain-Language Policy Reading"
                desc="Convert long policy PDFs into practical summaries with limits, exclusions, and key conditions highlighted."
              />
              <FeatureItem
                title="Claim Readiness Guidance"
                desc="Assess likely claim eligibility and get a checklist of documents and facts needed before filing."
              />
              <FeatureItem
                title="Evidence Intelligence"
                desc="Cross-check documents, photos, and incident stories to spot inconsistencies early."
              />
              <FeatureItem
                title="Human-in-the-Loop Friendly"
                desc="Designed for policyholders, advisors, and operations teams that need speed without losing control."
              />
            </div>

            {/* Trust strip */}
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm text-neutral-400">
              <div>
                <span className="block font-semibold text-white">
                  Built for high-stakes decisions
                </span>
                <span>Fast outputs with transparent reasoning steps.</span>
              </div>
              <div>
                <span className="block font-semibold text-white">
                  Security-minded workflows
                </span>
                <span>Structured for sensitive insurance documents.</span>
              </div>
              <div>
                <span className="block font-semibold text-white">
                  Continually improving
                </span>
                <span>Updated from real usage feedback and edge cases.</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/choose")}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
              >
                Explore QK.AI
              </button>
              <button
                type="button"
                onClick={() => navigate("/contact")}
                className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-900 transition-colors"
              >
                Talk to Team
              </button>
            </div>
          </div>

          {/* Right: Card */}
          <div className="order-1 md:order-2 flex justify-center md:justify-end">
            <div className="bg-[#111827]/90 border border-neutral-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <img
                    src="/logo.png"
                    alt="QK.AI Logo"
                    className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-xl"
                  />
                </div>
                <span className="font-semibold text-base sm:text-lg tracking-tight">
                  QK.AI
                </span>
              </div>

              <p className="text-neutral-300 text-sm mb-4 leading-relaxed">
                We are building a dependable insurance intelligence layer that helps
                users understand coverage, assess claims, and make better decisions
                with confidence.
              </p>

              <ul className="text-xs sm:text-sm text-neutral-400 space-y-2 list-disc list-inside">
                <li>Reduce review time for policies and claims.</li>
                <li>Catch limits, waiting periods, and exclusions earlier.</li>
                <li>Keep decision logic consistent across your workflow.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function FeatureItem({ title, desc }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0b1120]/80 px-4 py-3 sm:px-5">
      <h3 className="text-sm font-semibold mb-1 text-cyan-200">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
