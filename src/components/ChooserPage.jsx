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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/Choose")}
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
              onClick={() => navigate("/contact")}>
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
                className="hover:text-sky-300 transition-colors"
                onClick={() => navigate("/contact")}
              >
                Contact
              </button>

              <button className="block w-full text-left py-1 hover:text-sky-300">
                Help
              </button>
              <button className="block w-full text-left py-1 hover:text-sky-300">
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
        <div className="max-w-5xl w-full">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white tracking-tight text-center drop-shadow-lg">
            Welcome! What would you like to do?
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 text-center mb-10">
            Choose a tool below to get instant insights about your insurance policies and claims.
          </p>

          {/* Cards – responsive grid */}
          <div className="grid gap-8 sm:gap-10 md:grid-cols-2 justify-items-center">
            <HoverCard
              icon={<FaSearch className="text-5xl text-sky-200 mb-4" />}
              title="Policy Summarizer"
              desc="Upload or paste policy details and get a clear, human-friendly summary with key highlights."
              tag="Best for Deciding"
              tagColor="bg-sky-700 text-sky-100"
              onClick={() => navigate("/chatbot")}
            />
            <HoverCard
              icon={<FaClipboardCheck className="text-5xl text-violet-200 mb-4" />}
              title="Policy Claim Checker"
              desc="Describe your situation and instantly see if a claim is likely covered, plus next steps."
              tag="Best for Claims"
              tagColor="bg-violet-800 text-blue-100"
              onClick={() => navigate("/claim-checker")}
            />
          </div>

          {/* Helper strip */}
          <div className="mt-10 mx-auto max-w-3xl rounded-2xl border border-neutral-800 bg-gradient-to-r from-sky-900/40 via-transparent to-purple-900/40 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-700/60 text-sky-100">
              Tip
            </span>
            <p className="text-xs sm:text-sm text-neutral-300 text-center sm:text-left">
              Not sure where to start? Use{" "}
              <span className="font-semibold text-sky-300">Policy Summarizer</span> to
              understand your coverage, then switch to{" "}
              <span className="font-semibold text-violet-300">Claim Checker</span> when an incident happens.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-black/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-neutral-500">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} QK.AI&nbsp; All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button className="hover:text-sky-300 transition-colors">
              Privacy
            </button>
            <button className="hover:text-sky-300 transition-colors">
              Terms
            </button>
            <button className="hover:text-sky-300 transition-colors">
              Support
            </button>
            <button className="hover:text-sky-300 transition-colors">
              Status
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Reusable animated card
function HoverCard({ icon, title, desc, tag, tagColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer relative bg-[#181e27]/90 backdrop-blur-xl border border-[#222231] hover:scale-105 hover:shadow-2xl transition transform rounded-3xl p-8 sm:p-10 w-full max-w-[340px] min-h-[320px] flex flex-col items-center group"
    >
      <span className="absolute hidden group-hover:block group-hover:animate-pulse right-5 top-3 text-2xl text-sky-400 drop-shadow-xl">
        ★
      </span>
      {icon}
      <h2 className="text-2xl font-bold text-white mb-3 text-center">{title}</h2>
      <p className="text-gray-200 text-sm sm:text-base text-center mb-8">{desc}</p>
      <span className={`px-4 py-1 rounded-full font-semibold text-xs sm:text-sm ${tagColor}`}>
        {tag}
      </span>
    </div>
  );
}
