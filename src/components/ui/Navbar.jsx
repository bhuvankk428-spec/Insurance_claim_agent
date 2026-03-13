import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebase";

export default function Navbar({ className = "" }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email || "");
      setUserId(user?.uid || "");
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [profileMenuOpen]);

  async function handleLogout() {
    try {
      await signOut(auth);
    } finally {
      setProfileMenuOpen(false);
      navigate("/");
    }
  }

  const profileInitial = (userEmail?.trim()?.[0] || "U").toUpperCase();
  const userLabel = userEmail || userId || "Unknown user";

  return (
   <nav
  className={`w-full border-b border-neutral-800 
  bg-neutral-950/95 backdrop-blur-md 
  fixed top-0 left-0 z-50 
  text-white ${className}`}
>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">
        
        {/* Logo / Brand */}
        <div
          className="flex items-center gap-2 cursor-pointer p-2 -m-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => navigate("/choose")}
        >
          <img
            src="/logo.png"
            alt="INSURE.AI Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-2xl object-contain flex-shrink-0"
          />
          <span className="font-semibold text-base sm:text-lg tracking-tight">
            INSURE.AI
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
          <button
            className="hover:text-cyan-300 transition-colors py-1 px-2 rounded hover:bg-white/10"
            onClick={() => navigate("/choose")}
          >
            Home
          </button>
          <button
            className="hover:text-cyan-300 transition-colors py-1 px-2 rounded hover:bg-white/10"
            onClick={() => navigate("/about")}
          >
            About
          </button>
          <button
            className="hover:text-cyan-300 transition-colors py-1 px-2 rounded hover:bg-white/10"
            onClick={() => navigate("/contact")}
          >
            Contact
          </button>
          <button
            className="hover:text-cyan-300 transition-colors py-1 px-2 rounded hover:bg-white/10"
            onClick={() => navigate("/help")}
          >
            Help
          </button>
          <button
            className="hover:text-cyan-300 transition-colors py-1 px-2 rounded hover:bg-white/10"
            onClick={() => navigate("/faq")}
          >
            FAQ
          </button>
          <button
            className="hover:text-cyan-300 transition-colors py-1 px-2 rounded hover:bg-white/10"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
          <button
            className="relative py-1 px-3 rounded-full border border-red-400/70 bg-red-500/15 text-red-200 hover:text-white hover:bg-red-500/30 transition-colors shadow-sm overflow-hidden animate-[pulse_2.4s_ease-in-out_infinite]"
            onClick={() => navigate("/finance-news")}
          >
            <span className="absolute inset-0 rounded-full shadow-[0_0_22px_rgba(248,113,113,0.75)] opacity-80" />
            <span className="relative">Finance News</span>
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-cyan-700 hover:bg-cyan-600 text-white font-semibold text-sm transition-colors"
              aria-label="Open profile menu"
            >
              {profileInitial}
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-11 min-w-40 rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg p-2 z-50">
                <p className="px-3 py-2 text-xs text-neutral-300 truncate" title={userLabel}>
                  {userLabel}
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-200 hover:text-white hover:bg-red-500/25 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

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
              { label: "Home", path: "/choose" },
              { label: "About", path: "/about" },
              { label: "Contact", path: "/contact" },
              { label: "Help", path: "/help" },
              { label: "FAQ", path: "/faq" },
              { label: "Dashboard", path: "/dashboard" },
              { label: "Finance News", path: "/finance-news", highlight: true },
            ].map(item => (
              <button
                key={item.label}
                className={`relative block w-full text-left py-3 px-4 rounded-xl transition-all ${
                  item.highlight
                    ? "text-red-200 bg-red-500/15 hover:bg-red-500/25 hover:text-white border border-red-400/40"
                    : "hover:text-cyan-300 hover:bg-neutral-900/50"
                }`}
                onClick={() => {
                  setMenuOpen(false);
                  navigate(item.path);
                }}
              >
                {item.highlight && (
                  <span className="pointer-events-none absolute inset-0 rounded-xl shadow-[0_0_18px_rgba(248,113,113,0.65)] opacity-80 animate-[pulse_2.6s_ease-in-out_infinite]" />
                )}
                {item.label}
              </button>
            ))}

            <button
              onClick={async () => {
                setMenuOpen(false);
                await handleLogout();
              }}
              className="mt-4 w-full text-left py-3 px-4 rounded-xl text-red-200 bg-red-500/15 hover:bg-red-500/30 transition-all font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}




    
