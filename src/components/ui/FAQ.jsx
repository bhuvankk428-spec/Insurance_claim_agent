import { useState } from "react";
import Navbar from "./Navbar.jsx";

const faqs = [
  {
    q: "What is INSURE.AI in this project?",
    a: "INSURE.AI includes multiple modules: Policy Advisor chatbot, Claim Checker workflow, Claim Story evaluation, Plan Builder and Dashboard, and Finance News."
  },
  {
    q: "Which page should I open first after login?",
    a: "Use the chooser page (/choose). It routes you to Policy Advisor, Claim Checker, planning tools, and other project features."
  },
  {
    q: "How does Policy Advisor work?",
    a: "Open /chatbot, enter your question, optionally add details, pick language and insurance domain, then submit to get streamed responses."
  },
  {
    q: "What is the full Claim Checker flow?",
    a: "Open /claim-checker, select claim type, upload policy PDF for verification, upload FIR PDF and photos, continue to claim story, then view final result on the claim result page."
  },
  {
    q: "What files are required for claim validation?",
    a: "Policy PDF is required for verification. FIR PDF and incident photos are required before moving to the claim story step."
  },
  {
    q: "How do Plan Builder and Plan Dashboard help?",
    a: "Use /plan to enter income and expense details. /plan-dashboard computes allocation, emergency fund targets, and projections."
  },
  {
    q: "What is available in Finance News?",
    a: "The /finance-news page shows recent finance headlines with images and supports manual refresh."
  },
  {
    q: "Is this legal or financial advice?",
    a: "No. INSURE.AI outputs guidance and automation support. Final claim and investment decisions should be confirmed with your insurer or a certified advisor."
  },
  {
    q: "Can I upload sensitive personal information?",
    a: "Use caution. Share only what is needed for testing or processing. Follow your deployment and data-handling policy for production usage."
  }
];

export default function FAQQKAI() {
  const [openIndex, setOpenIndex] = useState(-1);

  const toggle = (idx) => {
    setOpenIndex(idx === openIndex ? -1 : idx);
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-12 sm:py-16 lg:py-20">
      <Navbar />
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-sky-400 mb-4">
            FAQs
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 leading-tight text-white drop-shadow-2xl">
            Frequently asked questions
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto">
            Answers based on the current INSURE.AI modules and workflows in this repository.
          </p>
        </div>

        <div className="bg-[#0f1117]/90 backdrop-blur-xl border border-neutral-800/50 rounded-3xl shadow-2xl overflow-hidden divide-y divide-neutral-800/50">
          {faqs.map((item, idx) => (
            <button
              key={idx}
              onClick={() => toggle(idx)}
              className="w-full text-left px-5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-7 focus:outline-none hover:bg-neutral-900/50 transition-all group"
              aria-expanded={openIndex === idx}
            >
              <div className="flex items-start justify-between gap-4 lg:gap-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white group-hover:text-sky-50 transition-colors mb-2 lg:mb-3 pr-2">
                    {item.q}
                  </h2>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openIndex === idx ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-xs sm:text-sm lg:text-base text-neutral-200 leading-relaxed lg:leading-loose">
                      {item.a}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center w-10 sm:w-12 h-10 sm:h-12 flex-shrink-0">
                  <span
                    className={`text-lg sm:text-xl lg:text-2xl font-bold text-sky-400 transition-all duration-300 ${
                      openIndex === idx ? "rotate-180 text-sky-300 scale-110" : "rotate-0"
                    }`}
                  >
                    v
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 sm:mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-sky-900/50 border border-sky-800/50 rounded-2xl backdrop-blur-sm">
            <span className="text-sky-300 text-sm font-medium">i</span>
            <span className="text-xs sm:text-sm text-neutral-300">
              Still have questions?{" "}
              <a
                href="/contact"
                className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 transition-colors"
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
