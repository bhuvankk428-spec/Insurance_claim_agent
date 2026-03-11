import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  FaFilePdf,
  FaCheckCircle,
  FaExclamationTriangle,
  FaImages,
  FaFileAlt,
} from "react-icons/fa";
import Navbar from "./ui/Navbar";
import { saveClaimContext } from "../utils/claimContext";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");
const API_BASE = isLocalhost
  ? "http://localhost:5174"
  : import.meta.env.VITE_CLAIM_API_URL ||
    import.meta.env.VITE_API_URL ||
    "";

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
  const policyVerified = policyResult?.status === "success";

  /* ---------------- DOMAIN ---------------- */
  const [claimType, setClaimType] = useState("automobile");

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
    const endpoint = API_BASE ? `${API_BASE}/api/claim-check` : "/api/claim-check";
    const formData = new FormData();
    formData.append("pdf", file); 
    const email = auth.currentUser?.email;
    if (email) formData.append("email", email);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.valid) {
        setClaimId(data.claimId);
        if (data.claimContext) {
          saveClaimContext(data.claimId, data.claimContext);
        }
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
    }
  }


  /* ---------------- EVIDENCE SUBMIT ---------------- */
  async function handleEvidenceUpload(e) {
    e.preventDefault();
    const endpoint = API_BASE
      ? `${API_BASE}/api/claim-evidence`
      : "/api/claim-evidence";

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
      formData.append("claimId", claimId); 
      formData.append("claimType", claimType);
      formData.append("fir", firFile);
      photoFiles.forEach((f) => formData.append("photos", f));


      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setEvidenceResult(data);

      if (data.status === "success") {
        if (data.claimContext) {
          saveClaimContext(claimId, data.claimContext);
        }
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0f14] px-4 pt-24 pb-12 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-cyan-500/12 blur-[140px]" />
          <div className="absolute top-16 -right-24 h-80 w-80 rounded-full bg-amber-400/12 blur-[130px]" />
          <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-[150px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] [background-size:28px_28px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f14] via-[#0b0f14]/90 to-[#0b0f14]" />
        </div>
        <div className="max-w-6xl w-full relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs sm:text-sm text-cyan-200 mb-4">
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
            className="flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white">Steps</h2>
              <span className="text-xs text-neutral-400">
                Upload each item to continue
              </span>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {/* DOMAIN */}
              <div className="group bg-gradient-to-br from-[#111827]/95 to-[#0f172a]/95 rounded-2xl border border-sky-700/35 p-6 flex flex-col shadow-xl transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(14,165,233,0.18)] hover:border-sky-400/70 hover:bg-[#0f172a]">
              <div className="w-full flex items-center justify-between mb-5">
                <h2 className="text-white font-semibold">Claim Domain</h2>
                <span className="text-xs text-sky-200/80 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-full">
                  Step 0
                </span>
              </div>
              <label className="w-full text-sm text-neutral-300 mb-2">
                Select claim type
              </label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(e.target.value)}
                className="w-full rounded-xl border border-sky-600/50 bg-[#0f1522] text-white px-4 py-3 focus:outline-none focus:border-sky-400"
              >
                <option value="automobile">Automobile</option>
                <option value="bike">Bike</option>
                <option value="crop">Crop Failure</option>
                <option value="business_property">Business Property Damage</option>
                <option value="property">Property Damage</option>
                <option value="cyber">Cyber Attack</option>
                <option value="health">Health / Medical</option>
              </select>
              <p className="mt-3 text-xs text-neutral-400">
                This helps apply the correct verification rules.
              </p>
              </div>
              {/* POLICY */}
              <div className="group bg-gradient-to-br from-[#111827]/95 to-[#0f172a]/95 rounded-2xl border border-cyan-700/35 p-6 flex flex-col shadow-xl transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(34,211,238,0.18)] hover:border-cyan-400/70 hover:bg-[#0f172a]">
              <div className="w-full flex items-center justify-between mb-5">
                <h2 className="text-white font-semibold">Policy PDF</h2>
                <span className="text-xs text-cyan-200/80 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-full">
                  Step 1
                </span>
              </div>

              <label className="border-2 border-dashed border-cyan-600/60 rounded-2xl p-6 w-full cursor-pointer text-center bg-[#0f1522]/70 hover:bg-[#111a29] transition-colors">
                <FaFilePdf className="mx-auto text-4xl text-cyan-300 mb-3" />
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
                    verifyPolicy(file); 
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
              <div className="group bg-gradient-to-br from-[#121826]/95 to-[#0f172a]/95 rounded-2xl border border-emerald-700/40 p-6 flex flex-col shadow-xl transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(16,185,129,0.18)] hover:border-emerald-400/70 hover:bg-[#0f172a]">
              <div className="w-full flex items-center justify-between mb-5">
                <h2 className="text-white font-semibold">FIR / Complaint</h2>
                <span className="text-xs text-emerald-200/80 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  Step 2
                </span>
              </div>

              <label className="border-2 border-dashed border-emerald-600/70 rounded-2xl p-6 w-full cursor-pointer text-center bg-[#0f1522]/70 hover:bg-[#111a29] transition-colors">
                <FaFileAlt className="mx-auto text-4xl text-emerald-300 mb-3" />
                <span className="text-white text-sm sm:text-base">
                  {firName || "Drop FIR/Property PDF or click"}
                </span>
                <div className="mt-2 text-xs text-neutral-400">
                  PDF only
                </div>
                <input
                  ref={firInput}
                  type="file"
                  accept="application/pdf"
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
              <div className="group lg:col-start-2 bg-gradient-to-br from-[#121826]/95 to-[#0f172a]/95 rounded-2xl border border-amber-700/40 p-6 flex flex-col shadow-xl transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(251,191,36,0.18)] hover:border-amber-400/70 hover:bg-[#0f172a]">
              <div className="w-full flex items-center justify-between mb-5">
                <h2 className="text-white font-semibold">Incident Photos</h2>
                <span className="text-xs text-amber-200/80 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                  Step 3
                </span>
              </div>

              <label className="border-2 border-dashed border-amber-600/70 rounded-2xl p-6 w-full cursor-pointer text-center bg-[#0f1522]/70 hover:bg-[#111a29] transition-colors">
                <FaImages className="mx-auto text-4xl text-amber-300 mb-3" />
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
            </div>

            {/* SUBMIT */}
            <div className="flex flex-col items-center mt-2">
              <button
                type="submit"
                disabled={evidenceLoading || !canSubmitEvidence}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-600 text-white font-bold shadow-xl hover:from-emerald-500 hover:to-cyan-500 transition-all disabled:opacity-40"
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
