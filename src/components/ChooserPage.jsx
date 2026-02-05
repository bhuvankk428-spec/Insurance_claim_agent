import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaClipboardCheck, FaRegLightbulb } from "react-icons/fa";
import Navbar from "./ui/Navbar.jsx"
export default function ChooserPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex flex-col  relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 -left-32 h-96 w-96 rounded-full bg-cyan-500/12 blur-[140px]" />
        <div className="absolute top-40 -right-24 h-80 w-80 rounded-full bg-amber-400/12 blur-[130px]" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f14] via-[#0b0f14]/90 to-[#0b0f14]" />
      </div>
      {/* Navbar */}
      <Navbar/>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-20 sm:pt-24 pb-12 lg:pb-20">
        <div className="max-w-5xl w-full text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs sm:text-sm text-cyan-200 mb-5">
            Fast, simple, and secure
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-5 sm:mb-7 text-white tracking-tight drop-shadow-2xl leading-tight">
            Welcome! What would you like to do?
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-neutral-300 mb-10 lg:mb-12 max-w-2xl mx-auto leading-relaxed">
            Choose a tool below to get instant insights about your insurance policies and claims.
          </p>

          <div className="mb-8 mx-auto max-w-4xl rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-6 py-5 sm:py-6 flex flex-col sm:flex-row items-center gap-4 backdrop-blur-sm">
            <span className="px-4 py-2 rounded-full text-xs sm:text-sm font-bold bg-emerald-600/80 text-emerald-50 shadow-lg">
              Guidance
            </span>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm sm:text-base text-emerald-100 font-semibold">
                Want more guidance? Our expert team is just a click away.
              </p>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
                Get tailored help on policies, claims, and next steps.
              </p>
            </div>
            <button
              onClick={() => navigate("/contact")}
              className="rounded-full bg-emerald-400/90 hover:bg-emerald-300/90 text-emerald-950 font-semibold px-5 py-2 transition"
            >
              Talk to an expert
            </button>
          </div>

          {/* Cards - responsive grid */}
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 lg:justify-items-center w-full">
            <HoverCard
              icon={<FaSearch className="text-4xl sm:text-5xl lg:text-6xl text-cyan-200 mb-4 sm:mb-6" />}
              title="Policy Summarizer"
              desc="Upload or paste policy details and get a clear, human-friendly summary with key highlights."
              tag="Best for Deciding"
              tagColor="bg-cyan-600/80 text-cyan-100 hover:bg-cyan-500/80"
              onClick={() => navigate("/chatbot")}
            />
            <HoverCard
              icon={<FaClipboardCheck className="text-4xl sm:text-5xl lg:text-6xl text-amber-200 mb-4 sm:mb-6" />}
              title="Policy Claim Checker"
              desc="Describe your situation and instantly see if a claim is likely covered, plus next steps."
              tag="Best for Claims"
              tagColor="bg-amber-500/80 text-amber-50 hover:bg-amber-400/80"
              onClick={() => navigate("/claim-checker")}
            />
            <HoverCard
              icon={<FaRegLightbulb className="text-4xl sm:text-5xl lg:text-6xl text-emerald-200 mb-4 sm:mb-6" />}
              title="Plan Builder"
              desc="If you want a secure retirement click here"
              tag="Lets Plan"
              tagColor="bg-emerald-500/80 text-emerald-50 hover:bg-emerald-400/80"
              onClick={() => navigate("/plan")}
            />
          </div>

          {/* Helper strip */}
          <div className="mt-12 lg:mt-16 mx-auto max-w-3xl rounded-2xl border border-neutral-800/60 bg-[#0f1521]/80 px-6 py-5 sm:py-6 flex flex-col sm:flex-row items-center gap-4 backdrop-blur-sm">
            <span className="px-4 py-2 rounded-full text-xs sm:text-sm font-bold bg-cyan-700/70 text-cyan-100 shadow-lg">
              Tip
            </span>
            <p className="text-xs sm:text-sm lg:text-base text-neutral-300 leading-relaxed text-center sm:text-left">
              Not sure where to start? Use{" "}
              <span className="font-bold text-cyan-300">Policy Summarizer</span> to
              understand your coverage, then switch to{" "}
              <span className="font-bold text-amber-300">Claim Checker</span> when an incident happens.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/50 bg-[#0b0f14]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 text-xs sm:text-sm text-neutral-400">
          <p className="text-center lg:text-left order-2 lg:order-1">
            (c) {new Date().getFullYear()} QK.AI All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 lg:gap-4 order-1 lg:order-2">
            <button className="hover:text-cyan-300 transition-colors px-3 py-1 rounded-lg hover:bg-white/10">
              Privacy
            </button>
            <button className="hover:text-cyan-300 transition-colors px-3 py-1 rounded-lg hover:bg-white/10">
              Terms
            </button>
            <button className="hover:text-cyan-300 transition-colors px-3 py-1 rounded-lg hover:bg-white/10">
              Support
            </button>
            <button className="hover:text-cyan-300 transition-colors px-3 py-1 rounded-lg hover:bg-white/10">
              Status
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Reusable animated card - Mobile optimized
function HoverCard({ icon, title, desc, tag, tagColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-[#121827]/90 backdrop-blur-xl border border-[#1f2836]/80 hover:border-cyan-500/60 hover:bg-[#151c2b] transition-all duration-300 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 w-full max-w-sm sm:max-w-md lg:max-w-[360px] min-h-[280px] sm:min-h-[320px] flex flex-col items-center cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl hover:-translate-y-1"
    >
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-transparent bg-gradient-to-br from-cyan-500/12 via-transparent to-amber-500/12 opacity-0 group-hover:opacity-100 transition-opacity" />
      {/* Icon */}
      <div className="flex-shrink-0 mb-4 sm:mb-6">{icon}</div>
      
      {/* Title */}
      <h2 className="text-xl sm:text-2xl lg:text-2xl font-black text-white mb-3 sm:mb-4 text-center leading-tight group-hover:text-cyan-50 transition-colors">
        {title}
      </h2>
      
      {/* Description */}
      <p className="text-gray-200 text-sm sm:text-base leading-relaxed text-center mb-6 sm:mb-8 px-2 flex-1 flex items-center">
        {desc}
      </p>
      
      {/* Tag */}
      <span className={`px-3 sm:px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm transition-all ${tagColor} shadow-md group-hover:shadow-lg transform group-hover:scale-105`}>
        {tag}
      </span>
    </div>
  );
}

