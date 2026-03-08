import { FaArrowLeft, FaHeadphonesAlt, FaPodcast } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "./ui/Navbar";

const podcastShows = [
  {
    title: "The Journal",
    focus: "Daily business and market stories with clear context.",
    link: "https://www.wsj.com/podcasts/the-journal",
    platform: "WSJ",
  },
  {
    title: "Odd Lots",
    focus: "Macro, markets, and deep dives into finance trends.",
    link: "https://www.bloomberg.com/oddlots-podcast",
    platform: "Bloomberg",
  },
  {
    title: "Planet Money",
    focus: "Easy-to-follow economics explained through real stories.",
    link: "https://www.npr.org/sections/money/",
    platform: "NPR",
  },
  {
    title: "The Indicator",
    focus: "Short daily episodes on markets, policy, and money moves.",
    link: "https://www.npr.org/podcasts/510325/the-indicator-from-planet-money",
    platform: "NPR",
  },
];

export default function FinancePodcast() {
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

      <main className="relative z-10 flex-1 px-4 sm:px-6 pt-20 sm:pt-24 pb-12 lg:pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs sm:text-sm text-cyan-200 mb-4">
                <FaPodcast />
                Finance podcast picks
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                MoneyWave Studio
              </h1>
              <p className="text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed">
                Listen to high-signal shows on investing, markets, and the
                economy. Curated for quick weekly learning.
              </p>
            </div>
            <button
              onClick={() => navigate("/choose")}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-700/60 px-4 py-2 text-xs sm:text-sm text-neutral-200 hover:bg-white/10 transition w-fit"
            >
              <FaArrowLeft />
              Back
            </button>
          </div>

          <div className="mb-8 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-6 py-5 sm:py-6 flex items-start gap-3 backdrop-blur-sm">
            <FaHeadphonesAlt className="text-emerald-200 mt-1" />
            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
              Play an episode while commuting or reviewing claims. Finance
              knowledge compounds when consumed consistently.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {podcastShows.map((show) => (
              <article
                key={show.title}
                className="group bg-[#121827]/90 backdrop-blur-xl border border-[#1f2836]/80 hover:border-cyan-500/60 hover:bg-[#151c2b] transition-all duration-300 rounded-2xl p-5 sm:p-6 flex flex-col shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    {show.title}
                  </h2>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                    {show.platform}
                  </span>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed mb-5">
                  {show.focus}
                </p>
                <a
                  href={show.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto inline-flex items-center justify-center rounded-full bg-cyan-600/90 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white transition"
                >
                  Open podcast
                </a>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
