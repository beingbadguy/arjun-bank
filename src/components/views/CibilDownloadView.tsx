"use client";

import React, { useState } from "react";
import {
  Download,
  ExternalLink,
  Copy,
  Check,
  Search,
  Globe,
  BookOpen,
  Building2,
  Info,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
  FileText,
} from "lucide-react";

export interface BureauDownloadLink {
  id: string;
  name: string;
  provider: string;
  category: "official" | "partner" | "guide";
  categoryLabel: string;
  badge: string;
  badgeColor: string;
  url: string;
  displayUrl: string;
  tagline: string;
  description: string;
  features: string[];
  turnaround: string;
  requiresPan: boolean;
  isFree: boolean;
  logoTheme: "emerald" | "blue" | "purple" | "amber";
}

export const BUREAU_DOWNLOAD_LINKS: BureauDownloadLink[] = [
  {
    id: "cibil-free",
    name: "TransUnion CIBIL - Free Annual Score",
    provider: "TransUnion CIBIL (Direct Official)",
    category: "official",
    categoryLabel: "Official Bureau",
    badge: "1 Free Check / Year (RBI)",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    url: "https://www.cibil.com/freecibilscore?utm_source=chatgpt.com",
    displayUrl: "cibil.com/freecibilscore",
    tagline: "Official annual free CIBIL score & report mandated by the Reserve Bank of India.",
    description: "Every Indian citizen is legally entitled to one comprehensive credit report per calendar year directly from TransUnion CIBIL at zero fee.",
    features: ["Official CIBIL CIR Score", "Zero Payment Required", "Direct Bureau Verification"],
    turnaround: "Instant (2 mins)",
    requiresPan: true,
    isFree: true,
    logoTheme: "emerald",
  },
  {
    id: "cibil-dashboard",
    name: "TransUnion CIBIL MyScore Dashboard",
    provider: "TransUnion CIBIL Subscriber Desk",
    category: "official",
    categoryLabel: "Official Bureau",
    badge: "Subscriber Dashboard",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    url: "https://myscore.cibil.com/CreditView/dashboard.page?enterprise=CIBIL&utm_source=chatgpt.com",
    displayUrl: "myscore.cibil.com/CreditView",
    tagline: "Member dashboard for inspecting live trade lines, DPD tracks & dispute desk.",
    description: "Access the full consumer view to inspect all individual loans, active credit cards, past 36-month payment history (DPD), and download the full official PDF.",
    features: ["Full Account Level DPD", "Enquiry History Audit", "Online Dispute Filing"],
    turnaround: "Instant Access",
    requiresPan: true,
    isFree: true,
    logoTheme: "blue",
  },
  {
    id: "paisabazaar-cibil",
    name: "Paisabazaar Free CIBIL Report",
    provider: "Paisabazaar (Licensed Partner)",
    category: "partner",
    categoryLabel: "Instant Checker",
    badge: "Free Monthly Refresh",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    url: "https://www.paisabazaar.com/cibil-credit-report/?utm_source=chatgpt.com",
    displayUrl: "paisabazaar.com/cibil-credit-report",
    tagline: "Instant soft-pull report with free monthly updates and zero score impact.",
    description: "Rapid consumer credit report access with intuitive graphical breakdowns of monthly obligations, credit health factors, and immediate downloadable PDF.",
    features: ["Soft Pull (Zero Score Impact)", "Free Monthly Updates", "Instant PDF Download"],
    turnaround: "Under 60 seconds",
    requiresPan: true,
    isFree: true,
    logoTheme: "purple",
  },
  {
    id: "paisabazaar-guide",
    name: "How to Download CIBIL Report (Step-by-Step)",
    provider: "Paisabazaar Knowledge Base",
    category: "guide",
    categoryLabel: "Guide & Walkthrough",
    badge: "Step-by-Step Guide",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    url: "https://www.paisabazaar.com/credit-score/how-to-download-your-cibil-report/?utm_source=chatgpt.com",
    displayUrl: "paisabazaar.com/how-to-download",
    tagline: "Complete walkthrough on registration, OTP, and unlocking password-protected PDFs.",
    description: "Detailed step-by-step instructions for borrowers and telecallers to pull reports, navigate authentication challenges, and resolve password issues on downloaded PDFs.",
    features: ["PDF Password Rules (DOB)", "OTP Troubleshooting", "Dispute Resolution Steps"],
    turnaround: "Read Guide (3 mins)",
    requiresPan: false,
    isFree: true,
    logoTheme: "amber",
  },
  {
    id: "experian-india",
    name: "Experian India Credit Services",
    provider: "Experian Credit Information Bureau",
    category: "official",
    categoryLabel: "Official Bureau",
    badge: "RBI Licensed Bureau",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    url: "https://www.experian.in/consumer/consumer-services/?utm_source=chatgpt.com",
    displayUrl: "experian.in/consumer-services",
    tagline: "Official consumer portal for Experian India credit history & risk ratings.",
    description: "Access your official credit score and detailed credit report from Experian India, one of the four RBI-authorized credit rating bureaus utilized across Indian retail banking.",
    features: ["Official Experian Bureau Score", "Detailed Account Breakdown", "Credit Risk Analytics"],
    turnaround: "Instant (2 mins)",
    requiresPan: true,
    isFree: true,
    logoTheme: "emerald",
  },
  {
    id: "crif-highmark",
    name: "CRIF High Mark Credit Bureau",
    provider: "CRIF High Mark India",
    category: "official",
    categoryLabel: "Official Bureau",
    badge: "MFI & NBFC Specialist",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    url: "https://www.crifhighmark.com/?utm_source=chatgpt.com",
    displayUrl: "crifhighmark.com",
    tagline: "Direct bureau portal specializing in NBFC, retail lending, and microfinance records.",
    description: "Official portal of CRIF High Mark, an RBI-licensed bureau heavily relied upon by top NBFCs, fintech lenders, and microfinance institutions across Tier 1 to Tier 4 cities.",
    features: ["Extensive NBFC / MFI Master", "Commercial & Retail CIR", "Direct Bureau Verification"],
    turnaround: "Instant Access",
    requiresPan: true,
    isFree: true,
    logoTheme: "emerald",
  },
  {
    id: "equifax-india",
    name: "Equifax India Credit Information",
    provider: "Equifax Credit Information Services",
    category: "official",
    categoryLabel: "Official Bureau",
    badge: "Global Bureau in India",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    url: "https://www.equifax.co.in/?utm_source=chatgpt.com",
    displayUrl: "equifax.co.in",
    tagline: "Global credit reporting bureau delivering institutional-grade borrower analytics.",
    description: "Request your official Equifax Credit Information Report (CIR). View overall credit score, credit utilization ratios, open inquiries, and historical payment performance.",
    features: ["Equifax Score (300-900)", "Full Account History", "RBI Authorized Bureau"],
    turnaround: "Instant Access",
    requiresPan: true,
    isFree: true,
    logoTheme: "emerald",
  },
];

export const CibilDownloadView: React.FC = () => {
  const [downloadSearch, setDownloadSearch] = useState<string>("");
  const [downloadCategory, setDownloadCategory] = useState<
    "all" | "official" | "partner" | "guide"
  >("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (url: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredDownloadLinks = BUREAU_DOWNLOAD_LINKS.filter((item) => {
    const matchesCategory =
      downloadCategory === "all" || item.category === downloadCategory;
    const q = downloadSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.provider.toLowerCase().includes(q) ||
      item.tagline.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.displayUrl.toLowerCase().includes(q) ||
      item.features.some((f) => f.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#163A2C] via-[#1B4333] to-[#143326] text-white p-5 sm:p-7 rounded-2xl shadow-sm border border-[#163A2C]/20 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#DCE8D7] text-[11px] font-bold uppercase tracking-wider mb-2.5 backdrop-blur-xs">
              <Download size={12} className="text-emerald-400" />
              <span>Official Bureau &amp; Partner Portals</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Download Verified Credit Bureau Reports
            </h2>
            <p className="text-xs sm:text-sm text-[#D1E0CE] mt-1.5 leading-relaxed">
              Direct official links to download customer credit reports from TransUnion CIBIL, Experian, CRIF High Mark, and Equifax. All consumer pulls are soft inquiries with zero credit score impact.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="bg-white/10 border border-white/15 rounded-xl px-3.5 py-2 text-xs backdrop-blur-xs">
              <div className="text-[10px] uppercase font-bold text-[#A8C5A4]">RBI Mandate</div>
              <div className="font-bold text-white text-sm">1 Free CIR / Year</div>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-xl px-3.5 py-2 text-xs backdrop-blur-xs">
              <div className="text-[10px] uppercase font-bold text-[#A8C5A4]">Soft Pull</div>
              <div className="font-bold text-white text-sm">0 Score Impact</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E3EBE0] shadow-2xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Portals", count: BUREAU_DOWNLOAD_LINKS.length },
            {
              id: "official",
              label: "Official Bureaus",
              count: BUREAU_DOWNLOAD_LINKS.filter((l) => l.category === "official").length,
            },
            {
              id: "partner",
              label: "Instant Checkers",
              count: BUREAU_DOWNLOAD_LINKS.filter((l) => l.category === "partner").length,
            },
            {
              id: "guide",
              label: "Download Guides",
              count: BUREAU_DOWNLOAD_LINKS.filter((l) => l.category === "guide").length,
            },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setDownloadCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${downloadCategory === cat.id
                  ? "bg-[#163A2C] text-white shadow-2xs"
                  : "bg-[#F3F6F1] text-[#576558] hover:bg-[#E7EFE4] hover:text-[#17241B]"
                }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px] sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#829283]"
          />
          <input
            type="text"
            placeholder="Search portal or bureau..."
            value={downloadSearch}
            onChange={(e) => setDownloadSearch(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#FAFBF9] border border-[#DCE4D9] rounded-xl outline-none focus:border-[#163A2C] focus:bg-white transition-all text-[#17241B] placeholder:text-[#9AA89A]"
          />
          {downloadSearch && (
            <button
              type="button"
              onClick={() => setDownloadSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#829283] hover:text-[#17241B] cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDownloadLinks.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-[#E3EBE0] p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#163A2C]/30 transition-all duration-200 group"
          >
            <div>
              {/* Top Bar Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
                <span className="text-[10px] font-bold text-[#829283] bg-[#F5F8F4] px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Clock size={10} />
                  <span>{item.turnaround}</span>
                </span>
              </div>

              {/* Institution / Portal Title */}
              <div className="flex items-start gap-3 mb-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.logoTheme === "emerald"
                      ? "bg-[#EBF4E9] text-[#163A2C]"
                      : item.logoTheme === "blue"
                        ? "bg-blue-50 text-blue-700"
                        : item.logoTheme === "purple"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                >
                  {item.category === "guide" ? (
                    <BookOpen size={20} />
                  ) : item.category === "partner" ? (
                    <Globe size={20} />
                  ) : (
                    <Building2 size={20} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[#17241B] group-hover:text-[#163A2C] transition-colors leading-snug">
                    {item.name}
                  </h3>
                  <div className="text-[11px] text-[#829283] truncate mt-0.5">
                    {item.provider}
                  </div>
                </div>
              </div>

              {/* Monospace Display URL */}
              <div className="bg-[#FAFBF9] border border-[#ECEFEA] px-2.5 py-1 rounded-lg text-[10.5px] font-mono text-[#4A574B] truncate mb-2.5 flex items-center justify-between gap-1">
                <span className="truncate">{item.displayUrl}</span>
                <ExternalLink size={10} className="text-[#829283] shrink-0" />
              </div>

              {/* Description */}
              <p className="text-xs text-[#576558] leading-relaxed mb-3">
                {item.description}
              </p>

              {/* Feature Chips */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {item.features.map((feat, fIdx) => (
                  <span
                    key={fIdx}
                    className="text-[10px] font-medium bg-[#F3F7F1] text-[#2C4837] px-2 py-0.5 rounded-md flex items-center gap-1"
                  >
                    <CheckCircle2 size={10} className="text-[#257853]" />
                    <span>{feat}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Card Action Buttons */}
            <div className="pt-3 border-t border-[#F0F4EE] flex items-center gap-2">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3.5 rounded-xl bg-[#163A2C] hover:bg-[#102B21] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer group-hover:shadow-sm"
              >
                <span className="text-white">{item.category === "guide" ? "Read Guide" : "Download Report"}</span>
                <ExternalLink size={12} />
              </a>

              <button
                type="button"
                onClick={() => handleCopyLink(item.url, item.id)}
                className="py-2 px-2.5 rounded-xl border border-[#DCE4D9] bg-white hover:bg-[#F3F7F2] text-[#576558] hover:text-[#163A2C] text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
                title="Copy direct portal link to clipboard"
              >
                {copiedId === item.id ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span className="text-[11px] text-emerald-700 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty Search State */}
      {filteredDownloadLinks.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E3EBE0] p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F3F6F1] text-[#829283] flex items-center justify-center mx-auto">
            <Search size={22} />
          </div>
          <h3 className="text-sm font-bold text-[#17241B]">No Portals Found</h3>
          <p className="text-xs text-[#576558] max-w-sm mx-auto">
            No credit report download portals match &ldquo;{downloadSearch}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setDownloadSearch("");
              setDownloadCategory("all");
            }}
            className="px-3.5 py-1.5 bg-[#163A2C] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Clear Search &amp; Filters
          </button>
        </div>
      )}

      {/* Operational Guidance & PDF Password Tips Accordion / Box */}
      <div className="bg-[#FAFBF9] rounded-2xl border border-[#E3EBE0] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#163A2C] border-b border-[#ECEFE9] pb-3">
          <ShieldCheck size={18} className="text-[#257853]" />
          <span>Credit Analyst &amp; Telecaller Operational Guidelines</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Tip 1: PDF Password Formats */}
          <div className="bg-white p-4 rounded-xl border border-[#E5EDE2] space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#17241B]">
              <Lock size={13} className="text-[#257853]" />
              <span>PDF Password Formats</span>
            </div>
            <p className="text-[#576558] leading-relaxed text-[11.5px]">
              Downloaded bureau PDFs are encrypted by default. Common unlock keys:
            </p>
            <ul className="list-disc list-inside text-[11px] text-[#4A574B] space-y-1 pl-1">
              <li>
                <strong className="text-[#17241B]">CIBIL:</strong> First 4 letters of First Name (lower) + DDMM (e.g. <code className="bg-[#EEF4EB] px-1 py-0.2 rounded font-mono">rohi1508</code>) or full DOB <code className="bg-[#EEF4EB] px-1 py-0.2 rounded font-mono">DDMMYYYY</code>.
              </li>
              <li>
                <strong className="text-[#17241B]">Experian:</strong> Full Date of Birth <code className="bg-[#EEF4EB] px-1 py-0.2 rounded font-mono">DDMMYYYY</code> (no spaces) or uppercase PAN.
              </li>
              <li>
                <strong className="text-[#17241B]">Equifax / CRIF:</strong> Date of Birth <code className="bg-[#EEF4EB] px-1 py-0.2 rounded font-mono">DDMMYYYY</code> or registered 10-digit mobile.
              </li>
            </ul>
          </div>

          {/* Tip 2: Soft Pull Guarantee */}
          <div className="bg-white p-4 rounded-xl border border-[#E5EDE2] space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#17241B]">
              <CheckCircle2 size={13} className="text-[#257853]" />
              <span>Soft Pull (Zero Score Impact)</span>
            </div>
            <p className="text-[#576558] leading-relaxed text-[11.5px]">
              When a borrower pulls their own credit report through these links, bureaus classify it as a <strong>Self-Enquiry (Soft Pull)</strong>.
            </p>
            <div className="bg-[#EBF3E8] p-2.5 rounded-lg border border-[#D5E4D2] text-[11px] text-[#163A2C] font-medium leading-relaxed">
              ✓ It does NOT leave an adverse enquiry mark.
              <br />
              ✓ Score does NOT drop even by 1 point.
              <br />
              ✓ Safe to check monthly before loan application.
            </div>
          </div>

          {/* Tip 3: RBI Annual Free Report Mandate */}
          <div className="bg-white p-4 rounded-xl border border-[#E5EDE2] space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#17241B]">
              <Info size={13} className="text-[#257853]" />
              <span>RBI Free Report Mandate</span>
            </div>
            <p className="text-[#576558] leading-relaxed text-[11.5px]">
              Under RBI circular DBR.No.CID.BC.60/20.16.056/2016-17, all 4 licensed credit information companies in India must provide one full Credit Information Report (CIR) free per calendar year.
            </p>
            <div className="text-[11px] text-[#576558] pt-1 border-t border-[#ECEFE9]">
              Borrowers only need their <strong>PAN card</strong> and <strong>mobile number</strong> linked to Aadhaar/Bank for OTP verification.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
