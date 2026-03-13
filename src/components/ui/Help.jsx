import Navbar from "./Navbar.jsx";

export default function HelpQKAI() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-12 sm:py-16 lg:py-20">
      <Navbar />
      <div className="max-w-4xl mx-auto w-full space-y-8 sm:space-y-10 lg:space-y-12">
        <div className="text-center mb-12 sm:mb-14 lg:mb-16">
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-sky-400 mb-4">
            Help & Guide
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 leading-tight text-white drop-shadow-2xl">
            How to use INSURE.AI
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto">
            Follow this flow to use the current INSURE.AI modules in this project.
          </p>
        </div>

        <section className="space-y-4 sm:space-y-5 lg:space-y-6">
          <HelpStep
            number="1"
            title="Sign in or create an account"
            text="Open INSURE.AI and sign in from the login screen. New users can create an account from the registration page."
          />
          <HelpStep
            number="2"
            title="Go to the chooser page"
            text="After login, choose the module you want: Policy Advisor, Claim Checker, Plan Builder, or Finance News."
          />
          <HelpStep
            number="3"
            title="Use Policy Advisor (chatbot)"
            text="Ask insurance questions, choose language, and optionally choose domain. Add details for better responses."
          />
          <HelpStep
            number="4"
            title="Use Claim Checker (claim-checker)"
            text="Select claim type, upload policy PDF for verification, then upload FIR PDF and incident photos."
          />
          <HelpStep
            number="5"
            title="Explain story and view result"
            text="Continue to claim story, describe the incident, and view approval, partial, or rejection outcome with reasons."
          />
          <HelpStep
            number="6"
            title="Use Plan and Finance modules"
            text="Use plan Maker and plan-dashboard for claim planning and allocation, and finance-news for latest finance headlines."
          />
        </section>

        <section className="rounded-3xl lg:rounded-[2rem] border border-neutral-800/50 bg-gradient-to-br from-[#0b1120]/90 to-[#111827]/90 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-900/60 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-lg sm:text-xl font-bold text-sky-300">i</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-2xl font-black text-white flex-1">
              Tips for best results
            </h2>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base lg:text-base text-neutral-200 space-y-0 list-none pl-0">
            <li className="flex items-start gap-3 group">
              <span className="w-2 h-2 sm:w-3 sm:h-3 bg-sky-400 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform" />
              <span className="leading-relaxed">
                Upload clear PDFs and images so extraction and validation are accurate.
              </span>
            </li>
            <li className="flex items-start gap-3 group">
              <span className="w-2 h-2 sm:w-3 sm:h-3 bg-sky-400 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform" />
              <span className="leading-relaxed">
                For claims, include incident date, location, and policy or FIR context in your story.
              </span>
            </li>
            <li className="flex items-start gap-3 group sm:col-span-2">
              <span className="w-2 h-2 sm:w-3 sm:h-3 bg-sky-400 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform" />
              <span className="leading-relaxed">
                Use this app as guidance only and confirm final decisions with your insurer.
              </span>
            </li>
          </ul>
        </section>

        <div className="pt-8 sm:pt-10 border-t border-neutral-800/50 text-center">
          <div className="inline-flex items-center gap-2 px-6 sm:px-8 py-4 bg-sky-900/40 border border-sky-800/50 rounded-2xl backdrop-blur-sm hover:bg-sky-900/60 transition-all group">
            <span className="text-sky-300 text-sm sm:text-base font-semibold">-&gt;</span>
            <span className="text-sm sm:text-base text-neutral-200">
              Need more help?{" "}
              <a
                href="/faq"
                className="text-sky-400 hover:text-sky-300 font-bold underline underline-offset-2 transition-all group-hover:underline-offset-4"
              >
                Check FAQs
              </a>{" "}
              or{" "}
              <a
                href="/contact"
                className="text-sky-400 hover:text-sky-300 font-bold underline underline-offset-2 transition-all group-hover:underline-offset-4"
              >
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
