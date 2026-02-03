import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "./ui/Navbar.jsx";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5174";

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

  window.speechSynthesis.cancel(); // ✅ stop any previous speech
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
  const [voices, setVoices] = useState([]); // ✅ NEW
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
    const response = await fetch(`${API_BASE}/api/rag-chat`, {
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
          "We are having trouble fetching policy details right now. Please try again shortly.",
      },
    ]);
  }

  setLoading(false);
  setRequest("");
  setDetails("");
}


 return (
  <>
    <Navbar />

    <div className="pt-16 h-[calc(100vh-4rem)] bg-black text-white flex flex-col lg:flex-row relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-sky-600/15 blur-[120px]" />
        <div className="absolute top-16 -right-24 h-80 w-80 rounded-full bg-indigo-600/20 blur-[110px]" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:26px_26px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
      </div>

      <aside className="lg:w-[420px] h-full bg-[#121826]/90 px-6 py-8 border-r border-[#1f2734] overflow-y-auto relative z-10">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs text-sky-200 mb-3">
            Policy Advisor
          </div>
          <h2 className="text-2xl font-black mb-2">Smart Policy Q and A</h2>
          <p className="text-gray-400 text-sm">
            Compare and understand insurance policies intelligently
          </p>
        </div>

        <div className="flex items-center justify-between mb-6 text-sm">
          <span className="text-neutral-300">
            {muted ? "Voice Muted" : "Voice Enabled"}
          </span>
          {loading && (
            <span className="text-yellow-300">Thinking...</span>
          )}
        </div>

        <button
          onClick={() => {
            if (!muted) window.speechSynthesis.cancel();
            setMuted(!muted);
          }}
          className="mb-6 w-full py-2.5 rounded-xl bg-[#1b2332] hover:bg-[#222c3f] border border-[#273246] transition"
        >
          {muted ? "Enable Voice" : "Mute Voice"}
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <select
            className="w-full rounded-xl bg-[#0f1422] px-4 py-3 border border-[#253043] focus:outline-none focus:ring-4 focus:ring-sky-500/20"
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
            className="w-full rounded-xl bg-[#0f1422] px-4 py-3 border border-[#253043] focus:outline-none focus:ring-4 focus:ring-sky-500/20"
            placeholder="Ask your insurance question..."
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            disabled={loading}
            required
          />

          <textarea
            className="w-full rounded-xl bg-[#0f1422] px-4 py-3 border border-[#253043] focus:outline-none focus:ring-4 focus:ring-sky-500/20"
            rows={4}
            placeholder="Optional details: age, city, budget, condition..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 transition ${
              loading
                ? "opacity-70 cursor-not-allowed"
                : "hover:opacity-90"
            }`}
          >
            {loading ? "Analyzing..." : "Find Best Policy"}
          </button>
        </form>
      </aside>

      <main className="flex-1 h-full p-6 overflow-y-auto relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {confidence !== null && (
            <div className="bg-[#151b27]/90 border border-[#223043] rounded-2xl p-4 shadow-lg">
              <p className="font-semibold mb-2">
                Recommendation Confidence
              </p>
              <div className="w-full bg-[#223043] rounded h-3">
                <div
                  className="bg-emerald-400 h-3 rounded transition-all"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Based on policy data and rule validation
              </p>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-28">
              <p>Ask a question to get started.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[85%] p-5 rounded-2xl leading-relaxed shadow-xl ${
                  msg.from === "user"
                    ? "ml-auto bg-gradient-to-r from-indigo-600 to-sky-500"
                    : "bg-[#151b27] border border-[#223043]"
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


