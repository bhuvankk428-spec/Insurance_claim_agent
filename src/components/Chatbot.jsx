import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "./ui/Navbar.jsx";
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");
const CHAT_API_BASE = (
  import.meta.env.VITE_CHAT_API_URL ||
  (isLocalhost ? "http://localhost:5175" : "")
).replace(/\/$/, "");

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

function getVoiceByLanguage(voices, responseLanguage) {
  if (!voices.length) return null;
  if (responseLanguage === "hi") {
    return (
      voices.find((v) => v.lang === "hi-IN") ||
      voices.find((v) => v.lang.startsWith("hi")) ||
      voices.find((v) => v.lang === "en-IN") ||
      voices[0]
    );
  }
  if (responseLanguage === "te") {
    return (
      voices.find((v) => v.lang === "te-IN") ||
      voices.find((v) => v.lang.startsWith("te")) ||
      voices.find((v) => v.lang === "en-IN") ||
      voices[0]
    );
  }
  if (responseLanguage === "kn") {
    return (
      voices.find((v) => v.lang === "kn-IN") ||
      voices.find((v) => v.lang.startsWith("kn")) ||
      voices.find((v) => v.lang === "en-IN") ||
      voices[0]
    );
  }
  return (
    voices.find(
      (v) =>
        v.lang === "en-IN" && v.name.toLowerCase().includes("female")
    ) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices.find((v) => v.lang === "hi-IN") ||
    voices[0]
  );
}


export default function PolicySummarizer() {
  const [request, setRequest] = useState("");
  const [details, setDetails] = useState("");
  const [domain, setDomain] = useState("any");
  const [messages, setMessages] = useState([]);
  const [confidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [responseLanguage, setResponseLanguage] = useState("en");
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

  useEffect(() => {
    document.body.classList.add("page-chatbot");
    return () => {
      document.body.classList.remove("page-chatbot");
    };
  }, []);

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


  setMessages(prev => [...prev, { from: "user", text: userText }]);

 
  let aiIndex;
  setMessages(prev => {
    aiIndex = prev.length;
    return [...prev, { from: "ai", text: "" }];
  });

  try {
    const endpoint = CHAT_API_BASE
      ? `${CHAT_API_BASE}/api/rag-chat`
      : "/api/rag-chat";
    const payload = { question: request, language: responseLanguage };
    if (details && details.trim()) {
      payload.details = { text: details.trim() };
    }
    if (finalDomain !== "any") {
      payload.domain = finalDomain;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Chat service request failed");
    }

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

      
      setMessages(prev => {
        const updated = [...prev];
        updated[aiIndex] = {
          ...updated[aiIndex],
          text: fullText,
        };
        return updated;
      });

      
      if (!firstSpeechTriggered && fullText.length > 200) {
        firstSpeechTriggered = true;
        const selectedVoice = getVoiceByLanguage(voices, responseLanguage);
        if (selectedVoice && !muted && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(
            fullText.replace(/[#*]/g, "")
          );
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
          utterance.rate = 0.95;
          utterance.pitch = 1.1;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
      }
    }

  } catch (err) {
    console.error(err);
    setMessages(prev => [
      ...prev,
      {
        from: "ai",
        text:
          "Warning: We're having trouble fetching policy details right now. Please try again shortly.",
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
    <div className="pt-16 box-border min-h-[100dvh] lg:h-[100dvh] overflow-y-auto lg:overflow-hidden bg-black text-white flex flex-col lg:flex-row">
      
      {/* LEFT PANEL */}
      <aside className="w-full lg:w-[420px] h-auto lg:h-full min-h-0 overflow-visible lg:overflow-y-auto bg-black px-4 sm:px-6 py-6 sm:py-8 border-b lg:border-b-0 lg:border-r border-sky-500/30">
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
            {muted ? "Voice muted" : "Voice enabled"}
          </span>
          {loading && (
            <span className="text-sky-300 text-sm">Thinking...</span>
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
            value={responseLanguage}
            onChange={(e) => setResponseLanguage(e.target.value)}
            disabled={loading}
          >
            <option value="en">Response language: English</option>
            <option value="hi">Response language: Hindi</option>
            <option value="te">Response language: Telugu</option>
            <option value="kn">Response language: Kannada</option>
          </select>

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
      <main className="flex-1 bg-black p-4 sm:p-6 min-h-0 overflow-visible lg:overflow-y-auto">
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
