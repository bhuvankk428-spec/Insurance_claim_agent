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
    formData.append("pdf", file); // ✅ ONLY PDF

    try {
      setPolicyLoading(true);

      const res = await fetch(`${API_BASE}/api/claim-check`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.valid) {
        setClaimId(data.claimId); // ✅ STORE claimId
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
      formData.append("claimId", claimId); // ✅ REQUIRED
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-[#050816] to-[#111827] px-4 pt-24 pb-12">
        <div className="max-w-6xl w-full">
          <h1 className="text-3xl font-black text-white text-center mb-3">
            Policy Claim Workflow
          </h1>

          <form
            onSubmit={handleEvidenceUpload}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* POLICY */}
            <div className="bg-[#111827]/95 rounded-2xl border border-sky-700/50 p-6 flex flex-col items-center">
              <h2 className="text-white font-semibold mb-3">Policy PDF</h2>

              <label className="border-2 border-dashed border-sky-600 rounded-xl p-6 w-full cursor-pointer text-center">
                <FaFilePdf className="mx-auto text-4xl text-sky-300 mb-2" />
                <span className="text-white text-sm">
                  {fileName || "Drop PDF or click"}
                </span>
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
                    verifyPolicy(file); // ✅ IMPORTANT
                  }}
                />
              </label>

              {policyResult && (
                <div
                  className={`mt-3 text-sm px-3 py-2 rounded-lg ${policyResult.status === "success"
                      ? "bg-emerald-800 text-emerald-100"
                      : "bg-red-800 text-red-100"
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
            <div className="bg-[#111827]/95 rounded-2xl border border-emerald-700/50 p-6 flex flex-col items-center">
              <h2 className="text-white font-semibold mb-3">FIR / Complaint</h2>

              <label className="border-2 border-dashed border-emerald-600 rounded-xl p-6 w-full cursor-pointer text-center">
                <FaFileAlt className="mx-auto text-4xl text-emerald-300 mb-2" />
                <span className="text-white text-sm">
                  {firName || "Drop FIR or click"}
                </span>
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
            <div className="bg-[#111827]/95 rounded-2xl border border-violet-700/50 p-6 flex flex-col items-center">
              <h2 className="text-white font-semibold mb-3">
                Incident Photos
              </h2>

              <label className="border-2 border-dashed border-violet-600 rounded-xl p-6 w-full cursor-pointer text-center">
                <FaImages className="mx-auto text-4xl text-violet-300 mb-2" />
                <span className="text-white text-sm">
                  {photoNames.length
                    ? `${photoNames.length} photo(s)`
                    : "Drop photos or click"}
                </span>
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
                className="px-10 py-4 rounded-2xl bg-emerald-600 text-white font-bold disabled:opacity-40"
              >
                {evidenceLoading
                  ? "Processing..."
                  : "Next: Explain Story"}
              </button>

              {evidenceResult && (
                <div
                  className={`mt-4 px-4 py-3 rounded-xl text-sm ${evidenceResult.status === "success"
                      ? "bg-emerald-800 text-emerald-100"
                      : "bg-red-800 text-red-100"
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
