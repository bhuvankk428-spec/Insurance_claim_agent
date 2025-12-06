// src/components/HelpQKAI.jsx
export default function HelpQKAI() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full space-y-8">
        <header>
          <p className="text-xs uppercase tracking-[0.25em] text-sky-400 mb-3">
            Help & Guide
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 leading-tight">
            How to use QK.AI
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
            Follow these steps to log in, choose a tool, and get useful insights
            from your insurance policies and claim scenarios.
          </p>
        </header>

        {/* Step list */}
        <section className="space-y-5">
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
        <section className="rounded-2xl border border-neutral-800 bg-[#0b1120]/80 p-5 space-y-3">
          <h2 className="text-lg font-semibold">Tips for best results</h2>
          <ul className="list-disc list-inside text-xs sm:text-sm text-neutral-300 space-y-1.5">
            <li>Provide clear, detailed descriptions when checking a claim scenario.</li>
            <li>Mention dates, amounts, and policy names if you know them.</li>
            <li>Keep sensitive personal data to a minimum when testing the app.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function HelpStep({ number, title, text }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-sm font-semibold">
        {number}
      </div>
      <div>
        <h3 className="text-sm sm:text-base font-semibold mb-1">{title}</h3>
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );
}
