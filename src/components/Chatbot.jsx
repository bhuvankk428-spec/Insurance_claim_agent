import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "./ui/Navbar.jsx";
const CHAT_API_BASE = import.meta.env.VITE_CHAT_API_URL
  ? import.meta.env.VITE_CHAT_API_URL.replace(/\/$/, "")
  : "";

/* ---------------- AUTO DOMAIN DETECTION ---------------- */
function detectDomain(text) {
  const t = text.toLowerCase();
  if (t.includes("car") || t.includes("bike") || t.includes("vehicle"))
    return "Motor Insurance";
  if (t.includes("health") || t.includes("hospital") || t.includes("medical"))
    return "Health Insurance";
  if (t.includes("house") || t.includes("home") || t.includes("fire"))
    return "Home Insurance";
  if (t.includes("travel") || t.includes("trip"))
    return "Travel Insurance";
  if (t.includes("crop") || t.includes("farm"))
    return "Crop Insurance";
  if (t.includes("life") || t.includes("death"))
    return "Life Insurance";
  return null;
}

/* ---------------- VOICE ---------------- */
function speak(text, muted, voices) {
  if (muted || !window.speechSynthesis || voices.length === 0) return;

  const preferred =
    voices.find(v => v.lang === "hi-IN") ||
    voices.find(v => v.lang === "en-IN" && v.name.toLowerCase().includes("female")) ||
    voices.find(v => v.lang.startsWith("en")) ||
    voices[0];

  if (!preferred) return;

  const utterance = new SpeechSynthesisUtterance(
    text.replace(/[#*]/g, "")
  );

  utterance.voice = preferred;
  utterance.lang = preferred.lang;
  utterance.rate = 0.95;
  utterance.pitch = 1.1;

  window.speechSynthesis.cancel(); 
  window.speechSynthesis.speak(utterance);
}


export default function PolicySummarizer() {
  const [request, setRequest] = useState("");
  const [details, setDetails] = useState("");
  const [domain, setDomain] = useState("any");
  const [messages, setMessages] = useState([]);
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voices, setVoices] = useState([]); 
  const messagesEndRef = useRef(null);

  /* -------- LOAD VOICES PROPERLY -------- */
  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoices(v);
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e) {
  e.preventDefault();
  if (!request.trim()) return;

  let finalDomain = domain;
  if (domain === "any") {
    const detected = detectDomain(request);
    if (detected) finalDomain = detected;
  }

  const userText =
    details.trim() ? `${request}\nDetails: ${details}` : request;

  setLoading(true);

  // 1️⃣ Push user message
  setMessages(prev => [...prev, { from: "user", text: userText }]);

  // 2️⃣ Create empty AI message (important)
  let aiIndex;
  setMessages(prev => {
    aiIndex = prev.length;
    return [...prev, { from: "ai", text: "" }];
  });

  try {
    const endpoint = CHAT_API_BASE
      ? `${CHAT_API_BASE}/api/rag-chat`
      : "/api/rag-chat";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: request,
        details,
        domain: finalDomain === "any" ? null : finalDomain,
      }),
    });

    if (!response.body) {
      throw new Error("Streaming not supported");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let fullText = "";
    let firstSpeechTriggered = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;

      // 3️⃣ Incrementally update AI message
      setMessages(prev => {
        const updated = [...prev];
        updated[aiIndex] = {
          ...updated[aiIndex],
          text: fullText,
        };
        return updated;
      });

      // 🔊 Start voice early (optional but awesome)
      if (!firstSpeechTriggered && fullText.length > 200) {
        firstSpeechTriggered = true;
        speak(fullText, muted, voices);
      }
    }

  } catch (err) {
    console.error(err);
    setMessages(prev => [
      ...prev,
      {
        from: "ai",
        text:
          "⚠️ We’re having trouble fetching policy details right now. Please try again shortly.",
      },
    ]);
  }

  setLoading(false);
  setRequest("");
  setDetails("");
}


 return (
  <>
    {/* FIXED NAVBAR */}
    <Navbar />

    {/* MAIN LAYOUT */}
    <div className="pt-16 min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] lg:overflow-hidden bg-black text-white flex flex-col lg:flex-row">
      
      {/* LEFT PANEL */}
      <aside className="w-full lg:w-[420px] lg:h-full lg:min-h-0 lg:overflow-y-auto bg-black px-4 sm:px-6 py-6 sm:py-8 border-b lg:border-b-0 lg:border-r border-sky-500/30">
        <div className="rounded-2xl border border-sky-400/40 bg-sky-400/10 px-4 py-2 text-xs text-sky-200 inline-flex items-center gap-2 mb-4">
          Smart policy guidance
        </div>
        <h2 className="text-2xl font-bold mb-2">Policy Advisor</h2>
        <p className="text-white/70 mb-6 text-sm leading-relaxed">
          Compare, summarize, and ask questions in plain language.
        </p>

        {/* STATUS BAR */}
        <div className="flex items-center justify-between mb-6 text-xs">
          <span className="text-sm">
            {muted ? "🔇 Voice Muted" : "🔊 Voice Enabled"}
          </span>
          {loading && (
            <span className="text-sky-300 text-sm">⏳ Thinking...</span>
          )}
        </div>

        {/* MUTE BUTTON */}
        <button
          onClick={() => {
            if (!muted) window.speechSynthesis.cancel();
            setMuted(!muted);
          }}
          className="mb-6 w-full py-2 rounded-lg bg-sky-600/30 hover:bg-sky-500/40 border border-sky-400/30 transition"
        >
          {muted ? "Enable Voice" : "Mute Voice"}
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <select
            className="w-full rounded-xl bg-black border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={loading}
          >
            <option value="any">Any domain</option>
            <option value="Health Insurance">Health Insurance</option>
            <option value="Motor Insurance">Motor Insurance</option>
            <option value="Crop Insurance">Crop / Agriculture</option>
            <option value="Travel Insurance">Travel Insurance</option>
            <option value="Home Insurance">Home Insurance</option>
            <option value="Life Insurance">Life Insurance</option>
          </select>

          <input
            className="w-full rounded-xl bg-black border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
            placeholder="Ask your insurance question..."
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            disabled={loading}
            required
          />

          <textarea
            className="w-full rounded-xl bg-black border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
            rows={4}
            placeholder="Optional details: age, city, budget, condition..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold bg-sky-500 hover:bg-sky-400 transition ${
              loading
                ? "opacity-70 cursor-not-allowed"
                : "hover:opacity-90"
            }`}
          >
            {loading ? "Analyzing..." : "Find Best Policy"}
          </button>
        </form>
      </aside>

      {/* RIGHT PANEL */}
      <main className="flex-1 bg-black p-4 sm:p-6 lg:min-h-0 lg:overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* CONFIDENCE CARD */}
          {confidence !== null && (
            <div className="bg-black border border-sky-500/20 rounded-xl p-4">
              <p className="font-semibold mb-2">
                Recommendation Confidence
              </p>
              <div className="w-full bg-white/10 rounded h-3">
                <div
                  className="bg-sky-400 h-3 rounded transition-all"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <p className="text-xs text-white/60 mt-1">
                Based on policy data & rule validation
              </p>
            </div>
          )}

          {/* CHAT */}
          {messages.length === 0 ? (
            <div className="text-center text-white/60 mt-20 sm:mt-32">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs text-sky-100">
                Ask a question to get started
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[95%] sm:max-w-[85%] p-4 sm:p-5 rounded-2xl leading-relaxed shadow-xl ${
                  msg.from === "user"
                    ? "ml-auto bg-sky-500 text-black"
                    : "bg-black border border-sky-500/20 text-white"
                }`}
              >
                {msg.from === "ai" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans">
                    {msg.text}
                  </pre>
                )}
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>
    </div>
  </>
);


}
