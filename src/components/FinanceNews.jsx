import { useEffect, useState } from "react";
import { FaNewspaper, FaSyncAlt, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "./ui/Navbar";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");
const API_BASE = isLocalhost
  ? "http://localhost:5174"
  : import.meta.env.VITE_CLAIM_API_URL ||
    import.meta.env.VITE_API_URL ||
    "";

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FALLBACK_IMAGE = "/finance-news-fallback.svg";

export default function FinanceNews() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");

  async function loadNews(signal) {
    if (!API_BASE) {
      setLoading(false);
      setError(
        "Missing claim API URL. Set VITE_CLAIM_API_URL or VITE_API_URL in Vercel."
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/finance-news`, { signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch finance news");
      }
      setArticles(Array.isArray(data.articles) ? data.articles : []);
      setLastUpdated(data.updatedAt ? new Date(data.updatedAt) : new Date());
    } catch (err) {
      if (err?.name !== "AbortError") {
        setError(err?.message || "Unable to load news right now");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadNews(controller.signal);
    const intervalId = setInterval(() => {
      loadNews(controller.signal);
    }, REFRESH_INTERVAL_MS);
    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, []);

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
                <FaNewspaper />
                Finance news (last 24 hours)
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                Market Pulse
              </h1>
              <p className="text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed">
                Fresh coverage from the last 24 hours with visuals for quicker scanning.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/choose")}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-700/60 px-4 py-2 text-xs sm:text-sm text-neutral-200 hover:bg-white/10 transition"
              >
                <FaArrowLeft />
                Back
              </button>
              <button
                onClick={() => loadNews()}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow"
              >
                <FaSyncAlt />
                Refresh now
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-400 mb-6">
            <span>
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleString()}`
                : "Updating..."}
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
              Auto refreshes daily
            </span>
          </div>

          {loading && (
            <div className="rounded-2xl border border-neutral-800/70 bg-[#0f1521]/80 px-6 py-10 text-center text-neutral-300">
              Loading the latest finance headlines...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-5 text-sm text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && articles.length === 0 && (
            <div className="rounded-2xl border border-neutral-800/70 bg-[#0f1521]/80 px-6 py-10 text-center text-neutral-300">
              No finance news with images was found in the last 24 hours.
            </div>
          )}

          {!loading && !error && articles.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {articles.map((article, index) => (
                <article
                  key={`${article.url}-${index}`}
                  className="group bg-[#121827]/90 backdrop-blur-xl border border-[#1f2836]/80 hover:border-cyan-500/60 hover:bg-[#151c2b] transition-all duration-300 rounded-2xl p-5 sm:p-6 flex flex-col shadow-xl hover:-translate-y-1"
                >
                  <div className="rounded-xl overflow-hidden border border-neutral-800/70 bg-black/40 mb-4">
                    <img
                      src={article.urlToImage || FALLBACK_IMAGE}
                      alt={article.title}
                      className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                  <h2 className="text-lg font-bold text-white mb-2 leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-sm text-neutral-300 leading-relaxed mb-4 line-clamp-3">
                    {article.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between text-xs text-neutral-400">
                    <span>{article.source}</span>
                    <span>
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleString()
                        : "Just now"}
                    </span>
                  </div>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center justify-center rounded-full bg-cyan-600/90 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white transition"
                  >
                    Read full story
                  </a>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
