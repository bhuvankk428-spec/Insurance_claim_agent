// src/components/FAQQKAI.jsx
import { useState } from "react";

const faqs = [
  {
    q: "What is QK.AI?",
    a: "QK.AI is an AI assistant that helps you understand insurance policies and check whether real-life scenarios might be claimable."
  },
  {
    q: "Do I need to upload my full policy?",
    a: "You can paste specific sections or the full policy. The more context you provide, the more accurate the explanation and summary will be."
  },
  {
    q: "Is QK.AI giving legal or financial advice?",
    a: "No. QK.AI is for education and guidance only. Always confirm important decisions with your insurer or a qualified professional."
  },
  {
    q: "How do I use the Policy Summarizer?",
    a: "Go to the chooser page, select Policy Summarizer, then paste or upload your policy details. QK.AI will highlight coverage, exclusions, and key limits in simple language."
  },
  {
    q: "How do I use the Claim Checker?",
    a: "Choose Policy Claim Checker, then describe what happened in detail. QK.AI will tell you if it looks like a possible claim and what information is useful to collect."
  },
  {
    q: "Is my data stored permanently?",
    a: "This demo is meant for testing. Avoid sharing extremely sensitive personal data, and check the project documentation or owner for details about storage and logs."
  },
  {
    q: "Can I use QK.AI for any type of insurance?",
    a: "You can experiment with health, life, motor, and other personal policies. However, coverage rules vary by company and region, so always double-check with your insurer."
  }
];

export default function FAQQKAI() {
  const [openIndex, setOpenIndex] = useState(-1);

  const toggle = (idx) => {
    setOpenIndex(idx === openIndex ? -1 : idx);
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-12 sm:py-16 lg:py-20">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-sky-400 mb-4">
            FAQs
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 leading-tight text-white drop-shadow-2xl">
            Frequently asked questions
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto">
            Answers to common questions about how QK.AI works with your
            insurance policies and claim scenarios.
          </p>
        </div>

        {/* FAQ Accordion */}
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
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openIndex === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <p className="text-xs sm:text-sm lg:text-base text-neutral-200 leading-relaxed lg:leading-loose">
                      {item.a}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center w-10 sm:w-12 h-10 sm:h-12 flex-shrink-0">
                  <span className={`text-lg sm:text-xl lg:text-2xl font-bold text-sky-400 transition-all duration-300 ${
                    openIndex === idx 
                      ? 'rotate-180 text-sky-300 scale-110' 
                      : 'rotate-0'
                  }`}>
                    ▼
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Helper section */}
        <div className="mt-10 sm:mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-sky-900/50 border border-sky-800/50 rounded-2xl backdrop-blur-sm">
            <span className="text-sky-300 text-sm font-medium">💡</span>
            <span className="text-xs sm:text-sm text-neutral-300">
              Still have questions?{" "}
              <a href="/contact" className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 transition-colors">
                Contact us
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
