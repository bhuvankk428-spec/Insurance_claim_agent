import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./ui/Navbar.jsx";

const STORAGE_KEY = "planFormData";

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

const emptyForm = {
  name: "",
  age: "",
  salary: "",
  loanEmi: "",
  totalLoan: "",
  expenses: "",
  insuranceMonthly: "",
  investMonthly: "",
  hasFamilyIncome: "no",
  familyIncome: "",
  familySavings: "",
  hasHealthInsurance: "no",
  hasFamilyInsurance: "no",
  familyMembers: "",
  goldPct: 0,
  realEstatePct: 0,
};

export default function PlanPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm((prev) => ({ ...prev, ...parsed }));
      } catch {
        
      }
    }
  }, []);

  const showFamilyFields = form.hasFamilyIncome === "yes";
  const showHealthSuggestion = form.hasHealthInsurance === "no";
  const showFamilyInsuranceSuggestion =
    form.hasFamilyIncome === "yes" && form.hasFamilyInsurance === "no";
  const investableMonthly = Math.max(
    0,
    toNumber(form.salary) +
      (showFamilyFields ? toNumber(form.familySavings) : 0) -
      toNumber(form.expenses) -
      toNumber(form.insuranceMonthly) -
      toNumber(form.loanEmi)
  );

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = { ...form, investMonthly: String(investableMonthly) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    navigate("/plan-dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex flex-col relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 -left-32 h-96 w-96 rounded-full bg-emerald-500/12 blur-[140px]" />
        <div className="absolute top-40 -right-24 h-80 w-80 rounded-full bg-cyan-500/12 blur-[130px]" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f14] via-[#0b0f14]/90 to-[#0b0f14]" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 px-4 sm:px-6 pt-20 sm:pt-24 pb-12 lg:pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs sm:text-sm text-emerald-200 mb-5">
              Plan your coverage
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 text-white tracking-tight">
              Claim Plan Builder
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-neutral-300 max-w-2xl mx-auto">
              Share a few details so we can organize your claim plan and next steps.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-start">
            <form
              onSubmit={handleSubmit}
              className="bg-[#121827]/90 border border-[#1f2836]/80 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Full name"
                  value={form.name}
                  onChange={(value) => updateField("name", value)}
                  placeholder="Ramesh Kumar"
                  required
                />
                <Field
                  label="Age"
                  type="number"
                  value={form.age}
                  onChange={(value) => updateField("age", value)}
                  placeholder="28"
                  required
                />
                <Field
                  label="Monthly salary"
                  type="number"
                  value={form.salary}
                  onChange={(value) => updateField("salary", value)}
                  placeholder="45000"
                  required
                />
                <Field
                  label="Loan EMI per month"
                  type="number"
                  value={form.loanEmi}
                  onChange={(value) => updateField("loanEmi", value)}
                  placeholder="6500"
                />
                <Field
                  label="Total loan amount"
                  type="number"
                  value={form.totalLoan}
                  onChange={(value) => updateField("totalLoan", value)}
                  placeholder="250000"
                />
                <Field
                  label="Monthly expenses needed"
                  type="number"
                  value={form.expenses}
                  onChange={(value) => updateField("expenses", value)}
                  placeholder="20000"
                  required
                />
                <Field
                  label="Insurance amount per month"
                  type="number"
                  value={form.insuranceMonthly}
                  onChange={(value) => updateField("insuranceMonthly", value)}
                  placeholder="1200"
                />
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <SelectField
                  label="Is your family earning?"
                  value={form.hasFamilyIncome}
                  onChange={(value) => updateField("hasFamilyIncome", value)}
                  options={[
                    { value: "no", label: "No" },
                    { value: "yes", label: "Yes" },
                  ]}
                />
                <SelectField
                  label="Do you have health insurance?"
                  value={form.hasHealthInsurance}
                  onChange={(value) => updateField("hasHealthInsurance", value)}
                  options={[
                    { value: "no", label: "No" },
                    { value: "yes", label: "Yes" },
                  ]}
                />
              </div>

              {showFamilyFields && (
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Total family income per month"
                    type="number"
                    value={form.familyIncome}
                    onChange={(value) => updateField("familyIncome", value)}
                    placeholder="90000"
                    required
                  />
                  <Field
                    label="Family savings per month"
                    type="number"
                    value={form.familySavings}
                    onChange={(value) => updateField("familySavings", value)}
                    placeholder="15000"
                    required
                  />
                </div>
              )}

              {showFamilyFields && (
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Family members (including you)"
                    type="number"
                    value={form.familyMembers}
                    onChange={(value) => updateField("familyMembers", value)}
                    placeholder="4"
                    required
                  />
                  <SelectField
                    label="Do you have family insurance?"
                    value={form.hasFamilyInsurance}
                    onChange={(value) => updateField("hasFamilyInsurance", value)}
                    options={[
                      { value: "no", label: "No" },
                      { value: "yes", label: "Yes" },
                    ]}
                  />
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-[#263042] bg-[#0f1521] p-5">
                <h3 className="text-sm font-semibold text-white mb-2">Alternative assets (optional)</h3>
                <p className="text-xs text-neutral-400 mb-4">
                  These reduce equity first (stocks, then mutual funds). FD/RD is not reduced.
                </p>
                <div className="grid gap-5 sm:grid-cols-2 text-xs text-neutral-300">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Gold allocation</span>
                      <span className="font-semibold">{form.goldPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="5"
                      value={form.goldPct}
                      onChange={(event) => updateField("goldPct", Number(event.target.value))}
                      className="w-full accent-yellow-400"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Real estate allocation</span>
                      <span className="font-semibold">{form.realEstatePct}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="5"
                      value={form.realEstatePct}
                      onChange={(event) => updateField("realEstatePct", Number(event.target.value))}
                      className="w-full accent-purple-400"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Investable amount per month (auto)"
                  type="text"
                  value={`Rs ${formatCurrency(investableMonthly)}`}
                  onChange={() => {}}
                  placeholder=""
                  readOnly
                />
                <div className="text-xs text-neutral-400 flex items-center">
                  Based on income minus expenses, EMI, and insurance.
                </div>
              </div>

              {investableMonthly === 0 && (
                <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                  Your expenses cover all available income. There is no extra amount to invest right now.
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-neutral-400">
                  We save this on your device only.
                </p>
                <button
                  type="submit"
                  className="w-full sm:w-auto rounded-full bg-emerald-500/90 hover:bg-emerald-400/90 text-white font-semibold px-6 py-2.5 transition"
                >
                  Continue to dashboard
                </button>
              </div>
            </form>

            <aside className="space-y-6">
              <div className="bg-[#0f1521]/80 border border-neutral-800/60 rounded-2xl p-6 shadow-lg">
                <h2 className="text-lg font-bold mb-3">How we use this</h2>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Your inputs will be stored locally and used for the next steps
                  you request. Nothing is uploaded until you explicitly submit it.
                </p>
              </div>

              {showHealthSuggestion && (
                <div className="bg-amber-500/10 border border-amber-400/40 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-lg font-bold mb-2 text-amber-200">
                    Health insurance suggestion
                  </h2>
                  <p className="text-sm text-amber-100/90 mb-4 leading-relaxed">
                    You said you don&apos;t have health insurance yet. It&apos;s a smart
                    safety net for the future.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/chatbot")}
                    className="rounded-full bg-amber-400/90 hover:bg-amber-300/90 text-amber-950 font-semibold px-5 py-2 transition"
                  >
                    Go to Policy Summarizer
                  </button>
                </div>
              )}

              {showFamilyInsuranceSuggestion && (
                <div className="bg-amber-500/10 border border-amber-400/40 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-lg font-bold mb-2 text-amber-200">
                    Family insurance suggestion
                  </h2>
                  <p className="text-sm text-amber-100/90 mb-4 leading-relaxed">
                    Since your family earns, having family insurance adds strong
                    protection for everyone. We recommend reviewing options.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/chatbot")}
                    className="rounded-full bg-amber-400/90 hover:bg-amber-300/90 text-amber-950 font-semibold px-5 py-2 transition"
                  >
                    Explore coverage options
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  readOnly,
}) {
  return (
    <label className="text-sm text-neutral-200 flex flex-col gap-2">
      <span className="font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        className="rounded-2xl border border-[#263042] bg-[#0f1521] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="text-sm text-neutral-200 flex flex-col gap-2">
      <span className="font-semibold">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[#263042] bg-[#0f1521] px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
