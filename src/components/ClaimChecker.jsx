import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaUpload, FaFilePdf, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function ClaimChecker() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nextEnabled, setNextEnabled] = useState(false);
  const fileInput = useRef();
  const navigate = useNavigate();

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);
    setNextEnabled(false);

    const formData = new FormData();
    formData.append("pdf", file);

    const res = await fetch("/api/claim-check", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (data.valid) {
      setResult({ status: "success", ...data });
      setNextEnabled(true);
    } else {
      setResult({ status: "error", ...data });
      setNextEnabled(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-[#141e30] to-[#232834] px-4">
      <h1 className="text-4xl mb-10 text-white font-bold text-center">Policy Claim Checker</h1>
      <form
        onSubmit={handleUpload}
        className="w-[420px] bg-[#181e27]/90 rounded-2xl shadow-xl p-10 flex flex-col items-center border border-gray-800"
        encType="multipart/form-data"
      >
        <label
          htmlFor="claim-pdf"
          className={`flex flex-col items-center border-2 border-dashed border-gray-600 rounded-xl p-7 mb-6 cursor-pointer hover:bg-[#1b2536]/50 transition`}
        >
          <FaFilePdf className="text-5xl text-red-400 mb-2" />
          <span className="text-white font-semibold mb-1">
            {fileName || "Drop PDF here or click to select"}
          </span>
          <input
            id="claim-pdf"
            name="claim-pdf"
            accept="application/pdf"
            type="file"
            className="hidden"
            ref={fileInput}
            onChange={e => {
              if (e.target.files[0]) {
                setFile(e.target.files[0]);
                setFileName(e.target.files[0].name);
                setResult(null);
                setNextEnabled(false);
              }
            }}
          />
        </label>
        <button
          type="submit"
          className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-full px-8 py-3 font-semibold tracking-wide shadow hover:from-violet-500 hover:to-indigo-700 transition"
          disabled={!file || loading}
        >
          {loading ? "Checking..." : (
            <>
              <FaUpload className="inline-block mr-2" /> Check Claim
            </>
          )}
        </button>
        {result && (
          <div className={`mt-8 w-full px-2 py-3 rounded-lg text-center ${result.status === "success" ? "bg-green-800/80 text-green-200" : "bg-red-800/80 text-red-200"}`}>
            {result.status === "success" ? (
              <>
                <FaCheckCircle className="inline-block mb-1 mr-2 text-green-300 text-lg" />
                Claim is valid! {result.message}
              </>
            ) : (
              <>
                <FaExclamationTriangle className="inline-block mb-1 mr-2 text-yellow-200 text-lg" />
                Not a valid claim: {result.message}
              </>
            )}
          </div>
        )}
        <button
          className="mt-6 mb-2 px-10 py-3 rounded-full bg-sky-600 font-bold text-white shadow disabled:opacity-40"
          disabled={!nextEnabled}
          onClick={() => {
            if (nextEnabled) {
              navigate("/claim-story");
            }
          }}
          type="button"
        >
          Next
        </button>
      </form>
    </div>
  );
}
