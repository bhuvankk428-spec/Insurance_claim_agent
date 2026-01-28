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

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function ClaimChecker() {
  const navigate = useNavigate();

  // Step 1: Policy PDF
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [policyResult, setPolicyResult] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const fileInput = useRef(null);

  // Step 2: FIR
  const [firFile, setFirFile] = useState(null);
  const [firName, setFirName] = useState("");
  const firInput = useRef(null);

  // Step 3: Photos
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoNames, setPhotoNames] = useState([]);
  const photoInput = useRef(null);

  // Shared evidence result
  const [evidenceResult, setEvidenceResult] = useState(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  async function handlePolicyUpload(e) {
    e.preventDefault();
    if (!file) return;

    setPolicyLoading(true);
    setPolicyResult(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch(`${API_BASE}/api/claim-check`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.valid) {
        setPolicyResult({ status: "success", message: data.message });
      } else {
        setPolicyResult({ status: "error", message: data.message });
      }
    } catch (err) {
      setPolicyResult({
        status: "error",
        message: "Could not verify policy. Please try again.",
      });
    } finally {
      setPolicyLoading(false);
    }
  }

  async function handleEvidenceUpload(e) {
    e.preventDefault();
    if (!firFile && !photoFiles.length) return;

    setEvidenceLoading(true);
    setEvidenceResult(null);

    try {
      const formData = new FormData();
      if (firFile) formData.append("fir", firFile);
      photoFiles.forEach((f) => formData.append("photos", f));

      const res = await fetch(`${API_BASE}/api/claim-evidence`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setEvidenceResult(data);

      if (data.status === "success") {
        navigate("/claim-story");
      }
    } catch (err) {
      setEvidenceResult({
        status: "error",
        message: "Could not process evidence. Please try again.",
      });
    } finally {
      setEvidenceLoading(false);
    }
  }

  const canSubmitEvidence = !!firFile || photoFiles.length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-[#050816] to-[#111827] px-4 py-8 sm:py-10 lg:py-12">
      <div className="max-w-6xl w-full">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-3 text-white font-black text-center leading-tight">
          Policy Claim Workflow
        </h1>
        <p className="text-sm sm:text-base text-neutral-300 mb-8 sm:mb-10 text-center max-w-2xl mx-auto leading-relaxed">
          Follow these three steps: verify your policy, attach FIR details, and
          upload clear photos to build a strong claim.
        </p>

        {/* Single form handles the final submit (evidence). Policy is checked via its own button */}
        <form
          onSubmit={handleEvidenceUpload}
          className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8"
          encType="multipart/form-data"
        >
          {/* Card 1 – Policy PDF (blue) */}
          <div className="bg-[#111827]/95 backdrop-blur-sm rounded-2xl border border-sky-700/50 p-5 sm:p-6 lg:p-8 flex flex-col items-center shadow-2xl hover:shadow-sky-500/25 transition-all">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-sky-900/50 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
              <span className="text-lg sm:text-xl font-bold text-sky-300">1</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-white mb-2 text-center">
              Policy PDF
            </h2>
            <p className="text-xs sm:text-sm text-sky-300 mb-4 text-center font-medium">
              Verify your policy
            </p>

            <div className="w-full flex flex-col items-center space-y-3 flex-1">
              <label
                htmlFor="claim-pdf"
                className="flex flex-col items-center w-full border-2 border-dashed border-sky-600/60 rounded-xl p-5 sm:p-6 cursor-pointer hover:border-sky-500 hover:bg-sky-900/20 transition-all group"
              >
                <FaFilePdf className="text-3xl sm:text-4xl text-sky-300 mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-white font-semibold text-xs sm:text-sm text-center mb-1">
                  {fileName || "Drop PDF or click"}
                </span>
                <span className="text-[10px] sm:text-xs text-sky-200 text-center">
                  Only .pdf files (max 10MB)
                </span>
                <input
                  id="claim-pdf"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  ref={fileInput}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      setFileName(f.name);
                      setPolicyResult(null);
                    }
                  }}
                />
              </label>

              {policyResult && (
                <div
                  className={`w-full px-3 py-2.5 rounded-lg text-center text-xs sm:text-sm font-medium ${
                    policyResult.status === "success"
                      ? "bg-emerald-800/90 border border-emerald-600/50 text-emerald-100"
                      : "bg-red-800/90 border border-red-600/50 text-red-100"
                  }`}
                >
                  {policyResult.status === "success" ? (
                    <>
                      <FaCheckCircle className="inline-block mr-1 w-4 h-4 text-emerald-300" />
                      {policyResult.message}
                    </>
                  ) : (
                    <>
                      <FaExclamationTriangle className="inline-block mr-1 w-4 h-4 text-red-300" />
                      {policyResult.message}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card 2 – FIR (green) */}
          <div className="bg-[#111827]/95 backdrop-blur-sm rounded-2xl border border-emerald-700/50 p-5 sm:p-6 lg:p-8 flex flex-col items-center shadow-2xl hover:shadow-emerald-500/25 transition-all">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
              <span className="text-lg sm:text-xl font-bold text-emerald-300">2</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-white mb-2 text-center">
              FIR / Complaint
            </h2>
            <p className="text-xs sm:text-sm text-emerald-300 mb-4 text-center font-medium">
              Official documents
            </p>

            <label
              htmlFor="fir-file"
              className="flex flex-col items-center w-full border-2 border-dashed border-emerald-600/60 rounded-xl p-5 sm:p-6 flex-1 cursor-pointer hover:border-emerald-500 hover:bg-emerald-900/20 transition-all group"
            >
              <FaFileAlt className="text-3xl sm:text-4xl text-emerald-300 mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-white font-semibold text-xs sm:text-sm text-center mb-1">
                {firName || "Drop FIR or click"}
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-200 text-center">
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

            <p className="text-[10px] sm:text-xs text-neutral-400 text-center mt-auto leading-tight max-w-[200px]">
              Match dates & details with your story
            </p>
          </div>

          {/* Card 3 – Photos (purple) */}
          <div className="bg-[#111827]/95 backdrop-blur-sm rounded-2xl border border-violet-700/50 p-5 sm:p-6 lg:p-8 flex flex-col items-center shadow-2xl hover:shadow-violet-500/25 transition-all">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-violet-900/50 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
              <span className="text-lg sm:text-xl font-bold text-violet-300">3</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-white mb-2 text-center">
              Incident Photos
            </h2>
            <p className="text-xs sm:text-sm text-violet-300 mb-4 text-center font-medium">
              Damage evidence
            </p>

            <label
              htmlFor="photo-files"
              className="flex flex-col items-center w-full border-2 border-dashed border-violet-600/60 rounded-xl p-5 sm:p-6 flex-1 cursor-pointer hover:border-violet-500 hover:bg-violet-900/20 transition-all group"
            >
              <FaImages className="text-3xl sm:text-4xl text-violet-300 mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-white font-semibold text-xs sm:text-sm text-center mb-1">
                {photoNames.length
                  ? `${photoNames.length} photo(s)`
                  : "Drop photos or click"}
              </span>
              <span className="text-[10px] sm:text-xs text-violet-200 text-center">
                JPG, PNG • Multiple OK
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
              <div className="w-full mt-2 max-h-16 overflow-y-auto bg-black/50 rounded-lg p-2">
                {photoNames.slice(0, 3).map((n, i) => (
                  <div key={n} className="text-[10px] truncate text-gray-300">
                    📷 {n}
                    {photoNames.length > 3 && i === 2 && (
                      <span className="ml-1">+{photoNames.length - 3}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] sm:text-xs text-neutral-400 text-center mt-auto leading-tight max-w-[200px]">
              Wide shots + close-ups of damage
            </p>
          </div>

          {/* Bottom row: Next button + evidence status */}
          <div className="col-span-full flex flex-col items-center mt-8 sm:mt-10 gap-4">
            <button
              type="submit"
              disabled={evidenceLoading || !canSubmitEvidence}
              className="w-full sm:w-auto px-8 sm:px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-base font-bold shadow-2xl hover:from-emerald-500 hover:to-emerald-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed max-w-md"
            >
              {evidenceLoading ? "Processing..." : "✅ Next: Explain Story"}
            </button>

            {evidenceResult && (
              <div
                className={`w-full max-w-md px-4 py-3 rounded-xl text-center text-sm font-medium ${
                  evidenceResult.status === "success"
                    ? "bg-emerald-800/90 border-2 border-emerald-600/50 text-emerald-100 shadow-emerald-500/25"
                    : "bg-red-800/90 border-2 border-red-600/50 text-red-100 shadow-red-500/25"
                }`}
              >
                {evidenceResult.status === "success" ? (
                  <>
                    <FaCheckCircle className="inline-block mr-2 w-5 h-5 text-emerald-300" />
                    {evidenceResult.message || "Evidence ready!"}
                  </>
                ) : (
                  <>
                    <FaExclamationTriangle className="inline-block mr-2 w-5 h-5 text-red-300" />
                    {evidenceResult.message || "Upload issue detected"}
                  </>
                )}
              </div>
            )}

            <p className="text-[11px] sm:text-xs text-neutral-400 text-center max-w-xl leading-relaxed">
              Complete all steps above, then describe your incident story
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
