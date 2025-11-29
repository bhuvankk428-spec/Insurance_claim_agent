import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterForm() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    username: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.email || !form.username || !form.password || !form.confirm) {
      setError("Fill all fields");
    } else if (form.password !== form.confirm) {
      setError("Passwords do not match");
    } else {
      setSuccess("Registered! You can now log in.");
      setTimeout(() => navigate("/"), 1500);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-black">
      {/* Left: Register Card (50%) */}
      <div className="w-1/2 min-h-screen flex flex-col justify-center items-center bg-black">
        <form
          onSubmit={handleSubmit}
          className="bg-neutral-900/80 rounded-xl shadow-2xl w-full max-w-md flex flex-col items-center p-8"
        >
          <div className="w-12 h-12 mb-4 rounded-full mx-auto border-2 border-blue-600 flex items-center justify-center bg-white overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <h2 className="text-white text-center text-2xl font-semibold mb-2">Create Account</h2>
          <p className="text-neutral-400 text-sm mb-6 text-center">
            Already have an account?
            <span
              className="text-blue-400 cursor-pointer hover:underline ml-2"
              onClick={() => navigate("/")}
            >
              Log in
            </span>
          </p>
          <input
            className="block w-full p-3 rounded bg-neutral-800 text-white border border-neutral-700 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            type="text"
            name="username"
            autoComplete="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
          />
          <input
            className="block w-full p-3 rounded bg-neutral-800 text-white border border-neutral-700 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
          <input
            className="block w-full p-3 rounded bg-neutral-800 text-white border border-neutral-700 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />
          <input
            className="block w-full p-3 rounded bg-neutral-800 text-white border border-neutral-700 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            type="password"
            name="confirm"
            autoComplete="new-password"
            placeholder="Confirm Password"
            value={form.confirm}
            onChange={handleChange}
          />
          {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
          {success && <div className="text-green-500 mb-2 text-sm">{success}</div>}
          <button
            type="submit"
            className="w-full p-3 rounded bg-blue-600 shadow-md text-white font-semibold hover:bg-blue-700 transition mb-6"
          >
            Create Account
          </button>
          <div className="flex w-full justify-between gap-2 mt-3">
            <button className="flex-1 rounded py-2 bg-neutral-800 hover:bg-neutral-700 transition">
              <svg width="20" height="20" fill="currentColor" className="mx-auto text-blue-400"><path d="M19.6 10.2c0-.7-.1-1.5-.2-2.2H10v4.4h5.3c-.2 1.2-.8 2.3-1.8 3.1v2.6h2.9c1.6-1.5 2.5-3.7 2.5-6z"/><path d="M10 20c2.4 0 4.4-.8 5.8-2.1l-2.9-2.6c-.8.6-1.9.9-2.9.9-2.3 0-4.2-1.6-4.8-3.8H2.1v2.4C3.6 18.5 6.6 20 10 20z"/><path d="M5.2 12.4C4.9 11.6 4.7 10.8 4.7 10s.2-1.6.4-2.4V5.2H2.1C1.4 6.6 1 8.2 1 10s.4 3.4 1.1 4.8l2.9-2.4z"/><path d="M10 3.8c1.3 0 2.4.4 3.2 1.3l2.3-2.3C15.1 1.1 12.7 0 10 0 6.6 0 3.6 1.5 2.1 5.2l2.9 2.4C5.7 6.1 7.7 3.8 10 3.8z"/></svg>
            </button>
          </div>
        </form>
      </div>
      {/* Right: Image (50%) */}
      <div className="w-1/2 min-h-screen flex items-center justify-center bg-black">
        <img
          src="/login.jpg"
          alt="Login Visual"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
