import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../../firebase";

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
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0e17] to-[#111827] flex flex-col lg:flex-row overflow-hidden">
      {/* Left: Register Card */}
      <div className="w-full lg:w-2/5 min-h-screen flex justify-center items-center p-4 sm:p-6 lg:p-8 bg-black/50 backdrop-blur-sm">

        {/* 🔴 ONLY CHANGE IS HERE */}
        <form
          onSubmit={handleSubmit}
          className="scale-[0.9] bg-neutral-900/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md sm:max-w-lg lg:max-w-lg flex flex-col items-center p-6 sm:p-8 lg:p-10 border border-neutral-800/50"
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
            <input
              className="block w-full p-4 sm:p-5 rounded-2xl bg-[#0f1117]/80 text-white border-2 border-neutral-700/50"
              type="text"
              name="username"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              disabled={loading}
              required
            />

            <input
              className="block w-full p-4 sm:p-5 rounded-2xl bg-[#0f1117]/80 text-white border-2 border-neutral-700/50"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              required
            />

            <input
              className="block w-full p-4 sm:p-5 rounded-2xl bg-[#0f1117]/80 text-white border-2 border-neutral-700/50"
              type="password"
              name="password"
              placeholder="Create password"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              required
            />

            <input
              className="block w-full p-4 sm:p-5 rounded-2xl bg-[#0f1117]/80 text-white border-2 border-neutral-700/50"
              type="password"
              name="confirm"
              placeholder="Confirm password"
              value={form.confirm}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="w-full p-4 bg-red-900/40 text-red-200 rounded-2xl mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="w-full p-4 bg-emerald-900/40 text-emerald-200 rounded-2xl mb-4">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 sm:p-5 lg:p-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-sky-600 text-white font-bold mb-6"
          >
            {loading ? "Creating Account..." : "Create QK.AI Account"}
          </button>

          <p className="text-neutral-400 text-sm mb-6">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-emerald-400 font-bold"
            >
              Sign In
            </button>
          </p>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full p-4 rounded-2xl bg-[#1f1f1f]/80 text-neutral-200 flex justify-center gap-3"
          >
            Continue with Google
          </button>
        </form>
      </div>

      {/* Right Image */}
      <div className="hidden lg:block lg:w-3/5 min-h-screen relative overflow-hidden">
        <img
          src="/login.jpg"
          alt="QK.AI Registration Preview"
          className="absolute inset-0 w-full h-full object-cover brightness-75"
        />
      </div>
    </div>
  );
}
