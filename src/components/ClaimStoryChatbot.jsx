import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function ClaimStoryChatbot() {
  const [story, setStory] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claimCode, setClaimCode] = useState(null);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!story.trim()) return;
    setLoading(true);
    setResponse(null);
    setClaimCode(null);

    try {
      const res = await fetch(`${API_BASE}/api/claim-story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story }),
      });

      const data = await res.json();
      setResponse(data.answer);
      if (data.eligible) setClaimCode(data.claimCode);
    } catch (err) {
      setResponse(
        "Something went wrong while analyzing your story. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Navbar - Mobile optimized */}
      <nav className="w-full border-b border-neutral-800 bg-black/80 backdrop-blur-md fixed top-0 left-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">
          {/* Logo / Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer p-2 -m-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => navigate("/choose")}
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
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-20 sm:pt-24 pb-12 lg:pb-16">
        <div className="w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl">
          {/* Heading */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-sky-400 mb-4">
              Claim Assistant
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 leading-tight text-white drop-shadow-2xl">
              Tell your claim story
            </h1>
            <p className="text-neutral-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto">
              Describe what happened in your own words. QK.AI will analyze the
              situation and suggest whether it looks claimable and what you
              should prepare next.
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-[#0f1117]/90 backdrop-blur-xl border border-neutral-800/50 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6 mb-6 lg:mb-8">
              <label className="text-sm sm:text-base font-semibold text-neutral-200">
                Your story
              </label>
              <textarea
                className="w-full border-2 border-neutral-700/50 bg-black/30 text-white rounded-2xl p-4 sm:p-5 resize-none focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 transition-all text-sm sm:text-base placeholder-neutral-400 min-h-[140px] sm:min-h-[160px]"
                rows={6}
                placeholder="Example: I met with an accident while driving to work on [date]. I have third-party motor insurance and want to know if damages to my car and the other vehicle are covered. The other driver was at fault..."
                value={story}
                onChange={(e) => setStory(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !story.trim()}
                className="self-start w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-sm sm:text-base font-bold shadow-xl hover:from-sky-500 hover:to-indigo-500 active:scale-95 focus:outline-none focus:ring-4 focus:ring-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <span className="animate-pulse">🤖</span> Analyzing your claim...
                  </>
                ) : (
                  "Analyze My Claim"
                )}
              </button>
            </form>

            {/* AI Response */}
            {response && (
              <div className="rounded-2xl border-2 border-neutral-800/50 bg-gradient-to-br from-[#1a1f2e]/90 to-[#16213e]/90 p-6 sm:p-7 lg:p-8 shadow-xl backdrop-blur-xl">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xl font-bold text-white">AI</span>
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base lg:text-lg font-bold text-sky-300 mb-2 tracking-tight">
                      QK.AI Assessment
                    </h2>
                    <p className="text-sm sm:text-base lg:text-lg text-neutral-100 leading-relaxed max-w-none">
                      {response}
                    </p>
                  </div>
                </div>

                {claimCode && (
                  <div className="mt-6 p-4 bg-emerald-900/40 border-2 border-emerald-500/50 rounded-2xl backdrop-blur-sm shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-emerald-200">
                        ✅ Claim Eligible
                      </span>
                      <div className="bg-emerald-500/20 px-4 py-2 rounded-xl border border-emerald-400/30">
                        <span className="text-xs sm:text-sm font-mono font-bold text-emerald-100 tracking-wider">
                          Code: {claimCode}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-neutral-500 text-center max-w-2xl mx-auto leading-relaxed px-2">
            QK.AI provides guidance for educational purposes only and does not replace
            professional legal or financial advice. Always verify with your insurer.
          </p>
        </div>
      </main>
    </div>
  );
}
