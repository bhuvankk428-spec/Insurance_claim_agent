// AboutQKAI.jsx
export default function AboutQKAI() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-16">
      <div className="max-w-5xl w-full grid gap-10 md:grid-cols-[1.2fr_1fr] items-center">
        {/* Left: Text */}
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-sky-400 mb-3">
            About QK.AI
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
            Smarter insurance decisions,
            <span className="block bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
              powered by QK.AI
            </span>
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base mb-4 leading-relaxed">
            QK.AI is your intelligent copilot for understanding complex insurance
            policies and claims. It turns long PDFs and confusing clauses into
            clear, actionable insights in seconds.
          </p>
          <p className="text-neutral-400 text-sm sm:text-base mb-6 leading-relaxed">
            Instead of navigating jargon alone, QK.AI helps you compare coverage,
            check claim eligibility, and feel confident about every decision you
            make with your insurer.
          </p>

          {/* Key points */}
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <FeatureItem
              title="Policy Summaries"
              desc="Upload or paste policy text and get a human‑friendly breakdown of what actually matters to you."
            />
            <FeatureItem
              title="Claim Scenarios"
              desc="Describe what happened and instantly see if it’s likely claimable and what to prepare next."
            />
          </div>

          {/* Small stats / trust strip */}
          <div className="flex flex-wrap gap-6 text-xs sm:text-sm text-neutral-400">
            <div>
              <span className="block font-semibold text-white">AI‑first workflow</span>
              <span>Designed for speed, clarity, and zero jargon.</span>
            </div>
            <div>
              <span className="block font-semibold text-white">Built for users</span>
              <span>Policyholders, agents, and teams can all plug in.</span>
            </div>
          </div>
        </div>

        {/* Right: Logo + card */}
        <div className="flex justify-center md:justify-end">
          <div className="bg-[#111827]/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center">
                {/* Use your logo.png here */}
                <img
                  src="/logo.png"
                  alt="QK.AI Logo"
                  className="w-8 h-8 object-contain rounded-xl"
                />
              </div>
              <span className="font-semibold text-lg tracking-tight">
                QK.AI
              </span>
            </div>
            <p className="text-neutral-300 text-sm mb-4">
              QK.AI sits between you and your insurance paperwork, acting like a
              personal assistant that actually understands coverage rules.
            </p>
            <ul className="text-xs sm:text-sm text-neutral-400 space-y-2 list-disc list-inside">
              <li>Reduce time spent reading long policies.</li>
              <li>Spot exclusions and key limits before it’s too late.</li>
              <li>Standardize how your team analyzes insurance documents.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ title, desc }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0b1120]/80 px-4 py-3">
      <h3 className="text-sm font-semibold mb-1 text-sky-200">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
