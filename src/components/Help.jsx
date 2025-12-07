// src/components/HelpQKAI.jsx
export default function HelpQKAI() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-12 sm:py-16 lg:py-20">
      <div className="max-w-4xl mx-auto w-full space-y-8 sm:space-y-10 lg:space-y-12">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-14 lg:mb-16">
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-sky-400 mb-4">
            Help & Guide
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 leading-tight text-white drop-shadow-2xl">
            How to use QK.AI
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto">
            Follow these steps to log in, choose a tool, and get useful insights
            from your insurance policies and claim scenarios.
          </p>
        </div>

        {/* Step list */}
        <section className="space-y-4 sm:space-y-5 lg:space-y-6">
          <HelpStep
            number="1"
            title="Sign in or create an account"
            text="Open QK.AI and log in with your email and password, or create a new account from the registration page."
          />
          <HelpStep
            number="2"
            title="Go to the chooser page"
            text="After login you will see two main options: Policy Summarizer and Policy Claim Checker."
          />
          <HelpStep
            number="3"
            title="Use Policy Summarizer"
            text="Select Policy Summarizer when you want to understand a policy. Paste or upload your policy content, then read the summary and key points."
          />
          <HelpStep
            number="4"
            title="Use Policy Claim Checker"
            text="Select Policy Claim Checker when an incident happens. Describe what happened in simple language and view whether it looks claimable and what to prepare next."
          />
          <HelpStep
            number="5"
            title="Review results and next steps"
            text="Use the AI answers as a guide, then confirm important decisions with your insurer or a professional if needed."
          />
        </section>

        {/* Extra tips */}
        <section className="rounded-3xl lg:rounded-[2rem] border border-neutral-800/50 bg-gradient-to-br from-[#0b1120]/90 to-[#111827]/90 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-900/60 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-lg sm:text-xl font-bold text-sky-300">💡</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-2xl font-black text-white flex-1">
              Tips for best results
            </h2>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base lg:text-base text-neutral-200 space-y-0 list-none pl-0">
            <li className="flex items-start gap-3 group">
              <span className="w-2 h-2 sm:w-3 sm:h-3 bg-sky-400 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></span>
              <span className="leading-relaxed">Provide clear, detailed descriptions when checking a claim scenario.</span>
            </li>
            <li className="flex items-start gap-3 group">
              <span className="w-2 h-2 sm:w-3 sm:h-3 bg-sky-400 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></span>
              <span className="leading-relaxed">Mention dates, amounts, and policy names if you know them.</span>
            </li>
            <li className="flex items-start gap-3 group sm:col-span-2">
              <span className="w-2 h-2 sm:w-3 sm:h-3 bg-sky-400 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></span>
              <span className="leading-relaxed">Keep sensitive personal data to a minimum when testing the app.</span>
            </li>
          </ul>
        </section>

        {/* Quick links */}
        <div className="pt-8 sm:pt-10 border-t border-neutral-800/50 text-center">
          <div className="inline-flex items-center gap-2 px-6 sm:px-8 py-4 bg-sky-900/40 border border-sky-800/50 rounded-2xl backdrop-blur-sm hover:bg-sky-900/60 transition-all group">
            <span className="text-sky-300 text-sm sm:text-base font-semibold">🚀</span>
            <span className="text-sm sm:text-base text-neutral-200">
              Need more help?{" "}
              <a href="/faq" className="text-sky-400 hover:text-sky-300 font-bold underline underline-offset-2 transition-all group-hover:underline-offset-4">
                Check FAQs
              </a>{" "}
              or{" "}
              <a href="/contact" className="text-sky-400 hover:text-sky-300 font-bold underline underline-offset-2 transition-all group-hover:underline-offset-4">
                Contact us
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpStep({ number, title, text }) {
  return (
    <div className="group bg-[#111827]/90 backdrop-blur-sm hover:bg-[#111827] border border-neutral-800/50 hover:border-sky-600/30 rounded-2xl p-5 sm:p-6 lg:p-7 shadow-lg hover:shadow-sky-500/20 hover:-translate-y-1 transition-all duration-300 flex gap-4 sm:gap-5 lg:gap-6 items-start">
      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-sky-600 to-sky-700 rounded-2xl flex items-center justify-center text-base sm:text-lg lg:text-xl font-black shadow-lg group-hover:scale-110 group-hover:shadow-sky-400/30 transition-all">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white mb-2 sm:mb-3 group-hover:text-sky-50 transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-xs sm:text-sm lg:text-base text-neutral-200 leading-relaxed lg:leading-loose line-clamp-3">
          {text}
        </p>
      </div>
    </div>
  );
}
