import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
      const res = await fetch("/api/claim-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story }),
      });

      const data = await res.json();
      setResponse(data.answer);
      if (data.eligible) setClaimCode(data.claimCode);
    } catch (err) {
      setResponse("Something went wrong while analyzing your story. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Navbar (same style as chooser) */}
      <nav className="w-full border-b border-neutral-800 bg-black/80 backdrop-blur-md fixed top-0 left-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/choose")}
          >
            <img
              src="/logo.png"
              alt="QK.AI Logo"
              className="w-8 h-8 rounded-2xl object-cover"
            />
            <span className="font-semibold text-lg tracking-tight">
              QK.AI
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button
              className="hover:text-sky-300 transition-colors"
              onClick={() => navigate("/about")}
            >
              About
            </button>
            <button
              className="hover:text-sky-300 transition-colors"
              onClick={() => navigate("/contact")}
            >
              Contact
            </button>
            <button
              className="hover:text-sky-300 transition-colors"
              onClick={() => navigate("/help")}
            >
              Help
            </button>
            <button
              className="hover:text-sky-300 transition-colors"
              onClick={() => navigate("/faq")}
            >
              FAQ
            </button>
          </div>

          {/* Right side CTA + menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="hidden md:inline-flex px-4 py-1.5 rounded-full text-sm font-semibold bg-sky-600 hover:bg-sky-500 transition-colors"
            >
              Login
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-neutral-900 transition-colors"
              onClick={() => setMenuOpen(o => !o)}
            >
              <span className="sr-only">Open main menu</span>
              <div className="space-y-1">
                <span className="block w-5 h-[2px] bg-white" />
                <span className="block w-5 h-[2px] bg-white" />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-neutral-800 bg-black/95">
            <div className="px-4 pt-2 pb-4 space-y-2 text-sm font-medium">
              <button
                className="block w-full text-left py-1 hover:text-sky-300"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/about");
                }}
              >
                About
              </button>
              <button
                className="block w-full text-left py-1 hover:text-sky-300"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/contact");
                }}
              >
                Contact
              </button>
              <button
                className="block w-full text-left py-1 hover:text-sky-300"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/help");
                }}
              >
                Help
              </button>
              <button
                className="block w-full text-left py-1 hover:text-sky-300"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/faq");
                }}
              >
                FAQ
              </button>
              <button
                onClick={() => navigate("/")}
                className="mt-2 w-full text-left py-1 text-sky-400"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-10">
        <div className="w-full max-w-3xl">
          {/* Heading */}
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-sky-400 mb-3">
              Claim assistant
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 leading-tight">
              Tell your claim story
            </h1>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              Describe what happened in your own words. QK.AI will analyze the
              situation and suggest whether it looks claimable and what you
              should prepare next.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-neutral-800 bg-[#0b1120]/80 p-5 sm:p-6 shadow-2xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-4">
              <label className="text-sm font-medium text-neutral-200">
                Your story
              </label>
              <textarea
                className="border border-neutral-700 bg-black/40 text-white rounded-2xl p-3 sm:p-4 resize-none focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 text-sm sm:text-base placeholder-neutral-500"
                rows={6}
                placeholder="Example: I met with an accident while driving to work. I have third-party motor insurance and want to know if damages to my car and the other vehicle are covered..."
                value={story}
                onChange={(e) => setStory(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="self-start px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm sm:text-base font-semibold shadow-lg hover:from-sky-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-sky-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Analyzing..." : "Analyze claim"}
              </button>
            </form>

            {response && (
              <div className="mt-4 rounded-2xl border border-neutral-800 bg-[#020617]/80 p-4 sm:p-5">
                <h2 className="text-sm sm:text-base font-semibold mb-2 text-sky-300">
                  QK.AI assessment
                </h2>
                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                  {response}
                </p>

                {claimCode && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-900/40 border border-emerald-500/40 px-3 py-2 text-xs sm:text-sm text-emerald-200 font-mono">
                    <span>Claim code:</span>
                    <b>{claimCode}</b>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Note */}
          <p className="mt-4 text-[11px] sm:text-xs text-neutral-500">
            QK.AI is for guidance and education only and does not replace
            professional legal or financial advice. Always confirm coverage and
            next steps with your insurer.
          </p>
        </div>
      </main>
    </div>
  );
}
