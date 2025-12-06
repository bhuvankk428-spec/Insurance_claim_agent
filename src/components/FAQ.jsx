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
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(idx === openIndex ? -1 : idx);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-16">
      <div className="max-w-3xl w-full">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-sky-400 mb-3">
            FAQs
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 leading-tight">
            Frequently asked questions
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
            Answers to common questions about how QK.AI works with your
            insurance policies and claim scenarios.
          </p>
        </header>

        <div className="divide-y divide-neutral-800 rounded-2xl border border-neutral-800 bg-[#0b1120]/80">
          {faqs.map((item, idx) => (
            <button
              key={idx}
              onClick={() => toggle(idx)}
              className="w-full text-left px-4 sm:px-6 py-4 focus:outline-none"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold mb-1">
                    {item.q}
                  </h2>
                  {openIndex === idx && (
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                      {item.a}
                    </p>
                  )}
                </div>
                <span className="mt-1 text-sky-300 text-lg">
                  {openIndex === idx ? "−" : "+"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
