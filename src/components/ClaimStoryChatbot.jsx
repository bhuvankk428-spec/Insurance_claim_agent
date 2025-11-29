import { useState } from "react";

export default function ClaimStoryChatbot() {
  const [story, setStory] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claimCode, setClaimCode] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!story) return;
    setLoading(true);
    setResponse(null);

    const res = await fetch("/api/claim-story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story }),
    });

    const data = await res.json();
    setLoading(false);

    setResponse(data.answer);
    if (data.eligible) setClaimCode(data.claimCode);
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Explain Your Claim</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
        <textarea
          className="border rounded p-2 resize-none"
          rows={6}
          placeholder="Describe what happened and why you want to claim..."
          value={story}
          onChange={(e) => setStory(e.target.value)}
        />
        <button disabled={loading} className="bg-blue-600 text-white p-2 rounded">
          {loading ? "Analyzing..." : "Submit"}
        </button>
      </form>

      {response && (
        <div className="bg-gray-100 p-4 rounded">
          <p>{response}</p>
          {claimCode && (
            <p className="mt-3 font-mono bg-green-200 p-2">
              Your claim code: <b>{claimCode}</b>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
