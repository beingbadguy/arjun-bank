"use client";

import React from "react";
import {
  ArrowUpRight,
  Clock,
  Building2,
  FileText,
  Calculator,
  Files,
  MapPin,
  CheckCircle2,
  UploadCloud,
  Check,
  Headphones,
  PhoneCall,
  FolderLock,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useAuthStore } from "@/store/useAuthStore";

export const OverviewView: React.FC = () => {
  const { setActiveTab, setSupportModalOpen, setScriptModalOpen } = useWorkspaceStore();
  const { user } = useAuthStore();
  const isSuperadmin = user?.role === "superadmin";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Title Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
        <div>
          <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1">
            THE LOAN OPERATIONS WORKSPACE
          </div>
          <h1 className="text-2xl md:text-[27px] font-semibold tracking-tight text-[#17241B] mb-1">
            Good work starts here.
          </h1>
          <p className="text-xs md:text-[13px] text-[#576558]">
            One place for the details. More room for the decisions.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#829283]">
          <Clock size={14} />
          <span>Your everyday toolkit</span>
        </div>
      </div>

      {/* Hero Forest Green Banner */}
      <div className="bg-gradient-to-br from-[#183C2F] to-[#112D23] rounded-2xl p-5 md:p-7 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden mb-4 shadow-lg shadow-[#163A2C]/10">
        <div className="max-w-md z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 rounded-full text-[11px] font-medium text-[#C3D8C1] mb-3">
            <span className="text-sm leading-none">•</span> Built for your next move
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight text-white mb-2.5">
            Less back and forth.
            <br />
            More moving forward.
          </h2>
          <p className="text-xs md:text-[13px] leading-relaxed text-[#B8CDB7] mb-5">
            From finding the right lender to reviewing a credit report, bring
            every step of your loan workflow together.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 bg-[#DCE8D7] text-[#163A2C] hover:bg-white px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            onClick={() => setActiveTab("company-search")}
          >
            <span>Find a company</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Hero Decorative Graphic */}
        <div className="relative z-10 shrink-0">
          <div className="bg-[#E8EFE5] rounded-xl p-4 w-56 md:w-64 text-[#163A2C] shadow-xl rotate-1 hover:rotate-0 transition-transform duration-300">
            <div className="text-[9px] font-bold tracking-widest text-[#4C6554] uppercase mb-2.5">
              THE BIGGER PICTURE
            </div>
            <div className="flex items-end gap-1.5 h-12 mb-3 pb-1 border-b border-[#C9D9C5]">
              <div className="flex-1 bg-[#72967A] rounded-t-xs h-[35%]" />
              <div className="flex-1 bg-[#72967A] rounded-t-xs h-[60%]" />
              <div className="flex-1 bg-[#72967A] rounded-t-xs h-[45%]" />
              <div className="flex-1 bg-[#72967A] rounded-t-xs h-[80%]" />
              <div className="flex-1 bg-[#163A2C] rounded-t-xs h-[100%]" />
              <div className="flex-1 bg-[#72967A] rounded-t-xs h-[70%]" />
              <div className="flex-1 bg-[#72967A] rounded-t-xs h-[90%]" />
            </div>
            <div className="bg-white rounded-full py-1.5 px-3 flex items-center gap-2 shadow-2xs text-xs">
              <div className="w-4 h-4 rounded-full bg-[#E2ECE0] flex items-center justify-center text-[#183C2F] shrink-0">
                <Check size={10} strokeWidth={3} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[#17241B] truncate text-[10.5px]">
                  Clarity at every step.
                </div>
                <div className="text-[8.5px] font-medium text-[#829283] tracking-wider uppercase truncate">
                  LOOK UP, REVIEW, MOVE FORWARD
                </div>
              </div>
              <ArrowUpRight size={11} className="text-[#183C2F] shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action 4-Card Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6">
        <button
          type="button"
          className="bg-white border border-[#E3EBE0] hover:border-[#95AA94] rounded-xl p-2.5 flex items-center justify-between text-left transition-all hover:-translate-y-0.5 shadow-2xs cursor-pointer"
          onClick={() => setActiveTab("company-search")}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#F1F6EF] text-[#163A2C] flex items-center justify-center shrink-0">
              <Building2 size={14} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#17241B] leading-tight">
                Find a lender
              </div>
              <div className="text-[10.5px] text-[#829283]">Company &amp; PIN lookup</div>
            </div>
          </div>
          <ArrowUpRight size={13} className="text-[#829283]" />
        </button>

        <button
          type="button"
          className="bg-white border border-[#E3EBE0] hover:border-[#95AA94] rounded-xl p-2.5 flex items-center justify-between text-left transition-all hover:-translate-y-0.5 shadow-2xs cursor-pointer"
          onClick={() => setActiveTab("cibil-relook")}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#F1F6EF] text-[#163A2C] flex items-center justify-center shrink-0">
              <FileText size={14} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#17241B] leading-tight">
                Review a report
              </div>
              <div className="text-[10.5px] text-[#829283]">CIBIL &amp; case relook</div>
            </div>
          </div>
          <ArrowUpRight size={13} className="text-[#829283]" />
        </button>

        <button
          type="button"
          className="bg-white border border-[#E3EBE0] hover:border-[#95AA94] rounded-xl p-2.5 flex items-center justify-between text-left transition-all hover:-translate-y-0.5 shadow-2xs cursor-pointer"
          onClick={() => setActiveTab("emi-calc")}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#F1F6EF] text-[#163A2C] flex items-center justify-center shrink-0">
              <Calculator size={14} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#17241B] leading-tight">
                Run the numbers
              </div>
              <div className="text-[10.5px] text-[#829283]">EMI &amp; eligibility</div>
            </div>
          </div>
          <ArrowUpRight size={13} className="text-[#829283]" />
        </button>

        <button
          type="button"
          className="bg-white border border-[#E3EBE0] hover:border-[#95AA94] rounded-xl p-2.5 flex items-center justify-between text-left transition-all hover:-translate-y-0.5 shadow-2xs cursor-pointer"
          onClick={() => setActiveTab("pdf-tools")}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#F1F6EF] text-[#163A2C] flex items-center justify-center shrink-0">
              <Files size={14} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#17241B] leading-tight">
                Work with PDFs
              </div>
              <div className="text-[10.5px] text-[#829283]">Edit, merge &amp; more</div>
            </div>
          </div>
          <ArrowUpRight size={13} className="text-[#829283]" />
        </button>
      </div>

      {/* Section: A TOOL FOR EVERY STEP */}
      <div className="flex items-baseline justify-between mb-3.5">
        <div>
          <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-0.5">
            A TOOL FOR EVERY STEP
          </div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-[#17241B]">
            Make yourself at home.
          </h2>
        </div>
        <div className="text-[11.5px] text-[#829283]">
          Thoughtful tools. Clearer decisions.
        </div>
      </div>

      {/* 6 Grid Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
        {/* /01 Company Search */}
        <div className="bg-white border border-[#E3EBE0] hover:border-[#C6D8C4] rounded-xl p-4 flex flex-col transition-all hover:-translate-y-0.5 shadow-2xs group">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#F1F6EF] text-[#163A2C] flex items-center justify-center">
              <Building2 size={16} />
            </div>
            <div className="font-mono text-[11px] font-semibold text-[#829283]">/01</div>
          </div>
          <div className="text-[9.5px] font-bold tracking-widest text-[#829283] uppercase mb-1">
            FIND THE RIGHT FIT
          </div>
          <h3 className="text-sm font-semibold tracking-tight text-[#17241B] mb-1.5">
            Company search
          </h3>
          <p className="text-xs leading-relaxed text-[#576558] mb-4 grow">
            Find a company across lender lists and check its bank category.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#163A2C] group-hover:gap-2 transition-all cursor-pointer"
            onClick={() => setActiveTab("company-search")}
          >
            <span>Open tool</span>
            <span>→</span>
          </button>
        </div>

        {/* /02 PIN Code Search */}
        <div className="bg-white border border-[#E3EBE0] hover:border-[#C6D8C4] rounded-xl p-4 flex flex-col transition-all hover:-translate-y-0.5 shadow-2xs group">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#F1F6EF] text-[#163A2C] flex items-center justify-center">
              <MapPin size={16} />
            </div>
            <div className="font-mono text-[11px] font-semibold text-[#829283]">/02</div>
          </div>
          <div className="text-[9.5px] font-bold tracking-widest text-[#829283] uppercase mb-1">
            KNOW YOUR COVERAGE
          </div>
          <h3 className="text-sm font-semibold tracking-tight text-[#17241B] mb-1.5">
            PIN code search
          </h3>
          <p className="text-xs leading-relaxed text-[#576558] mb-4 grow">
            See which lenders serve your customer&apos;s location. Six digits is all it takes.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#163A2C] group-hover:gap-2 transition-all cursor-pointer"
            onClick={() => setActiveTab("pin-search")}
          >
            <span>Open tool</span>
            <span>→</span>
          </button>
        </div>

        {/* /03 CIBIL & Case Relook */}
        <div className="bg-white border border-[#E3EBE0] hover:border-[#C6D8C4] rounded-xl p-4 flex flex-col transition-all hover:-translate-y-0.5 shadow-2xs group">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#F1F6EF] text-[#163A2C] flex items-center justify-center">
              <FileText size={16} />
            </div>
            <div className="font-mono text-[11px] font-semibold text-[#829283]">/03</div>
          </div>
          <div className="text-[9.5px] font-bold tracking-widest text-[#829283] uppercase mb-1">
            SEE THE WHOLE STORY
          </div>
          <h3 className="text-sm font-semibold tracking-tight text-[#17241B] mb-1.5">
            CIBIL &amp; case relook
          </h3>
          <p className="text-xs leading-relaxed text-[#576558] mb-4 grow">
            Turn a credit report into a clearer view of accounts, balances and obligations.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#163A2C] group-hover:gap-2 transition-all cursor-pointer"
            onClick={() => setActiveTab("cibil-relook")}
          >
            <span>Open tool</span>
            <span>→</span>
          </button>
        </div>

        {/* /04 EMI Calculator */}
        <div className="bg-white border border-[#E3EBE0] hover:border-[#C6D8C4] rounded-xl p-4 flex flex-col transition-all hover:-translate-y-0.5 shadow-2xs group">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#F1F6EF] text-[#163A2C] flex items-center justify-center">
              <Calculator size={16} />
            </div>
            <div className="font-mono text-[11px] font-semibold text-[#829283]">/04</div>
          </div>
          <div className="text-[9.5px] font-bold tracking-widest text-[#829283] uppercase mb-1">
            PLAN WITH CONFIDENCE
          </div>
          <h3 className="text-sm font-semibold tracking-tight text-[#17241B] mb-1.5">
            EMI calculator
          </h3>
          <p className="text-xs leading-relaxed text-[#576558] mb-4 grow">
            Understand monthly payments, interest and the full repayment journey.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#163A2C] group-hover:gap-2 transition-all cursor-pointer"
            onClick={() => setActiveTab("emi-calc")}
          >
            <span>Open tool</span>
            <span>→</span>
          </button>
        </div>

        {/* /05 Eligibility Check */}
        <div className="bg-white border border-[#E3EBE0] hover:border-[#C6D8C4] rounded-xl p-4 flex flex-col transition-all hover:-translate-y-0.5 shadow-2xs group">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#F1F6EF] text-[#163A2C] flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <div className="font-mono text-[11px] font-semibold text-[#829283]">/05</div>
          </div>
          <div className="text-[9.5px] font-bold tracking-widest text-[#829283] uppercase mb-1">
            EXPLORE THE POSSIBILITIES
          </div>
          <h3 className="text-sm font-semibold tracking-tight text-[#17241B] mb-1.5">
            Eligibility check
          </h3>
          <p className="text-xs leading-relaxed text-[#576558] mb-4 grow">
            Estimate loan eligibility with salary, existing EMIs and FOIR.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#163A2C] group-hover:gap-2 transition-all cursor-pointer"
            onClick={() => setActiveTab("eligibility")}
          >
            <span>Open tool</span>
            <span>→</span>
          </button>
        </div>

        {/* /06 PDF Toolkit */}
        <div className="bg-white border border-[#E3EBE0] hover:border-[#C6D8C4] rounded-xl p-4 flex flex-col transition-all hover:-translate-y-0.5 shadow-2xs group">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#F1F6EF] text-[#163A2C] flex items-center justify-center">
              <Files size={16} />
            </div>
            <div className="font-mono text-[11px] font-semibold text-[#829283]">/06</div>
          </div>
          <div className="text-[9.5px] font-bold tracking-widest text-[#829283] uppercase mb-1">
            GET THE PAPERWORK SORTED
          </div>
          <h3 className="text-sm font-semibold tracking-tight text-[#17241B] mb-1.5">
            PDF toolkit
          </h3>
          <p className="text-xs leading-relaxed text-[#576558] mb-4 grow">
            Merge, split, organise and edit. Get your documents ready for the next step.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#163A2C] group-hover:gap-2 transition-all cursor-pointer"
            onClick={() => setActiveTab("pdf-tools")}
          >
            <span>Open tool</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Telecaller Script, Support Desk & Cases Vault Quick Cards */}
      <div
        className={`grid grid-cols-1 ${isSuperadmin ? "md:grid-cols-3" : "md:grid-cols-2"
          } gap-3.5 mb-6`}
      >
        {/* Calling Script Card */}
        <div className="bg-white border border-[#DCE4D9] hover:border-[#2563EB]/40 rounded-xl p-4 flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <Headphones size={16} />
              </div>
              <span className="text-[10px] font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Script
              </span>
            </div>
            <h3 className="text-sm font-bold tracking-tight text-[#17241B] mb-1">
              Telecaller Calling Script
            </h3>
            <p className="text-xs text-[#576558] leading-relaxed mb-3">
              Standard 4-step pitching script for telecallers: Greeting, Need Assessment, Pitch &amp; Document Collection.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScriptModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] group-hover:gap-2 transition-all cursor-pointer w-fit"
            id="overview-open-script-btn"
          >
            <span>Open practice window</span>
            <span>→</span>
          </button>
        </div>

        {/* Support Desk Card */}
        <div className="bg-white border border-[#DCE4D9] hover:border-[#163A2C]/40 rounded-xl p-4 flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F1F6EF] text-[#163A2C] flex items-center justify-center">
                <PhoneCall size={16} />
              </div>
              <span className="text-[10px] font-bold text-[#163A2C] bg-[#EAF2E8] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Support Desk
              </span>
            </div>
            <h3 className="text-sm font-bold tracking-tight text-[#17241B] mb-1">
              Process Manager
            </h3>
            <p className="text-xs text-[#576558] leading-relaxed mb-3">
              Arjun Grewal • Contact: +91 99685 84137 • Active hours: 9:30 AM - 6:30 PM.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSupportModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#163A2C] group-hover:gap-2 transition-all cursor-pointer w-fit"
            id="overview-open-support-btn"
          >
            <span>Contact Support Desk</span>
            <span>→</span>
          </button>
        </div>

        {/* Cases Vault (Locked) Card - Superadmin Only */}
        {isSuperadmin && (
          <div className="bg-white border border-[#DCE4D9] hover:border-[#163A2C]/40 rounded-xl p-4 flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-2xs group">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EBF4E9] text-[#163A2C] flex items-center justify-center">
                  <FolderLock size={16} />
                </div>
                <span className="text-[10px] font-bold text-[#163A2C] bg-[#EAF2E8] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  🔒 Locked Folder
                </span>
              </div>
              <h3 className="text-sm font-bold tracking-tight text-[#17241B] mb-1">
                My Cases (Vault)
              </h3>
              <p className="text-xs text-[#576558] leading-relaxed mb-3">
                Private case records, bank logins, application tracking &amp; status entries. Superadmin access only.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("cases-vault")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#163A2C] group-hover:gap-2 transition-all cursor-pointer w-fit"
              id="overview-open-vault-btn"
            >
              <span>Open cases folder</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>

      {/* Fresh Data Bottom Banner */}
      <div className="bg-[#EBF3E8] border border-[#DCE6D8] rounded-xl p-3.5 md:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white text-[#163A2C] flex items-center justify-center border border-[#D6E2D2] shrink-0">
            <UploadCloud size={16} />
          </div>
          <div>
            <h4 className="text-xs md:text-[13px] font-bold text-[#17241B] mb-0.5">
              Fresh data. Better decisions.
            </h4>
            <p className="text-[11px] text-[#576558]">
              Keep company lists and lender PIN coverage up to date with Excel or CSV imports.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#C8DAC5] rounded-lg bg-white hover:bg-[#163A2C] hover:text-white hover:border-[#163A2C] text-[#163A2C] text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-2xs"
          onClick={() => setActiveTab("data-update")}
        >
          <span>Manage data</span>
          <ArrowUpRight size={13} />
        </button>
      </div>

      {/* Page Footer */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#ECEFE9] text-[11px] text-[#829283]">
        <div className="font-semibold text-[#576558]">
          Arjun Grewal <span className="opacity-50 mx-1">/</span> Loan Operations
        </div>
        <div>Made for a more considered workflow.</div>
      </footer>
    </div>
  );
};
