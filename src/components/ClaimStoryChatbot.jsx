import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "./ui/Navbar";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");
const API_BASE = (
  import.meta.env.VITE_CLAIM_API_URL ||
  import.meta.env.VITE_API_URL ||
  (isLocalhost ? "http://localhost:5174" : "")
).replace(/\/$/, "");

export default function ClaimStoryChatbot() {
  const { claimId } = useParams(); 
  const navigate = useNavigate();

  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }

      if (transcript.trim()) {
        setStory((prev) => {
          const base = prev.trimEnd();
          if (!base) return transcript.trim();
          return `${base} ${transcript.trim()}`.trim();
        });
      }
    };

    recognition.onerror = () => {
      setVoiceError("Voice input failed. Please try again.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  function startListening() {
    setVoiceError("");
    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceError("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setVoiceError("Microphone is busy. Stop and try again.");
    }
  }

  function stopListening() {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.stop();
    setIsListening(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!story.trim()) return;

    if (!claimId) {
      navigate(`/claim-result/unknown`, {
        state: {
          status: "rejected",
          message: "Claim session expired. Please restart the claim process.",
        },
      });
      return;
    }
    if (!API_BASE) {
      navigate(`/claim-result/${claimId}`, {
        state: {
          status: "rejected",
          message:
            "Missing claim API URL. Set VITE_CLAIM_API_URL or VITE_API_URL in Vercel.",
        },
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/claim-story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId, 
          story,
        }),
      });

      const data = await res.json();

      if (data.eligible) {
        navigate(`/claim-result/${data.claimCode}`, {
          state: {
            level: data.level,
            riskLevel: data.riskLevel,
            explanation: data.explanation,
            reasons: data.reasons,
          },
        });
      } else {
        navigate(`/claim-result/${claimId}`, {
          state: {
            status: "rejected",
            message:
              data.reason ||
              data.message ||
              "Your claim could not be approved.",
          },
        });
      }

    } catch (err) {
      navigate(`/claim-result/${claimId || "unknown"}`, {
        state: {
          status: "rejected",
          message:
            "Something went wrong while analyzing your story. Please try again.",
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-3xl">
          {/* Heading */}
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 mb-4">
              Claim Assistant
            </p>
            <h1 className="text-3xl font-black mb-4">
              Tell your claim story
            </h1>
            <p className="text-neutral-300">
              Describe what happened. QK.AI will verify it against your policy
              and evidence.
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#111827]/90 border border-neutral-800/80 rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mb-6">
              <label className="font-semibold text-neutral-200">
                Your story
              </label>

              <textarea
                className="w-full border-2 border-neutral-700 bg-black/40 rounded-2xl p-4 resize-none focus:outline-none focus:border-cyan-500 min-h-[160px]"
                placeholder="Describe the incident in detail..."
                value={story}
                onChange={(e) => setStory(e.target.value)}
                disabled={loading}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={loading}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    isListening
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-cyan-700 hover:bg-cyan-600 text-white"
                  } disabled:opacity-50`}
                >
                  {isListening ? "Stop Voice Input" : "Start Voice Input"}
                </button>
                <span className="text-xs text-neutral-400">
                  {isListening ? "Listening..." : "Tap and speak to fill story"}
                </span>
              </div>

              {voiceError && (
                <p className="text-xs text-red-300 -mt-2">{voiceError}</p>
              )}

              <button
                type="submit"
                disabled={loading || !story.trim()}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 font-bold disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Analyze My Claim"}
              </button>
            </form>

            {/* Response */}
            {/* Rejections now shown on Claim Result page */}
          </div>

          {/* Disclaimer */}
          <p className="mt-6 text-xs text-neutral-500 text-center">
            QK.AI provides guidance only. Always verify with your insurer.
          </p>
        </div>
      </main>
    </div>
  );
}
