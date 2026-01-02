// AboutQKAI.jsx
export default function AboutQKAI() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto w-full grid gap-8 sm:gap-10 md:grid-cols-[1.2fr_1fr] items-start md:items-center">
        {/* Left: Text */}
        <div className="order-2 md:order-1 space-y-6 sm:space-y-8">
          <p className="text-xs uppercase tracking-[0.25em] text-sky-400 mb-3">
            About QK.AI
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 sm:mb-6 leading-tight">
            Smarter insurance decisions,
            <span className="block bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
              powered by QK.AI
            </span>
          </h1>
          <div className="space-y-4 text-neutral-300 text-sm sm:text-base leading-relaxed">
            <p>
              QK.AI is your intelligent copilot for understanding complex insurance
              policies and claims. It turns long PDFs and confusing clauses into
              clear, actionable insights in seconds.
            </p>
            <p>
              Instead of navigating jargon alone, QK.AI helps you compare coverage,
              check claim eligibility, and feel confident about every decision you
              make with your insurer.
            </p>
          </div>

          {/* Key points - Stack on mobile */}
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 mb-6">
            <FeatureItem
              title="Policy Summaries"
              desc="Upload or paste policy text and get a human‑friendly breakdown of what actually matters to you."
            />
            <FeatureItem
              title="Claim Scenarios"
              desc="Describe what happened and instantly see if it's likely claimable and what to prepare next."
            />
          </div>

          {/* Small stats / trust strip */}
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm text-neutral-400">
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

        {/* Right: Logo + card - Stacks below on mobile */}
        <div className="order-1 md:order-2 flex justify-center md:justify-end">
          <div className="bg-[#111827]/90 border border-neutral-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center flex-shrink-0">
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
              QK.AI sits between you and your insurance paperwork, acting like a
              personal assistant that actually understands coverage rules.
            </p>
            <ul className="text-xs sm:text-sm text-neutral-400 space-y-2 list-disc list-inside">
              <li>Reduce time spent reading long policies.</li>
              <li>Spot exclusions and key limits before it's too late.</li>
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
    <div className="rounded-2xl border border-neutral-800 bg-[#0b1120]/80 px-4 py-3 sm:px-5">
      <h3 className="text-sm font-semibold mb-1 text-sky-200">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
