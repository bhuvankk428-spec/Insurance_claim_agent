import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";

export default function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm(prevForm => ({ ...prevForm, [e.target.name]: e.target.value }));
    if (error) setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      navigate("/choose");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/choose");
    } catch (err) {
      setError(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0e17] to-[#111827] flex flex-col lg:flex-row overflow-hidden">
      {/* Left: Login Card */}
      <div className="w-full lg:w-2/5 min-h-screen flex justify-center items-center p-4 sm:p-6 lg:p-6 bg-black/50 backdrop-blur-sm">
        
        {/* 🔴 ONLY CHANGE IS HERE */}
        <div className="scale-[0.9] bg-neutral-900/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md sm:max-w-lg lg:max-w-lg flex flex-col items-center p-6 sm:p-8 lg:p-8 border border-neutral-800/50">

          {/* Logo */}
          <div className="flex justify-center mb-6 sm:mb-8 lg:mb-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl border-4 border-sky-500/60 bg-gradient-to-br from-sky-900/50 to-violet-900/50 flex items-center justify-center shadow-2xl">
              <img
                src="/logo.png"
                alt="QK.AI Logo"
                className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-contain drop-shadow-lg"
              />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3 bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 bg-clip-text text-transparent drop-shadow-2xl">
              Welcome Back
            </h1>
            <p className="text-neutral-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-md mx-auto">
              Sign in to your QK.AI account to access policy analysis and claim tools
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 mb-6 lg:mb-8 w-full">
            <input
              className="block w-full p-4 sm:p-5 rounded-2xl bg-[#0f1117]/80 text-white border-2 border-neutral-700/50"
              type="email"
              name="email"
              placeholder="Enter your email"
              onChange={handleChange}
              value={form.email}
              disabled={loading}
              required
            />

            <input
              className="block w-full p-4 sm:p-5 rounded-2xl bg-[#0f1117]/80 text-white border-2 border-neutral-700/50"
              type="password"
              name="password"
              placeholder="Enter your password"
              onChange={handleChange}
              value={form.password}
              disabled={loading}
              required
            />

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-900/40 border-2 border-red-500/40 rounded-2xl text-red-200">
                {error}
              </div>
            )}
          </form>

          <button
            type="submit"
            disabled={loading}
            className="group w-full p-4 sm:p-5 lg:p-6 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-violet-600 text-white font-bold mb-6"
          >
            {loading ? "Signing in..." : "Sign In to QK.AI"}
          </button>

          <p className="text-neutral-400 text-sm mb-6">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-sky-400 font-bold"
            >
              Create Account
            </button>
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group w-full p-4 rounded-2xl bg-[#1f1f1f]/80 text-neutral-200 flex justify-center gap-3"
          >
            Continue with Google
          </button>
        </div>
      </div>

      {/* Right Image */}
      <div className="hidden lg:block lg:w-3/5 min-h-screen relative overflow-hidden">
        <img
          src="/login.jpg"
          alt="QK.AI Dashboard Preview"
          className="absolute inset-0 w-full h-full object-cover brightness-75"
        />
      </div>
    </div>
  );
}
