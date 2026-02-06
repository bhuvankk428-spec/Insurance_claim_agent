import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./ui/Navbar.jsx";

const STORAGE_KEY = "planFormData";

const percentConfig = {
  young: {
    emergency: 20,
    fd: 40,
    mutual: 10,
    stocks: 30,
  },
  mid: {
    emergency: 20,
    fd: 40,
    mutual: 30,
    stocks: 10,
  },
  senior: {
    emergency: 20,
    fd: 60,
    mutual: 20,
    stocks: 0,
  },
};

const returnRates = {
  fd: 0.06,
  mutual: 0.1,
  stocks: 0.08,
};

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

function futureValue(monthly, annualRate, years) {
  if (!monthly || !annualRate) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
}

function getAgeGroup(age) {
  if (age < 35) return "young";
  if (age < 60) return "mid";
  return "senior";
}

export default function PlanDashboard() {
  const navigate = useNavigate();
  const [riskLevel, setRiskLevel] = useState("medium");
  const [projectionYearsInput, setProjectionYearsInput] = useState("20");

  const parsedYears = Math.round(toNumber(projectionYearsInput));
  const projectionYears = parsedYears > 0 ? Math.min(50, parsedYears) : 20;

  const saved = localStorage.getItem(STORAGE_KEY);
  let data = null;
  if (saved) {
    try {
      data = JSON.parse(saved);
    } catch {
      data = null;
    }
  }

  const computed = useMemo(() => {
    if (!data) return null;

    const age = toNumber(data.age);
    const investMonthly = toNumber(data.investMonthly);
    const salary = toNumber(data.salary);
    const familyIncome = toNumber(data.familyIncome);
    const expenses = toNumber(data.expenses);
    const loanEmi = toNumber(data.loanEmi);
    const insuranceMonthly = toNumber(data.insuranceMonthly);
    const totalIncome = salary + familyIncome;
    const debtRatio = totalIncome > 0 ? loanEmi / totalIncome : 0;

    const group = getAgeGroup(age);
    const baseSplit = percentConfig[group];
    const lowInvestSplit = {
      emergency: 40,
      fd: 60,
      mutual: 0,
      stocks: 0,
    };

    const yearlyInvestable = investMonthly * 12;
    const familyMembers = toNumber(data.familyMembers);
    const lowInvestYearly = yearlyInvestable <= 100000;
    const lowInvestFamily = familyMembers >= 4 && yearlyInvestable < 300000;
    const useLowInvest = lowInvestYearly || lowInvestFamily;

    const debtRisky = debtRatio >= 0.35;
    const riskMultiplier = riskLevel === "low" ? 0.7 : riskLevel === "high" ? 1.2 : 1;
    const baseEquity = baseSplit.mutual + baseSplit.stocks;
    const equityTarget = Math.min(
      60,
      Math.max(10, Math.round(baseEquity * riskMultiplier))
    );
    const equityCap = debtRisky ? Math.min(equityTarget, 15) : equityTarget;
    const equityUse = useLowInvest ? 0 : equityCap;

    const baseEmergency = useLowInvest ? lowInvestSplit.emergency : baseSplit.emergency;
    const equityRatio = baseEquity > 0 ? equityUse / baseEquity : 0;
    const split = useLowInvest
      ? {
          emergency: baseEmergency,
          fd: 100 - baseEmergency,
          mutual: 0,
          stocks: 0,
          gold: 0,
          realEstate: 0,
        }
      : {
          emergency: baseEmergency,
          fd: Math.max(0, 100 - baseEmergency - equityUse),
          mutual: Math.round(baseSplit.mutual * equityRatio),
          stocks: Math.max(0, equityUse - Math.round(baseSplit.mutual * equityRatio)),
          gold: 0,
          realEstate: 0,
        };

    const goldPct = toNumber(data.goldPct);
    const realEstatePct = toNumber(data.realEstatePct);
    const altAllocRequested = Math.max(0, goldPct) + Math.max(0, realEstatePct);
    const availableEquity = Math.max(0, split.stocks + split.mutual);
    const safeAltAlloc = Math.min(altAllocRequested, availableEquity);

    if (safeAltAlloc > 0 && altAllocRequested > 0) {
      const gold = Math.round((safeAltAlloc * Math.max(0, goldPct)) / altAllocRequested);
      const realEstate = Math.max(0, safeAltAlloc - gold);

      const reduceFromStocks = Math.min(split.stocks, safeAltAlloc);
      const remainingToReduce = safeAltAlloc - reduceFromStocks;
      const reduceFromMutual = Math.min(split.mutual, remainingToReduce);

      split.stocks = Math.max(0, split.stocks - reduceFromStocks);
      split.mutual = Math.max(0, split.mutual - reduceFromMutual);
      split.gold = gold;
      split.realEstate = realEstate;
    }

    const emergencyYearly = (yearlyInvestable * split.emergency) / 100;
    const emergencyMonthly = emergencyYearly / 12;

    const breakdown = {
      emergency: emergencyMonthly,
      fd: (investMonthly * split.fd) / 100,
      mutual: (investMonthly * split.mutual) / 100,
      stocks: (investMonthly * split.stocks) / 100,
      gold: (investMonthly * split.gold) / 100,
      realEstate: (investMonthly * split.realEstate) / 100,
      emergencyYearly,
      yearlyInvestable,
      familyMembers,
      useLowInvest,
      totalIncome,
      debtRatio,
      debtRisky,
      expenses,
      loanEmi,
      insuranceMonthly,
      investMonthly,
    };

    const fdFuture = futureValue(breakdown.fd, returnRates.fd, projectionYears);
    const mutualFuture = futureValue(
      breakdown.mutual,
      returnRates.mutual,
      projectionYears
    );
    const stockFuture = futureValue(
      breakdown.stocks,
      returnRates.stocks,
      projectionYears
    );

    const totalFuture = fdFuture + mutualFuture + stockFuture;

    return {
      age,
      group,
      split,
      breakdown,
      projectionYears,
      totals: {
        fdFuture,
        mutualFuture,
        stockFuture,
        totalFuture,
      },
    };
  }, [data, riskLevel, projectionYears]);

  if (!data || !computed) {
    return (
      <div className="min-h-screen bg-[#0b0f14] text-white flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-lg text-center bg-[#121827]/90 border border-[#1f2836]/80 rounded-3xl p-8">
            <h1 className="text-2xl font-bold mb-3">No plan data yet</h1>
            <p className="text-sm text-neutral-300 mb-6">
              Please fill in your details to generate a personalized plan.
            </p>
            <button
              onClick={() => navigate("/plan")}
              className="rounded-full bg-emerald-500/90 hover:bg-emerald-400/90 text-white font-semibold px-6 py-2.5 transition"
            >
              Go to Plan Builder
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isYoung = computed.group === "young";
  const isLowInvest = computed.breakdown.useLowInvest;
  const debtRisky = computed.breakdown.debtRisky;
  const isSenior = computed.group === "senior";
  const emergencyTarget = computed.breakdown.expenses * 6;
  const requiredMonthly6 = emergencyTarget / 6;
  const requiredMonthly12 = emergencyTarget / 12;

  const segments = [
    { label: "Emergency", value: computed.split.emergency, color: "#34d399" },
    { label: "FD / RD", value: computed.split.fd, color: "#38bdf8" },
    { label: "Mutual Funds", value: computed.split.mutual, color: "#f59e0b" },
    { label: "Stocks", value: computed.split.stocks, color: "#f97316" },
    { label: "Gold", value: computed.split.gold, color: "#fbbf24" },
    { label: "Real Estate", value: computed.split.realEstate, color: "#a78bfa" },
  ];

  const conic = segments
    .filter((segment) => segment.value > 0)
    .reduce((acc, segment) => {
      const start = acc.offset;
      const nextOffset = start + segment.value;
      const colorStop = `${segment.color} ${start}% ${nextOffset}%`;
      return {
        offset: nextOffset,
        gradient: acc.gradient + (acc.gradient ? ", " : "") + colorStop,
      };
    }, { offset: 0, gradient: "" });

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex flex-col relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-48 -left-32 h-96 w-96 rounded-full bg-emerald-500/12 blur-[140px]" />
        <div className="absolute top-40 -right-24 h-80 w-80 rounded-full bg-cyan-500/12 blur-[130px]" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f14] via-[#0b0f14]/90 to-[#0b0f14]" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 px-4 sm:px-6 pt-20 sm:pt-24 pb-12 lg:pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10 reveal">
            <div>
              <div className="accent-shimmer inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 px-4 py-1.5 text-xs sm:text-sm text-emerald-100 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.12)]">
                Personal dashboard
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Hi {data.name || "there"}, here&apos;s your plan
              </h1>
              <p className="text-sm sm:text-base text-neutral-300 mt-3 max-w-2xl leading-relaxed">
                Based on your age and investable money, we balanced safety and growth.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/choose")}
                className="rounded-full border border-white/20 text-white/90 px-5 py-2 text-sm font-semibold hover:bg-white/10 transition hover:-translate-y-0.5 active:translate-y-0"
              >
                Back to chooser
              </button>
              <button
                onClick={() => navigate("/plan")}
                className="rounded-full border border-emerald-500/60 text-emerald-100 px-5 py-2 text-sm font-semibold hover:bg-emerald-500/10 transition hover:-translate-y-0.5 active:translate-y-0"
              >
                Edit details
              </button>
              <div className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs text-neutral-300">
                Investable: Rs {formatCurrency(toNumber(data.investMonthly))}/mo
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs sm:text-sm text-amber-100">
            Disclaimer: This is not financial advice. Returns are estimates and markets can be volatile. Please consult a certified advisor before investing.
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="bg-[#121827]/90 border border-[#1f2836]/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden reveal reveal-delay-1">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.16),transparent_55%)]" />
              <div className="relative">
                <h2 className="text-xl font-bold mb-4">Suggested allocation</h2>
                <div className="grid gap-6 md:grid-cols-[240px_1fr] items-center">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <div
                        className="h-56 w-56 rounded-full border border-white/10 shadow-[0_0_35px_rgba(59,130,246,0.18)] transition-transform duration-500 hover:scale-[1.02] slow-spin"
                        style={{
                          background: `conic-gradient(${conic.gradient})`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-28 w-28 rounded-full bg-[#0f1521] border border-white/10 flex flex-col items-center justify-center text-center">
                          <div className="text-xs text-neutral-400">Investable</div>
                          <div className="text-sm font-semibold">Rs {formatCurrency(toNumber(data.investMonthly))}</div>
                          <div className="text-[10px] text-neutral-500">per month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-neutral-300">
                    {segments.filter((segment) => segment.value > 0).map((segment) => (
                      <div key={segment.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: segment.color }}
                          />
                          <span>{segment.label}</span>
                        </div>
                        <span className="font-semibold text-white">{segment.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm text-neutral-300">
                  <CardStat
                    label="Emergency fund"
                    value={`Rs ${formatCurrency(computed.breakdown.emergency)}/mo`}
                    subValue={`Rs ${formatCurrency(computed.breakdown.emergencyYearly)}/yr`}
                  />
                  <CardStat
                    label="FD / RD"
                    value={`Rs ${formatCurrency(computed.breakdown.fd)}/mo`}
                    subValue={`Rs ${formatCurrency(computed.breakdown.fd * 12)}/yr`}
                  />
                  <CardStat
                    label="Mutual funds"
                    value={`Rs ${formatCurrency(computed.breakdown.mutual)}/mo`}
                    subValue={`Rs ${formatCurrency(computed.breakdown.mutual * 12)}/yr`}
                  />
                  <CardStat
                    label="Stocks"
                    value={`Rs ${formatCurrency(computed.breakdown.stocks)}/mo`}
                    subValue={`Rs ${formatCurrency(computed.breakdown.stocks * 12)}/yr`}
                  />
                  {computed.split.gold > 0 && (
                    <CardStat
                      label="Gold"
                      value={`Rs ${formatCurrency(computed.breakdown.gold)}/mo`}
                      subValue={`Rs ${formatCurrency(computed.breakdown.gold * 12)}/yr`}
                    />
                  )}
                  {computed.split.realEstate > 0 && (
                    <CardStat
                      label="Real estate"
                      value={`Rs ${formatCurrency(computed.breakdown.realEstate)}/mo`}
                      subValue={`Rs ${formatCurrency(computed.breakdown.realEstate * 12)}/yr`}
                    />
                  )}
                </div>
                <p className="mt-4 text-xs text-neutral-400">
                  Emergency fund is {isLowInvest ? "40%" : "20%"} of yearly investable amount: Rs {formatCurrency(computed.breakdown.emergencyYearly)} per year.
                </p>

                <div className="mt-6">
                  <div className="bg-emerald-500/10 border border-emerald-400/40 rounded-2xl p-5 shadow-lg min-w-0">
                    <h3 className="text-sm font-semibold text-emerald-200 mb-2">Plan health score</h3>
                    <PlanScore
                      income={computed.breakdown.totalIncome}
                      emi={computed.breakdown.loanEmi}
                      investable={computed.breakdown.investMonthly}
                      hasInsurance={data.hasHealthInsurance === "yes"}
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="bg-[#0f1521]/90 border border-neutral-800/70 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-lg font-bold mb-2">Why this mix?</h2>
                    <ul className="text-sm text-neutral-300 space-y-2">
                      <li>
                        {isLowInvest
                          ? "For investable money under Rs 1,00,000 per year (or family of 4+ under Rs 3,00,000 per year), we keep it simple: 40% emergency fund and 60% FD/RD."
                          : "Emergency fund is 20% of yearly investable money to protect you."}
                      </li>
                      <li>FD/RD gives stability and predictable growth.</li>
                      {!isLowInvest && (
                        <li>
                          Mutual funds are focused on {isYoung ? "small and mid cap" : "mid and large cap"}.
                        </li>
                      )}
                      {!isLowInvest && (
                        <li>
                          Stocks are focused on {isYoung ? "mid and large cap for growth" : "large cap for safety"}.
                        </li>
                      )}
                      {computed.group === "senior" && !isLowInvest && (
                        <li>At 60+, priority is capital protection with limited equity exposure.</li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-[#121827]/90 border border-[#1f2836]/80 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-lg font-bold mb-3">6-month emergency target</h2>
                    <p className="text-xs text-neutral-400 mb-3">
                      Target: Rs {formatCurrency(computed.breakdown.expenses * 6)} (6 months of expenses).
                    </p>
                    <p className="text-xs text-neutral-400 mb-3">
                      Required monthly contribution: Rs {formatCurrency(requiredMonthly6)} for 6 months, or Rs {formatCurrency(requiredMonthly12)} for 12 months.
                    </p>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400"
                        style={{
                          width: `${Math.min(
                            100,
                            ((toNumber(data.familySavings) * 6) / Math.max(1, computed.breakdown.expenses * 6)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-neutral-400">
                      Progress uses your monthly savings contribution projected over 6 months.
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-amber-500/10 border border-amber-400/40 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-lg font-bold mb-2 text-amber-200">Loan caution</h2>
                  <p className="text-sm text-amber-100/90 leading-relaxed">
                    Taking loans for cars and bikes is usually not recommended because they are depreciating assets.
                    If possible, consider building assets like real estate, gold, or silver instead.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="bg-[#0f1521]/90 border border-neutral-800/70 rounded-2xl p-5 shadow-lg min-w-0">
                <h3 className="text-sm font-semibold text-white mb-2">Income flow (monthly)</h3>
                <ExpensePie
                  income={computed.breakdown.totalIncome}
                  expenses={computed.breakdown.expenses}
                  emi={computed.breakdown.loanEmi}
                  insurance={computed.breakdown.insuranceMonthly}
                  investable={computed.breakdown.investMonthly}
                />
              </div>
              {!isSenior && (
                <div className="bg-[#121827]/90 border border-[#1f2836]/80 rounded-2xl p-6 shadow-lg reveal reveal-delay-2">
                  <h2 className="text-lg font-bold mb-3">Risk appetite</h2>
                  <p className="text-xs text-neutral-400 mb-3">
                    Adjust the slider to control equity exposure. Risky debt reduces equity automatically.
                  </p>
                  <div className="flex items-center gap-3 text-xs text-neutral-300 mb-3">
                    <span>Low</span>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="1"
                      value={riskLevel === "low" ? 0 : riskLevel === "high" ? 2 : 1}
                      onChange={(event) =>
                        setRiskLevel(
                          event.target.value === "0"
                            ? "low"
                            : event.target.value === "2"
                              ? "high"
                              : "medium"
                        )
                      }
                      className="w-full accent-emerald-400"
                    />
                    <span>High</span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    Current: <span className="text-white">{riskLevel}</span>
                  </div>
                </div>
              )}

              <div className="bg-[#121827]/90 border border-[#1f2836]/80 rounded-2xl p-6 shadow-lg reveal reveal-delay-2">
                <h2 className="text-lg font-bold mb-3">Your details</h2>
                <div className="text-sm text-neutral-300 grid gap-2 sm:grid-cols-2">
                  <DetailRow label="Age" value={computed.age || "-"} />
                  <DetailRow label="Monthly salary" value={`Rs ${formatCurrency(toNumber(data.salary))}`} />
                  <DetailRow label="Monthly expenses" value={`Rs ${formatCurrency(toNumber(data.expenses))}`} />
                  <DetailRow label="Loan EMI" value={`Rs ${formatCurrency(toNumber(data.loanEmi))}`} />
                  <DetailRow label="Total loan" value={`Rs ${formatCurrency(toNumber(data.totalLoan))}`} />
                  <DetailRow label="Insurance / month" value={`Rs ${formatCurrency(toNumber(data.insuranceMonthly))}`} />
                  <DetailRow label="Investable / month" value={`Rs ${formatCurrency(toNumber(data.investMonthly))}`} />
                  <DetailRow label="Family income" value={`Rs ${formatCurrency(toNumber(data.familyIncome))}`} />
                  <DetailRow label="Family savings" value={`Rs ${formatCurrency(toNumber(data.familySavings))}`} />
                  <DetailRow label="Family members" value={computed.breakdown.familyMembers || "-"} />
                  <DetailRow label="Health insurance" value={data.hasHealthInsurance === "yes" ? "Yes" : "No"} />
                  <DetailRow label="Family insurance" value={data.hasFamilyInsurance === "yes" ? "Yes" : "No"} />
                </div>
              </div>


              {debtRisky && (
                <div className="bg-red-500/10 border border-red-400/40 rounded-2xl p-6 shadow-lg reveal reveal-delay-3">
                  <h2 className="text-lg font-bold mb-2 text-red-200">Debt-first strategy</h2>
                  <ol className="text-sm text-red-100/90 leading-relaxed list-decimal pl-4 space-y-2">
                    <li>Reduce EMI or refinance where possible.</li>
                    <li>Build the 6-month emergency buffer.</li>
                    <li>Resume equity investing once EMI is under control.</li>
                  </ol>
                </div>
              )}

              <div className="bg-[#121827]/90 border border-[#1f2836]/80 rounded-2xl p-6 shadow-lg reveal reveal-delay-4">
                <h2 className="text-lg font-bold mb-3">{projectionYears}-year estimate</h2>
                <div className="mb-4">
                  <label className="text-xs text-neutral-400 flex flex-col gap-2">
                    <span className="font-semibold text-neutral-300">Projection years</span>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={projectionYearsInput}
                      onChange={(event) => setProjectionYearsInput(event.target.value)}
                      className="w-full rounded-2xl border border-[#263042] bg-[#0f1521] px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                    />
                  </label>
                  <p className="mt-2 text-[11px] text-neutral-500">Enter 1 to 50 years.</p>
                </div>
                <p className="text-xs text-neutral-400 mb-4">
                  Estimated returns: FD 6%, Mutual funds 10%, Stocks 8% per year. This is an approximation, not a guarantee.
                </p>
                <div className="space-y-2 text-sm text-neutral-300">
                  <div className="flex items-center justify-between">
                    <span>FD / RD</span>
                    <span className="font-semibold">Rs {formatCurrency(computed.totals.fdFuture)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Mutual funds</span>
                    <span className="font-semibold">Rs {formatCurrency(computed.totals.mutualFuture)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Stocks</span>
                    <span className="font-semibold">Rs {formatCurrency(computed.totals.stockFuture)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex items-center justify-between text-white">
                    <span>Total estimate</span>
                    <span className="font-bold">Rs {formatCurrency(computed.totals.totalFuture)}</span>
                  </div>
                </div>
                <div className="mt-5 border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Contributions over {projectionYears} years</h3>
                  <div className="space-y-2 text-xs text-neutral-300">
                    <div className="flex items-center justify-between">
                      <span>Emergency fund</span>
                      <span className="font-semibold">
                        Rs {formatCurrency(computed.breakdown.emergency * 12 * projectionYears)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>FD / RD</span>
                      <span className="font-semibold">
                        Rs {formatCurrency(computed.breakdown.fd * 12 * projectionYears)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Mutual funds</span>
                      <span className="font-semibold">
                        Rs {formatCurrency(computed.breakdown.mutual * 12 * projectionYears)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Stocks</span>
                      <span className="font-semibold">
                        Rs {formatCurrency(computed.breakdown.stocks * 12 * projectionYears)}
                      </span>
                    </div>
                    {computed.split.gold > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Gold</span>
                        <span className="font-semibold">
                          Rs {formatCurrency(computed.breakdown.gold * 12 * projectionYears)}
                        </span>
                      </div>
                    )}
                    {computed.split.realEstate > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Real estate</span>
                        <span className="font-semibold">
                          Rs {formatCurrency(computed.breakdown.realEstate * 12 * projectionYears)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(data.hasHealthInsurance !== "yes" || data.hasFamilyInsurance !== "yes") && (
                <div className="bg-amber-500/10 border border-amber-400/40 rounded-2xl p-6 shadow-lg reveal reveal-delay-4">
                  <h2 className="text-lg font-bold mb-2 text-amber-200">Insurance suggestion</h2>
                  <p className="text-sm text-amber-100/90 leading-relaxed mb-4">
                    Based on your family size and income, we recommend a monthly premium range of
                    Rs {formatCurrency(estimatePremiumMin(computed.breakdown.totalIncome, computed.breakdown.familyMembers))} to
                    Rs {formatCurrency(estimatePremiumMax(computed.breakdown.totalIncome, computed.breakdown.familyMembers))}.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/chatbot")}
                    className="rounded-full bg-amber-400/90 hover:bg-amber-300/90 text-amber-950 font-semibold px-5 py-2 transition"
                  >
                    Get policy suggestions
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function CardStat({ label, value, subValue }) {
  return (
    <div className="rounded-2xl border border-[#263042] bg-[#0f1521] px-4 py-3">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="text-base font-semibold text-white">{value}</p>
      {subValue && <p className="text-[11px] text-neutral-500">{subValue}</p>}
    </div>
  );
}

function estimatePremiumMin(income, members) {
  const factor = members >= 4 ? 0.035 : 0.025;
  return (income * factor) / 12;
}

function estimatePremiumMax(income, members) {
  const factor = members >= 4 ? 0.055 : 0.04;
  return (income * factor) / 12;
}

function ExpensePie({ income, expenses, emi, insurance, investable }) {
  const total = Math.max(1, income);
  const slices = [
    { label: "Expenses", value: (expenses / total) * 100, color: "#60a5fa" },
    { label: "EMI", value: (emi / total) * 100, color: "#f97316" },
    { label: "Insurance", value: (insurance / total) * 100, color: "#facc15" },
    { label: "Investable", value: (investable / total) * 100, color: "#34d399" },
  ];
  const conic = slices.reduce(
    (acc, slice) => {
      const start = acc.offset;
      const end = start + slice.value;
      return {
        offset: end,
        gradient: acc.gradient + (acc.gradient ? ", " : "") + `${slice.color} ${start}% ${end}%`,
      };
    },
    { offset: 0, gradient: "" }
  );

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_160px] items-start">
      <div className="min-w-0 space-y-2 text-xs sm:text-sm text-neutral-300">
        {slices.map((slice) => (
          <div key={slice.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
              <span>{slice.label}</span>
            </div>
            <span className="font-semibold text-white">{slice.value.toFixed(0)}%</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end sm:justify-end">
        <div
          className="h-32 w-32 sm:h-36 sm:w-36 md:h-40 md:w-40 rounded-full border border-white/10"
          style={{ background: `conic-gradient(${conic.gradient})` }}
        />
      </div>
    </div>
  );
}

function PlanScore({ income, emi, investable, hasInsurance }) {
  const debtRatio = income > 0 ? emi / income : 0;
  const investRatio = income > 0 ? investable / income : 0;
  let score = 50;
  if (investRatio > 0.2) score += 20;
  if (investRatio > 0.3) score += 10;
  if (debtRatio > 0.35) score -= 20;
  if (debtRatio > 0.5) score -= 15;
  if (hasInsurance) score += 10;
  score = Math.max(0, Math.min(100, score));

  return (
    <div>
      <div className="flex items-center justify-between mb-2 text-sm text-emerald-100">
        <span>Score</span>
        <span className="font-semibold">{score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-emerald-400"
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-emerald-100/80 leading-relaxed">
        Higher scores mean stronger resilience and balance.
      </p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
      <span className="text-xs text-neutral-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
