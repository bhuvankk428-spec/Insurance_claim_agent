import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFilePdf,
  FaCheckCircle,
  FaExclamationTriangle,
  FaImages,
  FaFileAlt,
} from "react-icons/fa";
import Navbar from "./ui/Navbar";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function ClaimChecker() {
  const navigate = useNavigate();

  /* ---------------- REFS ---------------- */
  const fileInput = useRef(null);
  const firInput = useRef(null);
  const photoInput = useRef(null);

  /* ---------------- POLICY ---------------- */
  const [claimId, setClaimId] = useState(null);

  const [fileName, setFileName] = useState("");
  const [policyResult, setPolicyResult] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const policyVerified = policyResult?.status === "success";

  /* ---------------- FIR ---------------- */
  const [firFile, setFirFile] = useState(null);
  const [firName, setFirName] = useState("");

  /* ---------------- PHOTOS ---------------- */
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoNames, setPhotoNames] = useState([]);

  /* ---------------- EVIDENCE ---------------- */
  const [evidenceResult, setEvidenceResult] = useState(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  /* ---------------- POLICY VERIFY ---------------- */
  async function verifyPolicy(file) {
    const formData = new FormData();
    formData.append("pdf", file); // ? ONLY PDF

    try {
      setPolicyLoading(true);

      const res = await fetch(`${API_BASE}/api/claim-check`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.valid) {
        setClaimId(data.claimId); // ? STORE claimId
      }

      setPolicyResult({
        status: data.valid ? "success" : "error",
        message: data.message,
      });
    } catch {
      setPolicyResult({
        status: "error",
        message: "Policy verification failed",
      });
    } finally {
      setPolicyLoading(false);
    }
  }


  /* ---------------- EVIDENCE SUBMIT ---------------- */
  async function handleEvidenceUpload(e) {
    e.preventDefault();

    if (!policyVerified) {
      setEvidenceResult({
        status: "error",
        message: "Please verify policy first",
      });
      return;
    }

    if (!firFile || photoFiles.length === 0) return;

    setEvidenceLoading(true);
    setEvidenceResult(null);

    try {
      const formData = new FormData();
      formData.append("claimId", claimId); // ? REQUIRED
      formData.append("claimType", "bike");
      formData.append("fir", firFile);
      photoFiles.forEach((f) => formData.append("photos", f));


      const res = await fetch(`${API_BASE}/api/claim-evidence`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setEvidenceResult(data);

      if (data.status === "success") {
        navigate(`/claim-story/${claimId}`);
      }
    } catch {
      setEvidenceResult({
        status: "error",
        message: "Could not process evidence. Please try again.",
      });
    } finally {
      setEvidenceLoading(false);
    }
  }

  const canSubmitEvidence =
    policyVerified && firFile && photoFiles.length > 0;

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4 pt-24 pb-12 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-sky-600/15 blur-[120px]" />
          <div className="absolute top-20 -right-24 h-80 w-80 rounded-full bg-violet-600/20 blur-[110px]" />
          <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-[140px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:26px_26px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
        </div>
        <div className="max-w-6xl w-full relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs sm:text-sm text-sky-200 mb-4">
              Secure claim workflow
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Policy Claim Workflow
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 max-w-2xl mx-auto leading-relaxed">
              Verify your policy, upload evidence, then proceed to the claim story.
            </p>
          </div>

          <form
            onSubmit={handleEvidenceUpload}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* POLICY */}
            <div className="bg-[#121826]/90 rounded-2xl border border-sky-700/40 p-6 flex flex-col items-center shadow-xl hover:shadow-2xl transition-all">
              <div className="w-full flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Policy PDF</h2>
                <span className="text-xs text-sky-200/80 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-full">
                  Step 1
                </span>
              </div>

              <label className="border-2 border-dashed border-sky-600/70 rounded-2xl p-6 w-full cursor-pointer text-center bg-[#0f1422]/70 hover:bg-[#101827] transition-colors">
                <FaFilePdf className="mx-auto text-4xl text-sky-300 mb-3" />
                <span className="text-white text-sm sm:text-base">
                  {fileName || "Drop PDF or click"}
                </span>
                <div className="mt-2 text-xs text-neutral-400">
                  Accepted: PDF only
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setFileName(file.name);
                    setPolicyResult(null);
                    verifyPolicy(file); // ? IMPORTANT
                  }}
                />
              </label>

              {policyResult && (
                <div
                  className={`mt-4 text-sm px-3 py-2 rounded-xl border ${policyResult.status === "success"
                      ? "bg-emerald-900/40 text-emerald-100 border-emerald-600/40"
                      : "bg-red-900/40 text-red-100 border-red-600/40"
                    }`}
                >
                  {policyResult.status === "success" ? (
                    <FaCheckCircle className="inline mr-1" />
                  ) : (
                    <FaExclamationTriangle className="inline mr-1" />
                  )}
                  {policyResult.message}
                </div>
              )}
            </div>

            {/* FIR */}
            <div className="bg-[#121826]/90 rounded-2xl border border-emerald-700/40 p-6 flex flex-col items-center shadow-xl hover:shadow-2xl transition-all">
              <div className="w-full flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">FIR / Complaint</h2>
                <span className="text-xs text-emerald-200/80 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  Step 2
                </span>
              </div>

              <label className="border-2 border-dashed border-emerald-600/70 rounded-2xl p-6 w-full cursor-pointer text-center bg-[#0f1422]/70 hover:bg-[#101827] transition-colors">
                <FaFileAlt className="mx-auto text-4xl text-emerald-300 mb-3" />
                <span className="text-white text-sm sm:text-base">
                  {firName || "Drop FIR or click"}
                </span>
                <div className="mt-2 text-xs text-neutral-400">
                  PDF or image
                </div>
                <input
                  ref={firInput}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
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
            </div>

            {/* PHOTOS */}
            <div className="bg-[#121826]/90 rounded-2xl border border-violet-700/40 p-6 flex flex-col items-center shadow-xl hover:shadow-2xl transition-all">
              <div className="w-full flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Incident Photos</h2>
                <span className="text-xs text-violet-200/80 bg-violet-500/10 border border-violet-500/30 px-2.5 py-1 rounded-full">
                  Step 3
                </span>
              </div>

              <label className="border-2 border-dashed border-violet-600/70 rounded-2xl p-6 w-full cursor-pointer text-center bg-[#0f1422]/70 hover:bg-[#101827] transition-colors">
                <FaImages className="mx-auto text-4xl text-violet-300 mb-3" />
                <span className="text-white text-sm sm:text-base">
                  {photoNames.length
                    ? `${photoNames.length} photo(s)`
                    : "Drop photos or click"}
                </span>
                <div className="mt-2 text-xs text-neutral-400">
                  JPG or PNG
                </div>
                <input
                  ref={photoInput}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setPhotoFiles(files);
                    setPhotoNames(files.map((f) => f.name));
                    setEvidenceResult(null);
                  }}
                />
              </label>
            </div>

            {/* SUBMIT */}
            <div className="col-span-full flex flex-col items-center mt-6">
              <button
                type="submit"
                disabled={evidenceLoading || !canSubmitEvidence}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-sky-600 text-white font-bold shadow-xl hover:from-emerald-500 hover:to-sky-500 transition-all disabled:opacity-40"
              >
                {evidenceLoading
                  ? "Processing..."
                  : "Next: Explain Story"}
              </button>

              {evidenceResult && (
                <div
                  className={`mt-4 px-4 py-3 rounded-xl text-sm border ${evidenceResult.status === "success"
                      ? "bg-emerald-900/40 text-emerald-100 border-emerald-600/40"
                      : "bg-red-900/40 text-red-100 border-red-600/40"
                    }`}
                >
                  {evidenceResult.message}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
