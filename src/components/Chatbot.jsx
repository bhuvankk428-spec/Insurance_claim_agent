import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function PolicySummarizer() {
  const [request, setRequest] = useState("");
  const [details, setDetails] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!request.trim()) return;

    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { from: "user", text: details ? request + "\n" + details : request }
    ]);

    try {
      const response = await fetch(`${API_BASE}/api/gemini-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: details ? `${request}\nDetails: ${details}` : request,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: data.text || "No response." },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "Error contacting API." },
      ]);
    }
    setLoading(false);
    setRequest("");
    setDetails("");
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      {/* Left - Search Panel (Full width mobile, sidebar desktop) */}
      <div className="lg:w-[420px] lg:h-screen lg:sticky lg:top-0 lg:bg-gradient-to-b lg:from-[#15181d] lg:to-[#232834] px-4 sm:px-6 lg:px-10 py-8 lg:py-12 flex flex-col border-b lg:border-r lg:border-gray-700">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 lg:mb-12 text-white">Search Configuration</h2>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-6 lg:gap-8">
          <div>
            <label className="text-gray-300 mb-2 block text-base sm:text-lg font-medium">
              Your Requested Policy
            </label>
            <input
              className="w-full rounded-lg bg-[#232834] px-4 py-3 text-white text-base sm:text-lg ring-1 ring-gray-700 focus:ring-sky-500 outline-none transition-all"
              type="text"
              placeholder="eg. best car insurance"
              value={request}
              onChange={e => setRequest(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label className="text-gray-300 mb-2 block text-base sm:text-lg font-medium">
              Details (Optional)
            </label>
            <textarea
              className="rounded-lg w-full bg-[#232834] px-4 py-3 text-white text-sm sm:text-base resize-none ring-1 ring-gray-700 focus:ring-sky-500 outline-none transition-all"
              placeholder="Customize instructions (age, location, coverage needs...)"
              rows={4}
              value={details}
              onChange={e => setDetails(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold transition-all bg-gradient-to-r from-sky-500 to-indigo-600 text-white border-0 shadow-lg hover:from-sky-400 hover:to-indigo-500 active:scale-95 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading ? "Searching..." : "Search Policies"}
          </button>
          
          <span className="inline-block text-xs sm:text-sm text-sky-200 bg-gray-800/50 px-3 py-1.5 rounded-full mt-auto text-center">
            95+ policies available
          </span>
        </form>
      </div>

      {/* Right - Results (Full width mobile, flex-grow desktop) */}
      <div className="flex-grow flex flex-col bg-[#121316] min-h-screen lg:min-h-0">
        <h2 className="text-xl sm:text-2xl font-bold px-4 sm:px-8 lg:px-12 pt-6 sm:pt-8 pb-4 lg:pb-6">
          Policy Results
        </h2>
        <div className="flex-grow m-4 sm:m-6 lg:m-8 bg-[#181b21] rounded-xl lg:rounded-lg shadow-inner px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overflow-y-auto border border-gray-800 max-w-4xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-gray-400 font-mono text-lg sm:text-xl mb-4">
                Ready to find your perfect policy
              </span>
              <p className="text-gray-500 text-sm max-w-md">
                Enter your insurance needs above and get personalized recommendations instantly.
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[90vw] sm:max-w-2xl lg:max-w-3xl mx-auto p-4 sm:p-6 rounded-xl shadow-lg flex ${
                    msg.from === "user"
                      ? "bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-600 ml-auto text-white"
                      : "bg-[#232834] border border-indigo-900/50 mr-auto"
                  }`}
                >
                  {msg.from === "ai" ? (
                    <ReactMarkdown className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed">
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    <span className="font-semibold text-sm sm:text-base whitespace-pre-wrap">{msg.text}</span>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
