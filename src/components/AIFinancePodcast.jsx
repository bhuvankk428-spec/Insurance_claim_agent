import { FaArrowLeft, FaMicrophoneAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "./ui/Navbar";

export default function AIFinancePodcast() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex flex-col relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 -left-32 h-96 w-96 rounded-full bg-cyan-500/12 blur-[140px]" />
        <div className="absolute top-40 -right-24 h-80 w-80 rounded-full bg-amber-400/12 blur-[130px]" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f14] via-[#0b0f14]/90 to-[#0b0f14]" />
      </div>
      <Navbar />

      <main className="relative z-10 flex-1 px-4 sm:px-6 pt-20 sm:pt-24 pb-12 lg:pb-20 flex items-center">
        <div className="max-w-3xl mx-auto w-full">
          <div className="rounded-3xl border border-cyan-500/35 bg-[#0f1521]/85 p-8 sm:p-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs sm:text-sm text-cyan-200 mb-5">
              <FaMicrophoneAlt />
              AI Finance Podcast
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-3">Coming Soon</h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl mx-auto">
              We are preparing the AI-hosted finance podcast experience.
              This page will be enabled in an upcoming release.
            </p>

            <button
              onClick={() => navigate("/choose")}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-neutral-700/60 px-5 py-2.5 text-sm text-neutral-200 hover:bg-white/10 transition"
            >
              <FaArrowLeft />
              Back
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
