import { useEffect, useMemo, useRef, useState } from "react";
import { FaArrowLeft, FaHeadphonesAlt, FaMicrophoneAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "./ui/Navbar";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");
const CHAT_API_BASE = (
  import.meta.env.VITE_CHAT_API_URL ||
  (isLocalhost ? "http://localhost:5175" : "")
).replace(/\/$/, "");

const PAIR_OPTIONS = [
  { value: "gemini_grok", label: "Gemini + Grok" },
  { value: "openai_grok", label: "OpenAI + Grok" },
  { value: "openai_gemini", label: "OpenAI + Gemini" },
];

function getVoiceCandidates(voices, preferredLang = "en") {
  const list = voices.filter((v) => v.lang.toLowerCase().startsWith(preferredLang));
  return list.length ? list : voices;
}

export default function AIFinancePodcast() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [pair, setPair] = useState("gemini_grok");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [podcast, setPodcast] = useState(null);
  const [voices, setVoices] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentLine, setCurrentLine] = useState(-1);
  const speechIndexRef = useRef(0);
  const playTokenRef = useRef(0);

  const dialogue = podcast?.dialogue || [];
  const speakers = useMemo(
    () => [...new Set(dialogue.map((line) => line.speaker))],
    [dialogue]
  );

  useEffect(() => {
    function loadVoices() {
      const next = window.speechSynthesis?.getVoices?.() || [];
      if (next.length) setVoices(next);
    }
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stopPlayback() {
    playTokenRef.current += 1;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentLine(-1);
    speechIndexRef.current = 0;
  }

  function speakFrom(index, token) {
    if (token !== playTokenRef.current) return;
    if (!window.speechSynthesis || !dialogue.length) return;
    if (index >= dialogue.length) {
      stopPlayback();
      return;
    }

    const line = dialogue[index];
    setCurrentLine(index);
    speechIndexRef.current = index;

    const utterance = new SpeechSynthesisUtterance(line.text);
    const candidates = getVoiceCandidates(voices);
    if (candidates.length) {
      const speakerIndex = Math.max(0, speakers.indexOf(line.speaker));
      utterance.voice = candidates[speakerIndex % candidates.length];
      utterance.lang = utterance.voice.lang;
    }
    utterance.rate = 0.97;
    utterance.pitch = speakers.indexOf(line.speaker) % 2 === 0 ? 1.0 : 1.08;
    utterance.onend = () => {
      if (token === playTokenRef.current && !isPaused) {
        speakFrom(index + 1, token);
      }
    };
    window.speechSynthesis.speak(utterance);
  }

  function playPodcast() {
    if (!dialogue.length || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPaused(false);
    setIsSpeaking(true);
    playTokenRef.current += 1;
    const token = playTokenRef.current;
    const nextIndex = currentLine >= 0 ? currentLine : 0;
    speakFrom(nextIndex, token);
  }

  function pausePodcast() {
    if (!window.speechSynthesis || !isSpeaking) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsSpeaking(false);
  }

  function resumePodcast() {
    if (!window.speechSynthesis || !isPaused) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
    setIsSpeaking(true);
  }

  async function generatePodcast() {
    setLoading(true);
    setError("");
    stopPlayback();
    try {
      const endpoint = CHAT_API_BASE
        ? `${CHAT_API_BASE}/api/finance-podcast`
        : "/api/finance-podcast";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim() || undefined,
          pair,
          durationMinutes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate podcast");
      }
      setPodcast(data);
    } catch (err) {
      setError(err?.message || "Unable to generate podcast right now");
    } finally {
      setLoading(false);
    }
  }

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
                <FaMicrophoneAlt />
                qk.ai presents live podcast only for you.
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                AI Finance Duel
              </h1>
              <p className="text-sm sm:text-base text-neutral-300 max-w-3xl leading-relaxed">
                Pick two AI hosts, enter a topic or leave blank for trending finance, then
                generate a 10-minute style debate where one asks and the other answers.
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

          <div className="rounded-2xl border border-neutral-800/70 bg-[#0f1521]/80 p-5 sm:p-6 mb-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs text-neutral-300 mb-2 block">AI pair</label>
                <select
                  value={pair}
                  onChange={(e) => setPair(e.target.value)}
                  className="w-full rounded-xl bg-black/60 border border-neutral-700 px-4 py-3 text-sm"
                  disabled={loading}
                >
                  {PAIR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-300 mb-2 block">Duration</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-xl bg-black/60 border border-neutral-700 px-4 py-3 text-sm"
                  disabled={loading}
                >
                  <option value={6}>6 mins</option>
                  <option value={8}>8 mins</option>
                  <option value={10}>10 mins</option>
                  <option value={12}>12 mins</option>
                </select>
              </div>
              <button
                onClick={generatePodcast}
                disabled={loading}
                className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow disabled:opacity-60 self-end"
              >
                {loading ? "Generating..." : "Generate Podcast"}
              </button>
            </div>
            <div className="mt-4">
              <label className="text-xs text-neutral-300 mb-2 block">
                Topic (optional)
              </label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Example: Should I rotate from AI stocks to value stocks in 2026?"
                className="w-full rounded-xl bg-black/60 border border-neutral-700 px-4 py-3 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm text-red-200 mb-6">
              {error}
            </div>
          )}

          {!podcast && !loading && (
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-6 py-8 text-sm sm:text-base text-emerald-100 flex items-center gap-3">
              <FaHeadphonesAlt />
              Generate a podcast script, then press play to hear both AI hosts.
            </div>
          )}

          {podcast && (
            <div className="rounded-2xl border border-neutral-800/70 bg-[#0f1521]/80 p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mb-1">{podcast.title}</h2>
                  <p className="text-sm text-neutral-300">{podcast.topic}</p>
                </div>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200 w-fit">
                  ~{podcast.estimatedDurationMinutes || durationMinutes} mins
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <button
                  onClick={playPodcast}
                  disabled={isSpeaking || !dialogue.length}
                  className="rounded-full bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  Play
                </button>
                <button
                  onClick={pausePodcast}
                  disabled={!isSpeaking}
                  className="rounded-full border border-neutral-600 px-4 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  Pause
                </button>
                <button
                  onClick={resumePodcast}
                  disabled={!isPaused}
                  className="rounded-full border border-neutral-600 px-4 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  Resume
                </button>
                <button
                  onClick={stopPlayback}
                  disabled={!isSpeaking && !isPaused}
                  className="rounded-full border border-neutral-600 px-4 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  Stop
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {dialogue.map((line, idx) => {
                  const isLeft = idx % 2 === 0;
                  const isActive = currentLine === idx;
                  return (
                    <div
                      key={`${line.speaker}-${idx}`}
                      className={`max-w-[92%] sm:max-w-[80%] rounded-2xl px-4 py-3 border ${
                        isLeft
                          ? "mr-auto bg-[#121827]/90 border-cyan-500/30"
                          : "ml-auto bg-[#1a1427]/90 border-fuchsia-500/30"
                      } ${isActive ? "ring-1 ring-amber-300/80" : ""}`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-neutral-300 mb-1">
                        {line.speaker}
                      </p>
                      <p className="text-sm leading-relaxed text-neutral-100">{line.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
