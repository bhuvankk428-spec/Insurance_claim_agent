import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaClipboardCheck } from "react-icons/fa";

export default function ChooserPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Navbar */}
      <nav className="w-full border-b border-neutral-800 bg-black/80 backdrop-blur-md fixed top-0 left-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">
          {/* Logo / Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer p-2 -m-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => navigate("/Choose")}
          >
            <img
              src="/logo.png"
              alt="QK.AI Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-2xl object-contain flex-shrink-0"
            />
            <span className="font-semibold text-base sm:text-lg tracking-tight">
              QK.AI
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
            <button
              className="hover:text-sky-300 transition-colors py-1 px-2 rounded hover:bg-white/10"
              onClick={() => navigate("/about")}
            >
              About
            </button>
            <button
              className="hover:text-sky-300 transition-colors py-1 px-2 rounded hover:bg-white/10"
              onClick={() => navigate("/contact")}
            >
              Contact
            </button>
            <button
              className="hover:text-sky-300 transition-colors py-1 px-2 rounded hover:bg-white/10"
              onClick={() => navigate("/help")}
            >
              Help
            </button>
            <button
              className="hover:text-sky-300 transition-colors py-1 px-2 rounded hover:bg-white/10"
              onClick={() => navigate("/faq")}
            >
              FAQ
            </button>
          </div>

          {/* Right side CTA + menu */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/")}
              className="hidden md:inline-flex px-4 py-2 sm:py-1.5 rounded-full text-sm font-semibold bg-sky-600 hover:bg-sky-500 transition-all text-white shadow-sm"
            >
              Login
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl hover:bg-neutral-900/50 transition-all w-10 h-10"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <div className="space-y-0.5 w-5">
                <span className={`block w-full h-[2px] bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
                <span className={`block w-full h-[2px] bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-full h-[2px] bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-neutral-800 bg-black/95 backdrop-blur-md">
            <div className="px-4 pt-4 pb-6 space-y-3 text-base font-medium">
              <button
                className="block w-full text-left py-3 px-4 rounded-xl hover:text-sky-300 hover:bg-neutral-900/50 transition-all"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/about");
                }}
              >
                About
              </button>
              <button
                className="block w-full text-left py-3 px-4 rounded-xl hover:text-sky-300 hover:bg-neutral-900/50 transition-all"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/contact");
                }}
              >
                Contact
              </button>
              <button
                className="block w-full text-left py-3 px-4 rounded-xl hover:text-sky-300 hover:bg-neutral-900/50 transition-all"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/help");
                }}
              >
                Help
              </button>
              <button
                className="block w-full text-left py-3 px-4 rounded-xl hover:text-sky-300 hover:bg-neutral-900/50 transition-all"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/faq");
                }}
              >
                FAQ
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/");
                }}
                className="mt-4 w-full text-left py-3 px-4 rounded-xl text-sky-400 bg-sky-900/50 hover:bg-sky-800/50 transition-all font-semibold"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-20 sm:pt-24 pb-12 lg:pb-20">
        <div className="max-w-4xl sm:max-w-5xl w-full text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6 sm:mb-8 text-white tracking-tight drop-shadow-2xl leading-tight">
            Welcome! What would you like to do?
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-neutral-400 mb-10 lg:mb-12 max-w-2xl mx-auto leading-relaxed">
            Choose a tool below to get instant insights about your insurance policies and claims.
          </p>

          {/* Cards – responsive grid */}
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:justify-items-center w-full">
            <HoverCard
              icon={<FaSearch className="text-4xl sm:text-5xl lg:text-6xl text-sky-200 mb-4 sm:mb-6" />}
              title="Policy Summarizer"
              desc="Upload or paste policy details and get a clear, human-friendly summary with key highlights."
              tag="Best for Deciding"
              tagColor="bg-sky-600/80 text-sky-100 hover:bg-sky-500/80"
              onClick={() => navigate("/chatbot")}
            />
            <HoverCard
              icon={<FaClipboardCheck className="text-4xl sm:text-5xl lg:text-6xl text-violet-200 mb-4 sm:mb-6" />}
              title="Policy Claim Checker"
              desc="Describe your situation and instantly see if a claim is likely covered, plus next steps."
              tag="Best for Claims"
              tagColor="bg-violet-700/80 text-violet-100 hover:bg-violet-600/80"
              onClick={() => navigate("/claim-checker")}
            />
          </div>

          {/* Helper strip */}
          <div className="mt-12 lg:mt-16 mx-auto max-w-3xl rounded-2xl border border-neutral-800/50 bg-gradient-to-r from-sky-900/30 via-transparent to-violet-900/30 px-6 py-5 sm:py-6 flex flex-col sm:flex-row items-center gap-4 backdrop-blur-sm">
            <span className="px-4 py-2 rounded-full text-xs sm:text-sm font-bold bg-sky-700/70 text-sky-100 shadow-lg">
              💡 Tip
            </span>
            <p className="text-xs sm:text-sm lg:text-base text-neutral-300 leading-relaxed text-center sm:text-left">
              Not sure where to start? Use{" "}
              <span className="font-bold text-sky-300">Policy Summarizer</span> to
              understand your coverage, then switch to{" "}
              <span className="font-bold text-violet-300">Claim Checker</span> when an incident happens.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/50 bg-black/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 text-xs sm:text-sm text-neutral-400">
          <p className="text-center lg:text-left order-2 lg:order-1">
            © {new Date().getFullYear()} QK.AI  All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 lg:gap-4 order-1 lg:order-2">
            <button className="hover:text-sky-300 transition-colors px-3 py-1 rounded-lg hover:bg-white/10">
              Privacy
            </button>
            <button className="hover:text-sky-300 transition-colors px-3 py-1 rounded-lg hover:bg-white/10">
              Terms
            </button>
            <button className="hover:text-sky-300 transition-colors px-3 py-1 rounded-lg hover:bg-white/10">
              Support
            </button>
            <button className="hover:text-sky-300 transition-colors px-3 py-1 rounded-lg hover:bg-white/10">
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
      className="group relative bg-[#181e27]/90 backdrop-blur-xl border border-[#222231]/50 hover:border-sky-500/50 hover:bg-[#181e27] transition-all duration-300 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 w-full max-w-sm sm:max-w-md lg:max-w-[340px] min-h-[280px] sm:min-h-[320px] flex flex-col items-center cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl hover:-translate-y-1"
    >
      {/* Hover star */}
      <span className="absolute -top-3 -right-3 hidden lg:group-hover:block lg:group-hover:animate-pulse text-xl lg:text-2xl text-sky-400 drop-shadow-2xl z-10">
        ★
      </span>
      
      {/* Icon */}
      <div className="flex-shrink-0 mb-4 sm:mb-6">{icon}</div>
      
      {/* Title */}
      <h2 className="text-xl sm:text-2xl lg:text-2xl font-black text-white mb-3 sm:mb-4 text-center leading-tight group-hover:text-sky-50 transition-colors">
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
