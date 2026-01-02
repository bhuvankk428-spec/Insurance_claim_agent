import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    setMessages(prev => [...prev, { from: "user", text: userText }]);

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

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        { from: "ai", text: data.answer || "No response." },
      ]);

      if (typeof data.confidence === "number") {
        setConfidence(data.confidence);
      } else {
        setConfidence(null);
      }

      // 🔊 SPEAK (NOW WORKS)
      if (data.answer) speak(data.answer, muted, voices);

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
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="lg:w-[420px] lg:sticky lg:top-0 bg-gradient-to-b from-[#15181d] to-[#232834] px-6 py-10 border-r border-gray-700">
        <h2 className="text-2xl font-bold mb-6">Search Configuration</h2>

        {/* 🔇 MUTE / UNMUTE */}
        <button
  onClick={() => {
    if (!muted) {
      window.speechSynthesis.cancel(); // 🔇 STOP IMMEDIATELY
    }
    setMuted(!muted);
  }}
  className="mb-6 w-full py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
>
  {muted ? "🔇 Voice Muted" : "🔊 Voice Enabled"}
</button>


        <form onSubmit={handleSubmit} className="space-y-6">
          <select
            className="w-full rounded-lg bg-[#232834] px-4 py-3"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={loading}
          >
            <option value="any">Any domain</option>
            <option value="Health Insurance">Health Insurance</option>
            <option value="Motor Insurance">Motor Insurance</option>
            <option value="Personal Accident">Personal Accident</option>
            <option value="Travel Insurance">Travel Insurance</option>
            <option value="Home Insurance">Home Insurance</option>
            <option value="Crop Insurance">Crop / Agriculture</option>
            <option value="Life Insurance">Life Insurance</option>
          </select>

          <input
            className="w-full rounded-lg bg-[#232834] px-4 py-3"
            placeholder="eg. best car insurance in Bengaluru"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            disabled={loading}
            required
          />

          <textarea
            className="w-full rounded-lg bg-[#232834] px-4 py-3"
            rows={4}
            placeholder="Age, city, vehicle, budget..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold bg-gradient-to-r from-sky-500 to-indigo-600 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Searching..." : "Search Policies"}
          </button>
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-grow bg-[#121316] p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {confidence !== null && (
            <div>
              <p className="mb-2 font-semibold">Recommendation confidence</p>
              <div className="w-full bg-gray-700 rounded h-3">
                <div
                  className="bg-green-500 h-3 rounded"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {confidence}% confidence
              </p>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-32">
              <p>
                Enter your requirements on the left to get policy recommendations.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-xl ${
                  msg.from === "user"
                    ? "bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-600 ml-auto"
                    : "bg-[#232834]"
                }`}
              >
                {msg.from === "ai" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  <pre className="whitespace-pre-wrap">{msg.text}</pre>
                )}
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
