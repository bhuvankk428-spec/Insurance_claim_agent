import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

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
      const response = await fetch("/api/gemini-chat", {
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
    // Fills the viewport and keeps bg always dark!
    <div className="min-h-screen w-screen bg-black flex">
      {/* Left - Fixed Search Panel */}
      <div className="w-[400px] h-screen sticky top-0 bg-gradient-to-b from-[#15181d] to-[#232834] px-10 py-8 flex flex-col border-r border-gray-700 z-10">
        <h2 className="text-3xl font-bold mb-12 mt-4 text-white">Search Configuration</h2>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-8">
          <div>
            <label className="text-gray-300 mb-1 block text-lg font-medium">
              Your Requested Policy
            </label>
            <input
              className="w-full rounded bg-[#232834] px-4 py-3 text-white text-lg ring-1 ring-gray-700 focus:ring-blue-500 outline-none"
              type="text"
              placeholder="eg. best car insurance"
              value={request}
              onChange={e => setRequest(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="text-gray-300 mb-1 block text-lg font-medium">Details (Optional)</label>
            <textarea
              className="rounded w-full bg-[#232834] px-4 py-3 text-white text-base resize-none ring-1 ring-gray-700 focus:ring-blue-500 outline-none"
              placeholder="Customize instructions"
              rows={5}
              value={details}
              onChange={e => setDetails(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`my-2 py-4 rounded-lg text-lg font-bold transition bg-gradient-to-r from-sky-500 to-indigo-600 text-white border-0 shadow-md hover:from-cyan-400 hover:to-indigo-700 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Searching..." : "Search"}
          </button>
          <span className="inline-block text-sm text-sky-200 bg-gray-800 px-3 py-1 rounded mt-auto">
            95 policies available (in our database)
          </span>
        </form>
      </div>

      {/* Right - Results */}
      <div className="flex-grow flex flex-col bg-[#121316] text-white min-h-screen">
        <h2 className="text-2xl font-bold px-12 pt-8 pb-4">Results</h2>
        <div className="flex-grow m-6 bg-[#181b21] rounded-lg shadow-inner px-8 py-6 overflow-y-auto border border-gray-800">
          {messages.length === 0 ? (
            <span className="text-gray-400 font-mono text-xl">Preparing and searching policies...</span>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-2xl my-6 px-6 py-4 rounded-lg shadow ${
                  msg.from === "user"
                    ? "bg-gradient-to-r from-indigo-600 to-sky-500 self-end text-white"
                    : "bg-[#232834] self-start border border-indigo-900"
                }`}
                style={{ alignSelf: msg.from === "user" ? "flex-end" : "flex-start" }}
              >
                {msg.from === "ai"
                  ? <ReactMarkdown>{msg.text}</ReactMarkdown>
                  : <span className="font-bold">{msg.text}</span>
                }
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
