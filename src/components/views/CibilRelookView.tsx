"use client";

import React, { useState } from "react";
import {
  RefreshCw,
  ArrowUpRight,
  CheckCircle,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

interface LoanAccount {
  id: string;
  lender: string;
  type: string;
  sanctionAmount: number;
  currentBalance: number;
  monthlyEmi: number;
  dpdStatus: string;
  status: "Active" | "Closed";
  toClose: boolean;
}

export const CibilRelookView: React.FC = () => {
  const { setActiveTab } = useWorkspaceStore();
  const [score, setScore] = useState<number>(762);
  const [applicantName] = useState<string>("Vikramaditya Sharma");
  const [caseRemarks, setCaseRemarks] = useState<string>("");

  const [accounts, setAccounts] = useState<LoanAccount[]>([
    {
      id: "1",
      lender: "HDFC Bank",
      type: "Auto Loan",
      sanctionAmount: 850000,
      currentBalance: 240000,
      monthlyEmi: 18200,
      dpdStatus: "000/000/000 (Clear)",
      status: "Active",
      toClose: false,
    },
    {
      id: "2",
      lender: "SBI Cards",
      type: "Credit Card",
      sanctionAmount: 200000,
      currentBalance: 32000,
      monthlyEmi: 3200,
      dpdStatus: "030 (1 delayed payment 8 mos ago)",
      status: "Active",
      toClose: true,
    },
    {
      id: "3",
      lender: "Bajaj Finance",
      type: "Consumer Durable Loan",
      sanctionAmount: 75000,
      currentBalance: 0,
      monthlyEmi: 0,
      dpdStatus: "000/000 (Clear)",
      status: "Closed",
      toClose: false,
    },
    {
      id: "4",
      lender: "ICICI Bank",
      type: "Personal Loan",
      sanctionAmount: 500000,
      currentBalance: 120000,
      monthlyEmi: 14500,
      dpdStatus: "000/000/000 (Clear)",
      status: "Active",
      toClose: false,
    },
  ]);

  const activeAccounts = accounts.filter((a) => a.status === "Active");
  const currentTotalEmi = activeAccounts.reduce((sum, a) => sum + a.monthlyEmi, 0);
  const emiAfterClosure = activeAccounts
    .filter((a) => !a.toClose)
    .reduce((sum, a) => sum + a.monthlyEmi, 0);
  const totalOutstanding = activeAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const getScoreBand = (val: number) => {
    if (val >= 750) return { label: "Excellent (Prime)", color: "text-[#17653C]", bg: "bg-[#DCF2E4]" };
    if (val >= 700) return { label: "Good (Standard)", color: "text-[#1E4E9E]", bg: "bg-[#E2ECFE]" };
    if (val >= 650) return { label: "Moderate Risk", color: "text-amber-800", bg: "bg-amber-100" };
    return { label: "High Risk / Policy Deviation", color: "text-red-800", bg: "bg-red-100" };
  };

  const band = getScoreBand(score);

  const toggleClosure = (id: string) => {
    setAccounts(
      accounts.map((a) => (a.id === id ? { ...a, toClose: !a.toClose } : a))
    );
  };

  const generateRelookCase = () => {
    const closedCount = accounts.filter((a) => a.toClose).length;
    const reliefEmi = currentTotalEmi - emiAfterClosure;
    setCaseRemarks(
      `CASE RELOOK JUSTIFICATION FOR UNDERWRITING:\n` +
        `• Applicant: ${applicantName} | CIBIL Score: ${score} (${band.label})\n` +
        `• Total Live Credit Lines: ${activeAccounts.length}\n` +
        `• Current Monthly Obligation: ₹${currentTotalEmi.toLocaleString("en-IN")}\n` +
        `• Proposed BT / Closure: ${closedCount} trade line(s) slated for closure, reducing monthly burden by ₹${reliefEmi.toLocaleString("en-IN")}.\n` +
        `• Revised Post-Sanction Obligation: ₹${emiAfterClosure.toLocaleString("en-IN")}/month.\n` +
        `• DPD Analysis: Isolated 30 DPD over 6 months old due to technical banking clearing. Zero 60+ or 90+ write-offs recorded.\n` +
        `• Recommendation: Eligible for Deviation Sanction with BT condition on SBI Card.`
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="mb-4">
        <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1">
          YOUR WORKSPACE / CIBIL &amp; CASE RELOOK
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-[26px] font-semibold tracking-tight text-[#17241B] mb-1">
              CIBIL &amp; case relook.
            </h1>
            <p className="text-xs md:text-[13px] text-[#576558]">
              Turn a credit report into a clearer view of accounts, balances and obligations.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-[#829283] hover:text-[#17241B] transition-colors cursor-pointer"
            onClick={() => setActiveTab("overview")}
          >
            <span>Overview</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* Top Score & Summary Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-4 mb-4">
        {/* Score Dial Box */}
        <div className="bg-white rounded-xl border border-[#E3EBE0] p-4 md:p-5 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1.5">
            BUREAU SCORE (CIBIL / CRIF / EXPERIAN)
          </div>
          <div className="text-4xl md:text-5xl font-extrabold font-mono text-[#163A2C] leading-none mb-1.5">
            {score}
          </div>
          <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${band.bg} ${band.color} mb-3`}>
            {band.label}
          </div>

          <div className="w-full px-2">
            <input
              type="range"
              min="300"
              max="900"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full accent-[#163A2C] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#829283] mt-1">
              <span>300 (Poor)</span>
              <span>750 (Prime)</span>
              <span>900 (Excellent)</span>
            </div>
          </div>
        </div>

        {/* Obligation Summary Box */}
        <div className="bg-white rounded-xl border border-[#E3EBE0] p-4 md:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1">
              OBLIGATION &amp; BURDEN ANALYSIS
            </div>
            <h3 className="text-sm md:text-base font-bold text-[#17241B] mb-3">
              Credit Profile for {applicantName}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
              <div className="bg-[#F9FAF7] p-2.5 rounded-lg border border-[#ECEFE9]">
                <div className="text-[11px] text-[#829283]">Current Live EMI</div>
                <div className="text-base font-bold text-[#17241B]">
                  ₹{currentTotalEmi.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="bg-[#EBF3E8] p-2.5 rounded-lg border border-[#D8E7D5]">
                <div className="text-[11px] text-[#1B4734]">After BT / Closure</div>
                <div className="text-base font-bold text-[#153A2A]">
                  ₹{emiAfterClosure.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="bg-[#F9FAF7] p-2.5 rounded-lg border border-[#ECEFE9]">
                <div className="text-[11px] text-[#829283]">Total Outstanding</div>
                <div className="text-base font-bold text-[#17241B]">
                  ₹{(totalOutstanding / 100000).toFixed(2)}L
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full h-9 bg-[#163A2C] hover:bg-[#102B21] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            onClick={generateRelookCase}
          >
            <RefreshCw size={13} />
            <span>Generate Relook Justification</span>
          </button>
        </div>
      </div>

      {/* Accounts Breakdown Table */}
      <div className="bg-white rounded-xl border border-[#E3EBE0] p-4 md:p-5 mb-4 shadow-xs">
        <h3 className="text-sm md:text-base font-bold text-[#17241B] mb-0.5">
          Trade Lines &amp; Active Loan Accounts ({accounts.length})
        </h3>
        <p className="text-xs text-[#576558] mb-3">
          Toggle &quot;Mark to Close / Balance Transfer&quot; to simulate revised FOIR &amp; underwriter justification.
        </p>

        <div className="border border-[#ECEFE9] rounded-xl overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#F8FAF6] border-b border-[#ECEFE9] text-[#829283] text-[10px] font-bold tracking-wider uppercase">
                <th className="py-2.5 px-3">Lender &amp; Product</th>
                <th className="py-2.5 px-3">Sanctioned</th>
                <th className="py-2.5 px-3">Current Balance</th>
                <th className="py-2.5 px-3">Monthly EMI</th>
                <th className="py-2.5 px-3">DPD Track</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Closure / BT</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr
                  key={acc.id}
                  className={`border-b border-[#ECEFE9] last:border-b-0 hover:bg-[#FBFDFB] transition-colors ${
                    acc.status === "Closed" ? "opacity-60" : ""
                  }`}
                >
                  <td className="py-2 px-3">
                    <div className="font-semibold text-[#17241B]">{acc.lender}</div>
                    <div className="text-[11px] text-[#829283]">{acc.type}</div>
                  </td>
                  <td className="py-2 px-3 text-[#576558]">₹{acc.sanctionAmount.toLocaleString("en-IN")}</td>
                  <td className="py-2 px-3 font-semibold text-[#17241B]">₹{acc.currentBalance.toLocaleString("en-IN")}</td>
                  <td className="py-2 px-3 text-[#163A2C] font-semibold">
                    ₹{acc.monthlyEmi.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-[10.5px] px-1.5 py-0.5 rounded ${
                        acc.dpdStatus.includes("Clear")
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {acc.dpdStatus}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        acc.status === "Active" ? "bg-[#E3EDE0] text-[#194532]" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {acc.status}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {acc.status === "Active" ? (
                      <button
                        type="button"
                        onClick={() => toggleClosure(acc.id)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          acc.toClose
                            ? "bg-amber-100 border-amber-300 text-amber-800"
                            : "bg-white border-[#CAD8C7] text-[#1B4734] hover:bg-[#F2F7F0]"
                        }`}
                      >
                        {acc.toClose ? "✓ Slated to Close" : "+ Plan Closure"}
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#829283]">Already Paid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated Case Relook Justification */}
      {caseRemarks && (
        <div className="bg-white rounded-xl border border-[#C4D9C1] p-4 md:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle size={16} className="text-emerald-700" />
              <h3 className="text-xs md:text-sm font-bold text-[#17241B]">
                Generated Credit Committee &amp; Relook Note
              </h3>
            </div>
            <button
              type="button"
              className="px-2.5 py-1 bg-white border border-[#E3EBE0] hover:bg-[#F5F8F4] text-[11px] font-semibold text-[#17241B] rounded-md transition-colors cursor-pointer"
              onClick={() => navigator.clipboard?.writeText(caseRemarks)}
            >
              Copy to Clipboard
            </button>
          </div>
          <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap bg-[#F9FAF6] p-3 rounded-lg text-[#183226] border border-[#ECEFE9]">
            {caseRemarks}
          </pre>
        </div>
      )}
    </div>
  );
};
