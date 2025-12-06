import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUpload,
  FaFilePdf,
  FaCheckCircle,
  FaExclamationTriangle,
  FaImages,
  FaFileAlt,
} from "react-icons/fa";

export default function ClaimChecker() {
  const navigate = useNavigate();

  // Step 1: Policy PDF
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nextEnabled, setNextEnabled] = useState(false);
  const fileInput = useRef();

  // Step 2: FIR
  const [firFile, setFirFile] = useState(null);
  const [firName, setFirName] = useState("");
  const firInput = useRef();

  // Step 3: Photos
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoNames, setPhotoNames] = useState([]);
  const photoInput = useRef();

  // Shared evidence result
  const [evidenceResult, setEvidenceResult] = useState(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  async function handlePolicyUpload(e) {
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

  async function handleEvidenceUpload(e) {
    e.preventDefault();
    if (!firFile && !photoFiles.length) return;

    setEvidenceLoading(true);
    setEvidenceResult(null);

    const formData = new FormData();
    if (firFile) formData.append("fir", firFile);
    photoFiles.forEach((f) => formData.append("photos", f));

    const res = await fetch("/api/claim-evidence", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setEvidenceLoading(false);
    setEvidenceResult(data);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-[#050816] to-[#111827] px-4 py-10">
      <h1 className="text-3xl sm:text-4xl mb-3 text-white font-bold text-center">
        Policy Claim Workflow
      </h1>
      <p className="text-sm text-neutral-300 mb-10 text-center max-w-2xl">
        Follow these three steps: verify your policy, attach FIR details, and
        upload clear photos to build a strong claim.
      </p>

      <form
        onSubmit={handleEvidenceUpload}
        className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6"
        encType="multipart/form-data"
      >
        {/* Card 1 – Policy PDF (blue) */}
        <div className="bg-[#111827]/90 rounded-2xl border border-sky-700/60 p-6 flex flex-col items-center shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-1 text-center">
            Step 1
          </h2>
          <p className="text-xs text-sky-300 mb-4 text-center font-semibold">
            Upload Policy PDF
          </p>

          <form
            onSubmit={handlePolicyUpload}
            className="w-full flex flex-col items-center"
          >
            <label
              htmlFor="claim-pdf"
              className="flex flex-col items-center w-full border-2 border-dashed border-sky-700 rounded-xl p-6 mb-4 cursor-pointer hover:bg-sky-900/30 transition"
            >
              <FaFilePdf className="text-4xl text-sky-300 mb-2" />
              <span className="text-white font-semibold mb-1 text-center text-sm">
                {fileName || "Drop PDF or click to select"}
              </span>
              <span className="text-[11px] text-sky-200">
                Only .pdf files are supported
              </span>
              <input
                id="claim-pdf"
                type="file"
                accept="application/pdf"
                className="hidden"
                ref={fileInput}
                onChange={(e) => {
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
              className="w-full bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-full px-4 py-2 text-sm font-semibold tracking-wide shadow hover:from-sky-500 hover:to-blue-700 transition disabled:opacity-50"
              disabled={!file || loading}
            >
              {loading ? "Checking..." : (
                <>
                  <FaUpload className="inline-block mr-2" />
                  Check Claim
                </>
              )}
            </button>

            {result && (
              <div
                className={`mt-4 w-full px-3 py-2 rounded-lg text-center text-xs ${
                  result.status === "success"
                    ? "bg-emerald-800/80 text-emerald-200"
                    : "bg-red-800/80 text-red-200"
                }`}
              >
                {result.status === "success" ? (
                  <>
                    <FaCheckCircle className="inline-block mb-1 mr-1 text-emerald-300" />
                    Valid claim: {result.message}
                  </>
                ) : (
                  <>
                    <FaExclamationTriangle className="inline-block mb-1 mr-1 text-yellow-200" />
                    Not valid: {result.message}
                  </>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Card 2 – FIR (green) */}
        <div className="bg-[#111827]/90 rounded-2xl border border-emerald-700/60 p-6 flex flex-col items-center shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-1 text-center">
            Step 2
          </h2>
          <p className="text-xs text-emerald-300 mb-4 text-center font-semibold">
            Add FIR / Complaint
          </p>

          <label
            htmlFor="fir-file"
            className="flex flex-col items-center w-full border-2 border-dashed border-emerald-700 rounded-xl p-6 mb-4 cursor-pointer hover:bg-emerald-900/30 transition"
          >
            <FaFileAlt className="text-4xl text-emerald-300 mb-2" />
            <span className="text-white font-semibold mb-1 text-center text-sm">
              {firName || "Drop FIR or click to select"}
            </span>
            <span className="text-[11px] text-emerald-100 text-center">
              PDF, JPG, PNG
            </span>
            <input
              id="fir-file"
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              ref={firInput}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFirFile(f);
                  setFirName(f.name);
                  setEvidenceResult(null);
                }
              }}
            />
          </label>

          <p className="text-[11px] text-neutral-300 text-center">
            Ensure the FIR details match the date, time, and description in your story.
          </p>
        </div>

        {/* Card 3 – Photos (purple) */}
        <div className="bg-[#111827]/90 rounded-2xl border border-violet-700/60 p-6 flex flex-col items-center shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-1 text-center">
            Step 3
          </h2>
          <p className="text-xs text-violet-300 mb-4 text-center font-semibold">
            Upload Incident Photos
          </p>

          <label
            htmlFor="photo-files"
            className="flex flex-col items-center w-full border-2 border-dashed border-violet-700 rounded-xl p-6 mb-4 cursor-pointer hover:bg-violet-900/30 transition"
          >
            <FaImages className="text-4xl text-violet-300 mb-2" />
            <span className="text-white font-semibold mb-1 text-center text-sm">
              {photoNames.length
                ? `${photoNames.length} photo(s) selected`
                : "Drop photos or click to select"}
            </span>
            <span className="text-[11px] text-violet-100 text-center">
              JPG, PNG • Multiple files allowed
            </span>
            <input
              id="photo-files"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={photoInput}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setPhotoFiles(files);
                setPhotoNames(files.map((f) => f.name));
                setEvidenceResult(null);
              }}
            />
          </label>

          {photoNames.length > 0 && (
            <ul className="mt-1 max-h-20 w-full overflow-y-auto text-[11px] text-gray-300 list-disc list-inside">
              {photoNames.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}

          <p className="mt-2 text-[11px] text-neutral-300 text-center">
            Capture wide shots, close‑ups of damage, and number plates if relevant.
          </p>
        </div>

        {/* Bottom row: dark Next button + evidence status */}
        <div className="md:col-span-3 flex flex-col items-center mt-2">
          <button
            type="submit"
            disabled={evidenceLoading || (!firFile && !photoFiles.length)}
            className="px-10 py-3 rounded-full bg-[#020617] text-white text-sm font-semibold shadow-lg border border-neutral-700 hover:bg-[#02081f] transition disabled:opacity-40"
          >
            {evidenceLoading ? "Processing evidence..." : "Next: Explain Story"}
          </button>

          {evidenceResult && (
            <div
              className={`mt-4 w-full max-w-xl px-3 py-3 rounded-lg text-center text-xs ${
                evidenceResult.status === "success"
                  ? "bg-emerald-800/80 text-emerald-200"
                  : "bg-red-800/80 text-red-200"
              }`}
            >
              {evidenceResult.status === "success" ? (
                <>
                  <FaCheckCircle className="inline-block mb-1 mr-1 text-emerald-300" />
                  {evidenceResult.message || "Evidence uploaded successfully."}
                </>
              ) : (
                <>
                  <FaExclamationTriangle className="inline-block mb-1 mr-1 text-yellow-200" />
                  {evidenceResult.message ||
                    "There was a problem with the evidence upload."}
                </>
              )}
            </div>
          )}

          <p className="mt-3 text-[11px] text-neutral-400 text-center max-w-2xl">
            Once all three steps are complete, continue to the story screen to
            describe what happened in your own words.
          </p>
        </div>
      </form>
    </div>
  );
}
