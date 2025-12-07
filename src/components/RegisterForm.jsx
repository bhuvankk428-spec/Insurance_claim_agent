import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export default function RegisterForm() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    username: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm(prevForm => ({ ...prevForm, [e.target.name]: e.target.value }));
    if (error) setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.email || !form.username || !form.password || !form.confirm) {
      setError("Please fill all fields");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      await updateProfile(cred.user, { displayName: form.username });
      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => navigate("/choose"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setSuccess("Signed up with Google! Redirecting...");
      setTimeout(() => navigate("/choose"), 1000);
    } catch (err) {
      setError(err.message || "Google sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0e17] to-[#111827] flex flex-col lg:flex-row">
      {/* Left: Register Card - Full width mobile, 40% desktop */}
      <div className="w-full lg:w-2/5 min-h-screen lg:min-h-0 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 bg-black/50 backdrop-blur-sm lg:backdrop-blur-sm">
        <form
          onSubmit={handleSubmit}
          className="bg-neutral-900/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md sm:max-w-lg lg:max-w-lg flex flex-col items-center p-6 sm:p-8 lg:p-10 border border-neutral-800/50"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6 sm:mb-8 lg:mb-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl border-4 border-emerald-500/60 bg-gradient-to-br from-emerald-900/50 to-sky-900/50 flex items-center justify-center shadow-2xl">
              <img
                src="/logo.png"
                alt="QK.AI Logo"
                className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-contain drop-shadow-lg"
              />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3 bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400 bg-clip-text text-transparent drop-shadow-2xl">
              Create Account
            </h1>
            <p className="text-neutral-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-md mx-auto">
              Join QK.AI and simplify your insurance management
            </p>
          </div>

          {/* Form inputs */}
          <div className="w-full space-y-4 sm:space-y-5 mb-6 lg:mb-8">
            {/* Username */}
            <div>
              <input
                className="block w-full p-4 sm:p-5 rounded-2xl bg-[#0f1117]/80 backdrop-blur-sm text-white border-2 border-neutral-700/50 hover:border-neutral-600/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all duration-300 text-base sm:text-lg placeholder-neutral-400 disabled:opacity-50"
                type="text"
                name="username"
                autoComplete="username"
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Email */}
            <div>
              <input
                className="block w-full p-4 sm:p-5 rounded-2xl bg-[#0f1117]/80 backdrop-blur-sm text-white border-2 border-neutral-700/50 hover:border-neutral-600/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all duration-300 text-base sm:text-lg placeholder-neutral-400 disabled:opacity-50"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Passwords */}
            <div className="space-y-3 sm:space-y-4">
              <input
                className="block w-full p-4 sm:p-5 rounded-2xl bg-[#0f1117]/80 backdrop-blur-sm text-white border-2 border-neutral-700/50 hover:border-neutral-600/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all duration-300 text-base sm:text-lg placeholder-neutral-400 disabled:opacity-50"
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="Create password (min 6 chars)"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
              <input
                className="block w-full p-4 sm:p-5 rounded-2xl bg-[#0f1117]/80 backdrop-blur-sm text-white border-2 border-neutral-700/50 hover:border-neutral-600/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all duration-300 text-base sm:text-lg placeholder-neutral-400 disabled:opacity-50"
                type="password"
                name="confirm"
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={form.confirm}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Error/Success messages */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-900/40 border-2 border-red-500/40 rounded-2xl text-red-200 text-sm sm:text-base backdrop-blur-sm shadow-lg">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 p-4 bg-emerald-900/40 border-2 border-emerald-500/40 rounded-2xl text-emerald-200 text-sm sm:text-base backdrop-blur-sm shadow-lg animate-pulse">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="leading-relaxed">{success}</span>
              </div>
            )}
          </div>

          {/* Create account button */}
          <button
            type="submit"
            disabled={loading}
            className="group w-full p-4 sm:p-5 lg:p-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-sky-600 text-white font-bold text-base sm:text-lg shadow-2xl hover:from-emerald-500 hover:to-sky-500 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 transition-all duration-300 hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-6 sm:mb-8"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                  <rcle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Account...
              </span>
            ) : (
              "Create QK.AI Account"
            )}
          </button>

          {/* Login link */}
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-neutral-400 text-sm sm:text-base">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/")}
                disabled={loading}
                className="text-emerald-400 font-bold hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded transition-all duration-200 disabled:opacity-50"
              >
                Sign In
              </button>
            </p>
          </div>

          {/* Divider */}
          <div className="relative mb-6 sm:mb-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-700/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-black/80 px-4 py-2 text-neutral-500">
                Or sign up with
              </span>
            </div>
          </div>

          {/* Google signup */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="group w-full p-4 rounded-2xl bg-[#1f1f1f]/80 hover:bg-[#2a2a2a]/80 backdrop-blur-sm border border-neutral-600/50 hover:border-neutral-500/70 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-neutral-200 hover:text-neutral-100"
          >
            <svg width="22" height="22" fill="currentColor" className="drop-shadow-sm group-hover:scale-110 transition-transform">
              <path d="M19.6 10.2c0-.7-.1-1.5-.2-2.2H10v4.4h5.3c-.2 1.2-.8 2.3-1.8 3.1v2.6h2.9c1.6-1.5 2.5-3.7 2.5-6z" />
              <path d="M10 20c2.4 0 4.4-.8 5.8-2.1l-2.9-2.6c-.8.6-1.9.9-2.9.9-2.3 0-4.2-1.6-4.8-3.8H2.1v2.4C3.6 18.5 6.6 20 10 20z" />
              <path d="M5.2 12.4C4.9 11.6 4.7 10.8 4.7 10s.2-1.6.4-2.4V5.2H2.1C1.4 6.6 1 8.2 1 10s.4 3.4 1.1 4.8l2.9-2.4z" />
              <path d="M10 3.8c1.3 0 2.4.4 3.2 1.3l2.3-2.3C15.1 1.1 12.7 0 10 0 6.6 0 3.6 1.5 2.1 5.2l2.9 2.4C5.7 6.1 7.7 3.8 10 3.8z" />
            </svg>
            <span className="font-semibold text-sm sm:text-base">Continue with Google</span>
          </button>
        </form>
      </div>

      {/* Right: Image side - DESKTOP ONLY (lg: and up) */}
      <div className="hidden lg:block lg:w-3/5 min-h-screen relative overflow-hidden group bg-gradient-to-br from-emerald-900/20 to-sky-900/20">
        <div className="absolute inset-0 p-[4px] rounded-tl-[50px] rounded-bl-[50px] bg-gradient-to-r from-emerald-600/80 via-teal-500/60 to-emerald-700/80 shadow-2xl group-hover:shadow-emerald-500/50">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-tl-[46px] rounded-bl-[46px] z-10" />
          
          <img
            src="/login.jpg"
            alt="QK.AI Registration Preview"
            className="w-full h-full object-cover absolute inset-0 rounded-tl-[46px] rounded-bl-[46px] brightness-75 z-0"
          />
          
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-transparent to-teal-500/20 rounded-tl-[46px] rounded-bl-[46px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-5" />
        </div>

        <div className="absolute bottom-12 left-12 text-white z-20 pointer-events-none">
          <h2 className="text-3xl font-bold mb-4 drop-shadow-2xl bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
            Get Started Today
          </h2>
          <p className="text-xl max-w-md leading-relaxed drop-shadow-xl group-hover:scale-105 transition-transform duration-300">
            Join thousands of users managing their insurance with ease.
          </p>
        </div>
      </div>
    </div>
  );
}
