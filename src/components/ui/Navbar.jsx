import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ className = "" }) {
 
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
   <nav className={`w-full border-b border-neutral-800 bg-black/80 backdrop-blur-md fixed top-0 left-0 z-20 ${className}`}>
   
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

        {/* Right side */}
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
              <span
                className={`block w-full h-[2px] bg-white transition-all ${
                  menuOpen ? "rotate-45 translate-y-[6px]" : ""
                }`}
              />
              <span
                className={`block w-full h-[2px] bg-white transition-all ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block w-full h-[2px] bg-white transition-all ${
                  menuOpen ? "-rotate-45 -translate-y-[6px]" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-neutral-800 bg-black/95 backdrop-blur-md">
          <div className="px-4 pt-4 pb-6 space-y-3 text-base font-medium">
            {[
              { label: "About", path: "/about" },
              { label: "Contact", path: "/contact" },
              { label: "Help", path: "/help" },
              { label: "FAQ", path: "/faq" },
            ].map(item => (
              <button
                key={item.label}
                className="block w-full text-left py-3 px-4 rounded-xl hover:text-sky-300 hover:bg-neutral-900/50 transition-all"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(item.path);
                }}
              >
                {item.label}
              </button>
            ))}

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
  );
}




    