"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  GraduationCap,
  Volume2,
  VolumeX,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Check,
  Shield,
  Home,
  User,
  Briefcase,
  Scale,
  Building2,
  Landmark,
  MapPin,
  Laptop,
  Coins,
  Users,
  Megaphone,
  FileEdit,
  AlertTriangle,
  Award,
  Layers,
  Sparkles,
  ArrowRight,
  Headphones,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  FileText,
  BadgePercent,
  CreditCard,
  PhoneCall,
  LayoutGrid,
  Play,
  Share2,
  Handshake,
  Globe,
  Timer,
  Zap,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { speakText, stopSpeaking, playChime } from "@/lib/audioAssist";

interface TrainingSlide {
  id: number;
  stepLabel: string;
  title: string;
  subtitle: string;
  quote: string;
  icon: React.ReactNode;
}

export const TRAINING_SLIDES: TrainingSlide[] = [
  {
    id: 1,
    stepLabel: "STEP 1 OF 16",
    title: "Welcome to Fast Credit",
    subtitle: "Your gateway to becoming a Top Performing Telecaller Executive.",
    quote:
      '"Welcome to Fast Credit New Caller Training Program! Here you will learn how to speak with customers, pitch loan products, and earn maximum incentive. Click Next Step to proceed."',
    icon: <Users className="text-blue-500" size={24} />,
  },
  {
    id: 2,
    stepLabel: "STEP 2 OF 16",
    title: "Type of Category",
    subtitle: "Unsecured vs Secured Loans Differentiation",
    quote:
      '"Loans are categorized into two types: Unsecured Loans where no collateral is required, and Secured Loans where property or assets are mortgaged."',
    icon: <Layers className="text-blue-500" size={24} />,
  },
  {
    id: 3,
    stepLabel: "STEP 3 OF 16",
    title: "Unsecured Loan Type",
    subtitle: "Personal, Business & Flexi Overdraft Details",
    quote:
      '"Under Unsecured loans, Fast Credit specializes in three main products: Personal Loans, Business Loans, and Flexi Overdraft facilities."',
    icon: <Landmark className="text-blue-500" size={24} />,
  },
  {
    id: 4,
    stepLabel: "STEP 4 OF 16",
    title: "Personal Loan Details",
    subtitle: "Eligibility, Amount, Interest Rates & Tenure",
    quote:
      '"Personal Loans offer amounts from 1 Lakh to 1 Crore with ROI starting from 9.95% to 16% annually. Minimum salary required is 25,000."',
    icon: <CreditCard className="text-blue-500" size={24} />,
  },
  {
    id: 5,
    stepLabel: "STEP 5 OF 16",
    title: "Company Categories",
    subtitle: "Category A, B, C, D & Unlisted Classifications",
    quote:
      '"Companies are classified into Category A, B, C, D, and Unlisted. Category A enjoys the lowest interest rates and highest loan limits, while Cat D and Unlisted require detailed banking checks."',
    icon: <Building2 className="text-blue-500" size={24} />,
  },
  {
    id: 6,
    stepLabel: "STEP 6 OF 16",
    title: "All Types of Companies",
    subtitle: "Pvt Ltd, Public, Partnership, LLP & Proprietorship",
    quote:
      '"We process loan applications for employees working in all company structures including Private Limited, Public Limited, Proprietorship and LLPs."',
    icon: <Building2 className="text-blue-500" size={24} />,
  },
  {
    id: 7,
    stepLabel: "STEP 7 OF 16",
    title: "40+ Banks & NBFCs",
    subtitle: "Tie-ups with leading Indian Banks and NBFCs",
    quote:
      '"Fast Credit has tie-ups with over 40 plus leading Banks and NBFCs like Bajaj Finance, HDFC, ICICI, Tata Capital, and Axis Bank."',
    icon: <Landmark className="text-blue-500" size={24} />,
  },
  {
    id: 8,
    stepLabel: "STEP 8 OF 16",
    title: "Pan India Funding",
    subtitle: "Servicing Customers Across All Indian States & Cities",
    quote:
      '"Fast Credit provides loan disbursal pan India! No matter where your customer is located, digital verification enables instant loan sanction."',
    icon: <MapPin className="text-blue-500" size={24} />,
  },
  {
    id: 9,
    stepLabel: "STEP 9 OF 16",
    title: "4th Grade Employed",
    subtitle: "Loan Eligibility for Support & Service Staff",
    quote:
      '"Special loan schemes are available for 4th Grade Employed personnel having official salary slips and active bank accounts."',
    icon: <User className="text-blue-500" size={24} />,
  },
  {
    id: 10,
    stepLabel: "STEP 10 OF 16",
    title: "All Banks Digital Login",
    subtitle: "Paperless Online Disbursal in 30 Minutes",
    quote:
      '"Our proprietary portal allows digital login across all banks under 30 minutes with zero manual paperwork required."',
    icon: <Laptop className="text-blue-500" size={24} />,
  },
  {
    id: 11,
    stepLabel: "STEP 11 OF 16",
    title: "Earning & Incentive",
    subtitle: "High Payouts, Daily Incentives & Career Growth",
    quote:
      '"Earn attractive monthly fixed salary plus unlimited incentives on every loan disbursal! Top callers earn over 50 thousand rupees monthly."',
    icon: <Coins className="text-blue-500" size={24} />,
  },
  {
    id: 12,
    stepLabel: "STEP 12 OF 16",
    title: "Process Manager Support",
    subtitle: "Dedicated Support Desk to Help You Close Deals",
    quote:
      '"You are never alone! Dedicated Process Manager Arjun Grewal is always available to assist you."',
    icon: <Users className="text-blue-500" size={24} />,
  },
  {
    id: 13,
    stepLabel: "STEP 13 OF 16",
    title: "Join & Earn",
    subtitle: "Simple 3 Step Onboarding Process",
    quote:
      '"Complete this training module, clear the quick quiz, and start calling live leads to earn your first incentive today!"',
    icon: <Megaphone className="text-blue-500" size={24} />,
  },
  {
    id: 14,
    stepLabel: "STEP 14 OF 16",
    title: "Sample Calling Script",
    subtitle: "Greeting, Customer Need, Pitching & Closing",
    quote:
      '"Always follow the 4-step script: Polite Greeting, Understanding Need, Presenting Loan Offer, and Collecting Docs on WhatsApp."',
    icon: <FileEdit className="text-blue-500" size={24} />,
  },
  {
    id: 15,
    stepLabel: "STEP 15 OF 16",
    title: "Do's & Don'ts",
    subtitle: "Telecaller Guidelines for Professional Calling",
    quote:
      '"Do speak politely and give accurate loan rates. Don\'t demand cash processing fees or misguide the customer under any circumstance."',
    icon: <AlertTriangle className="text-blue-500" size={24} />,
  },
  {
    id: 16,
    stepLabel: "STEP 16 OF 16",
    title: "Thank You",
    subtitle: "You have completed Fast Credit New Caller Training!",
    quote:
      '"Congratulations! You have completed all 16 training slides. Click below to start live calling or practice your script."',
    icon: <Trophy className="text-blue-500" size={24} />,
  },
];

export const TrainingView: React.FC = () => {
  const {
    activeTab,
    trainingStep,
    setTrainingStep,
    trainingViewMode,
    setTrainingViewMode,
    audioAssistEnabled,
    setAudioAssistEnabled,
    isSpeaking,
    setIsSpeaking,
    autoAdvance,
    setAutoAdvance,
    completedModules,
    markModuleCompleted,
    setScriptModalOpen,
  } = useWorkspaceStore();

  const [animatingKey, setAnimatingKey] = useState<number>(0);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = TRAINING_SLIDES[trainingStep - 1] || TRAINING_SLIDES[0];

  // Sync activeTab URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (useWorkspaceStore.getState().activeTab !== "training") return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "training");
      url.searchParams.set("step", String(trainingStep));
      window.history.replaceState(null, "", url.toString());
    } catch {}
  }, [trainingStep]);

  // Handle Speech Narration
  const speakCurrentSlide = useCallback(() => {
    if (!audioAssistEnabled || activeTab !== "training" || trainingViewMode !== "player") {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    speakText(currentSlide.quote, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        if (autoAdvance && trainingStep < 16) {
          if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
          autoAdvanceTimeoutRef.current = setTimeout(() => {
            handleNext();
          }, 1500);
        }
      },
      onError: () => setIsSpeaking(false),
    });
  }, [audioAssistEnabled, activeTab, trainingViewMode, currentSlide.quote, autoAdvance, trainingStep]);

  // Trigger speech on step change or view change
  useEffect(() => {
    if (activeTab === "training" && trainingViewMode === "player") {
      markModuleCompleted(trainingStep);
      speakCurrentSlide();
    } else {
      stopSpeaking();
      setIsSpeaking(false);
    }

    return () => {
      stopSpeaking();
      if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    };
  }, [trainingStep, activeTab, trainingViewMode, audioAssistEnabled, speakCurrentSlide, markModuleCompleted, setIsSpeaking]);

  const scrollToTop = (smooth = true) => {
    const appMain = document.querySelector(".app-main");
    if (appMain) {
      appMain.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
    }
  };

  const handleNext = () => {
    if (trainingStep < 16) {
      playChime(660);
      setTrainingStep(trainingStep + 1);
      setAnimatingKey((prev) => prev + 1);
      scrollToTop(true);
    } else {
      markModuleCompleted(16);
      playChime(880);
      setScriptModalOpen(true);
    }
  };

  const handlePrevious = () => {
    if (trainingStep > 1) {
      playChime(520);
      setTrainingStep(trainingStep - 1);
      setAnimatingKey((prev) => prev + 1);
      scrollToTop(true);
    }
  };

  const handleReplay = () => {
    playChime(587.33);
    setAnimatingKey((prev) => prev + 1);
    speakCurrentSlide();
    scrollToTop(true);
  };

  const handleSelectModuleFromIndex = (moduleId: number) => {
    playChime(600);
    setTrainingStep(moduleId);
    setAnimatingKey((prev) => prev + 1);
    // User must be scrolled to the very top
    scrollToTop(true);
  };

  // Render Visual Canvas based on Slide Number
  const renderSlideCanvas = () => {
    switch (trainingStep) {
      case 1:
        // Welcome to Fast Credit (Image 2)
        return (
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-6 px-4 sm:px-8">
            <div className="flex-1 space-y-4">
              <span className="inline-block px-3 py-1 bg-[#FBBF24] text-[#1E293B] font-extrabold text-[11px] rounded-full uppercase tracking-wider shadow-sm">
                MODULE #1
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Welcome to Fast Credit
              </h1>
              <p className="text-slate-300 text-sm sm:text-base font-normal max-w-lg leading-relaxed">
                Your gateway to becoming a Top Performing Telecaller Executive.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <Check size={14} className="stroke-[3]" />
                  <span>100% Digital Process</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                  <Check size={14} className="stroke-[3]" />
                  <span>Daily Incentives</span>
                </div>
              </div>
            </div>

            {/* Glowing Trainer Persona Avatar (Image 2) */}
            <div className="relative shrink-0 flex flex-col items-center justify-center">
              <div
                className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1.5 flex items-center justify-center transition-all duration-300 ${
                  isSpeaking
                    ? "bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 shadow-[0_0_40px_rgba(245,158,11,0.5)] scale-105"
                    : "bg-gradient-to-tr from-orange-500 to-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]"
                }`}
              >
                <div className="w-full h-full rounded-full bg-[#0F172A] flex flex-col items-center justify-center p-4 border border-amber-400/30">
                  <Headphones size={44} className="text-[#FBBF24] mb-2 animate-bounce-subtle" />
                  <span className="text-[10px] font-extrabold tracking-widest text-slate-200 uppercase text-center">
                    TRAINER PERSONA
                  </span>
                  {isSpeaking && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="w-1 h-3 bg-amber-400 rounded-full animate-pulse" />
                      <span className="w-1 h-5 bg-orange-400 rounded-full animate-pulse delay-75" />
                      <span className="w-1 h-2 bg-yellow-400 rounded-full animate-pulse delay-150" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        // Type of Category: Unsecured vs Secured (Image 3)
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4 px-2 sm:px-6">
            {/* UNSECURED (Blue card) */}
            <div className="rounded-2xl p-6 bg-gradient-to-b from-[#1D4ED8] to-[#1E3A8A] text-white shadow-xl border border-blue-400/20 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <Shield size={24} className="text-amber-400 fill-amber-400" />
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-1">UNSECURED</h2>
              <div className="text-xs text-blue-200 font-medium mb-4">(No Collateral Required)</div>
              <div className="w-full bg-black/15 rounded-xl p-4 text-left space-y-2 border border-white/10 text-sm">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-400 stroke-[3]" />
                  <span>Personal Loan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-400 stroke-[3]" />
                  <span>Business Loan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-400 stroke-[3]" />
                  <span>Flexi Overdraft</span>
                </div>
              </div>
            </div>

            {/* SECURED (Green card) */}
            <div className="rounded-2xl p-6 bg-gradient-to-b from-[#059669] to-[#064E3B] text-white shadow-xl border border-emerald-400/20 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <Home size={24} className="text-amber-400 fill-amber-400" />
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-1">SECURED</h2>
              <div className="text-xs text-emerald-200 font-medium mb-4">(Collateral Required)</div>
              <div className="w-full bg-black/15 rounded-xl p-4 text-left space-y-2 border border-white/10 text-sm">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-amber-400 stroke-[3]" />
                  <span>Home Loan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-amber-400 stroke-[3]" />
                  <span>Loan Against Property</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-amber-400 stroke-[3]" />
                  <span>Vehicle Loan</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        // Unsecured Loan Type: 3 Cards (Image 4)
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 px-2 sm:px-4">
            {/* PERSONAL LOAN (Purple) */}
            <div className="rounded-2xl p-5 bg-gradient-to-b from-[#7C3AED] to-[#5B21B6] text-white shadow-lg border border-purple-400/20 flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center mb-3">
                <User size={22} className="text-white" />
              </div>
              <h3 className="text-base font-bold tracking-tight mb-2">PERSONAL LOAN</h3>
              <p className="text-xs text-purple-100 font-normal leading-relaxed">
                For salaried individuals with minimum salary ₹25,000
              </p>
            </div>

            {/* BUSINESS LOAN (Blue) */}
            <div className="rounded-2xl p-5 bg-gradient-to-b from-[#2563EB] to-[#1E40AF] text-white shadow-lg border border-blue-400/20 flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center mb-3">
                <Briefcase size={22} className="text-white" />
              </div>
              <h3 className="text-base font-bold tracking-tight mb-2">BUSINESS LOAN</h3>
              <p className="text-xs text-blue-100 font-normal leading-relaxed">
                For self-employed &amp; company owners with GST/ITR
              </p>
            </div>

            {/* FLEXI OVERDRAFT (Amber/Brown) */}
            <div className="rounded-2xl p-5 bg-gradient-to-b from-[#D97706] to-[#92400E] text-white shadow-lg border border-amber-400/20 flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center mb-3">
                <Scale size={22} className="text-white" />
              </div>
              <h3 className="text-base font-bold tracking-tight mb-2">FLEXI OVERDRAFT</h3>
              <p className="text-xs text-amber-100 font-normal leading-relaxed">
                Pay interest only on the amount utilized by customer
              </p>
            </div>
          </div>
        );

      case 4:
        // Personal Loan Details (Image 5)
        return (
          <div className="flex flex-col items-center py-4 px-2 sm:px-6">
            <span className="px-3 py-1 bg-red-600 text-white font-extrabold text-[11px] rounded-full uppercase tracking-wider mb-2">
              PRODUCT SPECIFICATION
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight mb-5 text-center">
              PERSONAL LOAN ELIGIBILITY
            </h2>

            <div className="w-full max-w-xl bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <div className="flex items-center gap-3">
                  <span className="text-red-400 font-bold text-lg">₹</span>
                  <span className="text-sm font-medium text-slate-300">Loan Amount:</span>
                </div>
                <span className="text-sm sm:text-base font-bold text-amber-300">₹ 1 Lakh to ₹ 1 Crore</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold text-lg">%</span>
                  <span className="text-sm font-medium text-slate-300">ROI (Interest Rate):</span>
                </div>
                <span className="text-sm sm:text-base font-bold text-emerald-400">9.95% to 16% p.a.</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <div className="flex items-center gap-3">
                  <Coins size={18} className="text-amber-400" />
                  <span className="text-sm font-medium text-slate-300">Min. Salary:</span>
                </div>
                <span className="text-sm sm:text-base font-bold text-white">₹ 25,000 / month</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-purple-400" />
                  <span className="text-sm font-medium text-slate-300">Tenure Period:</span>
                </div>
                <span className="text-sm sm:text-base font-bold text-slate-200">1 Year to 8 Years</span>
              </div>
            </div>
          </div>
        );

      case 5:
        // Company Categories
        return (
          <div className="py-4 px-2 sm:px-6">
            <div className="text-center mb-5">
              <span className="px-3 py-1 bg-blue-600 text-white font-extrabold text-[11px] rounded-full uppercase tracking-wider">
                COMPANY CLASSIFICATION
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">
                Company Tiers &amp; Eligibility Rates
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-emerald-500/30">
                <div className="text-xs font-bold text-emerald-400 mb-1">CAT A (SUPER PRIME)</div>
                <div className="text-sm font-bold text-white mb-2">TCS, Infosys, Reliance, MNCs</div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>ROI: <span className="font-semibold text-emerald-300">10.25% - 11.5%</span></div>
                  <div>Max Loan: <span className="font-semibold text-white">₹ 50 Lakhs</span></div>
                  <div>FOIR: <span className="font-semibold text-white">Up to 70%</span></div>
                </div>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-blue-500/30">
                <div className="text-xs font-bold text-blue-400 mb-1">CAT B (PRIME)</div>
                <div className="text-sm font-bold text-white mb-2">Reputed Listed &amp; Mid Corporates</div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>ROI: <span className="font-semibold text-blue-300">10.75% - 12.5%</span></div>
                  <div>Max Loan: <span className="font-semibold text-white">₹ 35 Lakhs</span></div>
                  <div>FOIR: <span className="font-semibold text-white">Up to 65%</span></div>
                </div>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-amber-500/30">
                <div className="text-xs font-bold text-amber-400 mb-1">CAT C (GROWTH)</div>
                <div className="text-sm font-bold text-white mb-2">Pvt Ltd with 100+ Staff</div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>ROI: <span className="font-semibold text-amber-300">12.0% - 14.5%</span></div>
                  <div>Max Loan: <span className="font-semibold text-white">₹ 25 Lakhs</span></div>
                  <div>FOIR: <span className="font-semibold text-white">Up to 60%</span></div>
                </div>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-red-500/30">
                <div className="text-xs font-bold text-red-400 mb-1">CAT D &amp; UNLISTED</div>
                <div className="text-sm font-bold text-white mb-2">LLPs, Partnerships, Small Firms</div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>ROI: <span className="font-semibold text-red-300">14.0% - 17.5%</span></div>
                  <div>Max Loan: <span className="font-semibold text-white">₹ 15 Lakhs</span></div>
                  <div>Banking: <span className="font-semibold text-white">Strict Verify</span></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        // All Types of Companies (Screenshot 1)
        return (
          <div className="py-4 px-2 sm:px-6 flex justify-center">
            <div className="w-full max-w-xl bg-[#131B2E] border border-slate-700/60 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg sm:text-xl font-bold text-[#FBBF24] text-center mb-5">
                We Process All Types of Companies
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="p-3 bg-[#0B132B]/80 border border-slate-700/60 rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 fill-emerald-400/20 shrink-0" />
                  <span className="text-sm font-semibold text-white">Private Limited</span>
                </div>
                <div className="p-3 bg-[#0B132B]/80 border border-slate-700/60 rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 fill-emerald-400/20 shrink-0" />
                  <span className="text-sm font-semibold text-white">Public Limited</span>
                </div>
                <div className="p-3 bg-[#0B132B]/80 border border-slate-700/60 rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 fill-emerald-400/20 shrink-0" />
                  <span className="text-sm font-semibold text-white">Partnership Firm</span>
                </div>
                <div className="p-3 bg-[#0B132B]/80 border border-slate-700/60 rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 fill-emerald-400/20 shrink-0" />
                  <span className="text-sm font-semibold text-white">Proprietorship</span>
                </div>
              </div>
              <div className="p-3 bg-[#0B132B]/80 border border-slate-700/60 rounded-xl flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 fill-emerald-400/20 shrink-0" />
                <span className="text-sm font-semibold text-white">LLP (Limited Liability Partnership) &amp; More...</span>
              </div>
            </div>
          </div>
        );

      case 7:
        // 40+ Banks & NBFCs (Screenshot 2)
        return (
          <div className="py-4 px-2 sm:px-6 flex flex-col items-center">
            {/* Top Badge: OUR BANKING PARTNERS */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#DC2626] text-white text-xs font-extrabold uppercase tracking-wider mb-4 shadow-sm">
              <Handshake size={14} className="stroke-[2.5]" />
              <span>OUR BANKING PARTNERS</span>
            </div>

            {/* Central Card */}
            <div className="w-full max-w-2xl bg-[#131B2E] border border-slate-700/60 rounded-2xl p-6 sm:p-8 text-center shadow-xl">
              <h2 className="text-3xl sm:text-4xl font-black text-[#FBBF24] tracking-tight mb-2">
                40+ Banks &amp; NBFCs
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-normal mb-6">
                Get multi-bank options to ensure 100% loan approval guarantee for your customers.
              </p>

              {/* White Bank Pill Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {[
                  "HDFC Bank",
                  "ICICI Bank",
                  "Bajaj Finserv",
                  "Tata Capital",
                  "Axis Bank",
                  "L&T Finance",
                  "Aditya Birla",
                ].map((bank, i) => (
                  <span
                    key={i}
                    className="px-3.5 py-1.5 bg-white text-slate-900 font-bold text-xs sm:text-[13px] rounded-lg shadow-sm border border-slate-100 hover:scale-105 transition-transform"
                  >
                    {bank}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 8:
        // Pan India Funding (Screenshot 3)
        return (
          <div className="py-6 px-4 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">
            {/* Left Content */}
            <div className="flex-1 space-y-3">
              <span className="inline-block px-3 py-1 bg-[#EA580C] text-white font-extrabold text-[11px] rounded-full uppercase tracking-wider shadow-sm">
                NATIONWIDE COVERAGE
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#FBBF24] tracking-tight leading-tight">
                PAN INDIA FUNDING
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm font-normal">
                From Metro cities to Tier-2 &amp; Tier-3 towns across India.
              </p>

              <div className="bg-[#0B132B]/90 border border-slate-700/60 rounded-xl p-3.5 space-y-2 max-w-md">
                <div className="flex items-center gap-2.5 text-xs sm:text-[13px] font-medium text-slate-200">
                  <MapPin size={15} className="text-amber-400 shrink-0 fill-amber-400/20" />
                  <span>Delhi NCR, Mumbai, Bangalore, Hyderabad</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-[13px] font-medium text-slate-200">
                  <MapPin size={15} className="text-amber-400 shrink-0 fill-amber-400/20" />
                  <span>Pune, Kolkata, Ahmedabad, Jaipur &amp; All States</span>
                </div>
              </div>
            </div>

            {/* Right Globe Graphic */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 p-1 flex items-center justify-center shadow-[0_0_40px_rgba(234,88,12,0.4)]">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center">
                  <Globe size={64} className="text-white/95 stroke-[1.8]" />
                </div>
              </div>
            </div>
          </div>
        );

      case 9:
        // 4th Grade Employed (Screenshot 4)
        return (
          <div className="py-4 px-2 sm:px-6 flex justify-center">
            <div className="w-full max-w-xl bg-[#131B2E] border border-slate-700/60 rounded-2xl p-6 sm:p-8 text-center shadow-xl">
              {/* Top Avatar Icon */}
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Users size={24} className="text-emerald-400" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#FBBF24] tracking-tight mb-2">
                4th Grade Employee Loans
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto mb-5 font-normal">
                Drivers, Security Staff, Office Assistants &amp; Skilled Workers with monthly salary in bank account are eligible for quick loan disbursement.
              </p>

              {/* Special NBFC Approval Rate banner */}
              <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B132B] border border-emerald-500/30 text-emerald-400 font-bold text-xs sm:text-sm shadow-sm">
                <Zap size={15} className="fill-emerald-400 text-emerald-400" />
                <span>Special NBFC Approval Rate: 95%</span>
              </div>
            </div>
          </div>
        );

      case 10:
        // All Banks Digital Login (Screenshot 5)
        return (
          <div className="py-4 px-2 sm:px-6 flex justify-center">
            <div className="w-full max-w-xl bg-gradient-to-b from-[#1E254A] to-[#161B3D] border border-indigo-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
              {/* Stopwatch icon */}
              <div className="flex justify-center mb-3">
                <Timer size={44} className="text-[#FBBF24]" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
                ALL BANKS DIGITAL LOGIN
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 font-normal mb-5">
                Fastest Turnaround Time in Telecalling Industry
              </p>

              {/* Green Pill Action Banner */}
              <div className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-[#10B981] hover:bg-[#059669] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-transform">
                <Zap size={15} className="fill-slate-950 text-slate-950" />
                <span>LOGIN IN UNDER 30 MINS</span>
              </div>
            </div>
          </div>
        );

      case 11:
        // Earning & Incentive (Screenshot 1)
        return (
          <div className="py-6 px-4 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">
            {/* Left Content */}
            <div className="flex-1 space-y-3">
              <span className="inline-block px-3.5 py-1 bg-emerald-500/20 text-[#10B981] font-extrabold text-[11px] rounded-full uppercase tracking-wider">
                UNLIMITED PAYOUT
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#FBBF24] tracking-tight leading-tight">
                EARN UNLIMITED INCENTIVE
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm font-normal max-w-sm leading-relaxed">
                No upper cap on incentives. The more calls &amp; approvals you make, the higher you earn!
              </p>
            </div>

            {/* Right Top Caller Bonus Card */}
            <div className="shrink-0 bg-[#0B2527]/90 border border-emerald-500/40 rounded-2xl p-6 sm:p-7 text-center shadow-lg min-w-[220px]">
              <div className="flex justify-center mb-2">
                <TrendingUp size={44} className="text-[#FBBF24] stroke-[2.5]" />
              </div>
              <div className="text-white font-bold text-sm sm:text-base mb-1">
                Top Caller Bonus
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#10B981] tracking-tight">
                ₹50,000+ / Mo
              </div>
            </div>
          </div>
        );

      case 12:
        // Process Manager Support (User details from Contact Us)
        return (
          <div className="py-4 px-2 sm:px-6 flex justify-center">
            <div className="w-full max-w-xl bg-[#131B2E] border border-slate-700/60 rounded-2xl p-6 sm:p-8 text-center shadow-xl">
              {/* Headset in dark red circle */}
              <div className="w-14 h-14 rounded-full bg-[#3B1219] border border-red-500/40 text-red-500 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Headphones size={28} className="text-red-500 stroke-[2.2]" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#FBBF24] tracking-tight mb-2">
                BIG SUPPORT BY PROCESS MANAGER
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 mb-2 font-normal">
                Dedicated Contact: <span className="font-bold text-white">Arjun Grewal (+91 99685 84137)</span>
              </p>

              <p className="text-xs text-slate-300 leading-relaxed font-normal max-w-md mx-auto">
                Stuck on a customer query? Request immediate manager call takeover or joint conference for guaranteed lead conversion!
              </p>
            </div>
          </div>
        );

      case 13:
        // Join & Earn (Screenshot 3)
        return (
          <div className="py-4 px-2 sm:px-6 max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-[#FBBF24] tracking-tight text-center mb-6">
              3 STEPS TO START EARNING
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Step 1 */}
              <div className="bg-[#131B2E] border border-slate-700/60 rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-md">
                <div className="w-7 h-7 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-3 shadow-sm">
                  1
                </div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  Complete Training
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-[#131B2E] border border-slate-700/60 rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-md">
                <div className="w-7 h-7 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-3 shadow-sm">
                  2
                </div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  Practice Script
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#131B2E] border border-slate-700/60 rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-md">
                <div className="w-7 h-7 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-3 shadow-sm">
                  3
                </div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  Start Calling &amp; Earn
                </div>
              </div>
            </div>
          </div>
        );

      case 14:
        // Sample Calling Script (Screenshot 4)
        return (
          <div className="py-4 px-2 sm:px-6 flex justify-center">
            <div className="w-full max-w-xl bg-[#131B2E] border border-slate-700/60 rounded-2xl p-5 sm:p-6 shadow-xl">
              {/* Header row with Open Full Script button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs sm:text-sm font-black text-[#F59E0B] tracking-wider uppercase">
                  TELECALLER CALL FLOW SCRIPT
                </span>
                <button
                  type="button"
                  onClick={() => setScriptModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  Open Full Script
                </button>
              </div>

              {/* Steps */}
              <div className="space-y-3 mt-4 text-xs sm:text-[13px] leading-relaxed">
                <div>
                  <span className="text-emerald-400 font-bold">Step 1: </span>
                  <span className="text-slate-200 font-medium">&quot;Namaste Sir, Fast Credit se [Name] baat kar raha hu.&quot;</span>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">Step 2: </span>
                  <span className="text-slate-200 font-medium">&quot;Aapko Pre-approved Personal Loan offer mil rha h.&quot;</span>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">Step 3: </span>
                  <span className="text-slate-200 font-medium">&quot;Lowest interest rate 9.95% se shuru hai.&quot;</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 15:
        // Do's & Don'ts (Screenshot 5)
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 px-2 sm:px-6 max-w-3xl mx-auto">
            {/* DO'S (Follow Strictly) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#06241D]/90 border border-emerald-500/40 text-xs sm:text-sm text-slate-200 flex flex-col justify-between shadow-lg">
              <div className="font-bold text-emerald-400 text-sm sm:text-base flex items-center gap-2 mb-3.5">
                <CheckCircle2 size={18} className="text-emerald-400 fill-emerald-400/20" />
                <span>DO&apos;S (Follow Strictly)</span>
              </div>
              <ul className="space-y-2 list-none p-0 m-0">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Always greet customer politely</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Verify customer monthly salary</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Explain ROI &amp; tenure clearly</span>
                </li>
              </ul>
            </div>

            {/* DON'TS (Strictly Prohibited) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#2A0E13]/90 border border-rose-500/40 text-xs sm:text-sm text-slate-200 flex flex-col justify-between shadow-lg">
              <div className="font-bold text-rose-400 text-sm sm:text-base flex items-center gap-2 mb-3.5">
                <XCircle size={18} className="text-rose-400 fill-rose-400/20" />
                <span>DON&apos;TS (Strictly Prohibited)</span>
              </div>
              <ul className="space-y-2 list-none p-0 m-0">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Never ask for cash upfront fee</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Don&apos;t argue with customers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Don&apos;t share false interest rates</span>
                </li>
              </ul>
            </div>
          </div>
        );

      case 16:
        // Congratulations / Thank You (Screenshot 1)
        return (
          <div className="flex flex-col items-center justify-center text-center py-6 px-4">
            <div className="w-16 h-16 rounded-full bg-[#FBBF24] text-slate-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Trophy size={36} className="text-slate-900 fill-slate-900" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#FBBF24] tracking-tight mb-2">
              CONGRATULATIONS!
            </h2>

            <p className="text-xs sm:text-sm text-slate-200 max-w-md mb-5 leading-relaxed font-normal">
              You have completed Fast Credit New Caller Training!
            </p>

            <button
              type="button"
              onClick={() => {
                playChime(440);
                setTrainingStep(1);
                setAnimatingKey((k) => k + 1);
                scrollToTop(true);
              }}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-white text-red-600 font-bold text-xs shadow-md border border-red-200 hover:bg-red-50 hover:scale-105 active:scale-[0.98] transition-all cursor-pointer"
            >
              <RotateCcw size={14} className="text-red-600 stroke-[2.5]" />
              <span>Restart Training</span>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const scrollToIndex = () => {
    playChime(550);
    const indexEl = document.getElementById("training-slides-index");
    if (indexEl) {
      indexEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToPlayer = () => {
    playChime(620);
    scrollToTop(true);
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-[#E4ECE1] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#17241B] leading-tight">
              Telecaller Training Program
            </h1>
            <p className="text-xs text-[#6A7B6C]">
              16 interactive voice-guided learning modules with realistic trainer audio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={scrollToIndex}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F0F4EE] text-[#576558] hover:bg-[#E3EDE0] hover:text-[#17241B] transition-all cursor-pointer"
          >
            <LayoutGrid size={14} />
            <span>Modules Index (16)</span>
          </button>

          <button
            type="button"
            onClick={scrollToPlayer}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#163A2C] text-white shadow-2xs transition-all cursor-pointer"
          >
            <Play size={14} />
            <span>Slide Player ({trainingStep}/16)</span>
          </button>
        </div>
      </div>

      {/* ===================== 1. INTERACTIVE SLIDE PLAYER (SCREENSHOTS 1-16) ===================== */}
      <div id="training-slide-player" className="space-y-3 scroll-mt-6">
        {/* Main Dark Theme Canvas (Deep Navy Blue matching screenshots) */}
        <div className="bg-[#0F172A] rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col justify-between min-h-[460px] relative">
          {/* Slide Header Bar */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-[#0B132B]/60">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0" />
              <span className="px-2.5 py-1 bg-red-600 text-white font-extrabold text-[10.5px] sm:text-[11px] rounded-md tracking-wider uppercase shrink-0">
                {currentSlide.stepLabel}
              </span>
              <span className="text-sm sm:text-base font-bold text-white truncate">
                {currentSlide.title}
              </span>
            </div>

            {/* Status Pill matching screenshots */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  !audioAssistEnabled
                    ? "bg-slate-800 text-slate-400 border border-slate-700"
                    : isSpeaking
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {!audioAssistEnabled ? (
                  <>
                    <VolumeX size={13} className="text-slate-400" />
                    <span>Audio Muted</span>
                  </>
                ) : isSpeaking ? (
                  <>
                    <Volume2 size={13} className="text-emerald-400 animate-pulse" />
                    <span>Trainer Speaking...</span>
                  </>
                ) : (
                  <>
                    <Headphones size={13} className="text-slate-400" />
                    <span>Trainer Ready</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Interactive Slide Visual Canvas */}
          <div key={animatingKey} className="flex-1 flex flex-col justify-center py-4 animate-fade-in">
            {renderSlideCanvas()}
          </div>

          {/* Voice Quote Banner (Dark container with red speaker icon matching screenshots) */}
          <div className="px-3 sm:px-6 pb-4">
            <div
              onClick={speakCurrentSlide}
              className="rounded-xl p-3.5 sm:p-4 bg-[#131B2E] border border-slate-800/80 flex items-start sm:items-center gap-3 cursor-pointer hover:border-amber-500/40 transition-colors shadow-inner group"
              title="Click to replay realistic trainer voice"
            >
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform cursor-pointer"
                aria-label="Replay voice narration"
              >
                <Volume2 size={16} />
              </button>
              <p className="text-xs sm:text-[13.5px] font-medium text-[#FDE047] leading-relaxed">
                {currentSlide.quote}
              </p>
            </div>
          </div>

          {/* Red Slide Progress Indicator Line */}
          <div className="w-full h-1 bg-slate-800 relative">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${(trainingStep / 16) * 100}%` }}
            />
          </div>
        </div>

        {/* Bottom Controls Bar (Matching screenshots exactly) */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left Controls: Replay Animation & Auto-Advance */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={handleReplay}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer shadow-2xs active:scale-[0.98]"
              id="replay-animation-btn"
            >
              <RotateCcw size={14} className="text-slate-600" />
              <span>Replay Animation</span>
            </button>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
              />
              <span>Auto-Advance Step</span>
            </label>
          </div>

          {/* Center Status: X / 16 COMPLETED */}
          <div className="text-xs font-bold text-slate-600 tracking-wider">
            <span className="text-red-600 text-sm">{trainingStep}</span> / 16 COMPLETED
          </div>

          {/* Right Controls: Previous & Next Step / Finish Training */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={trainingStep === 1}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-2xs ${
                trainingStep === 1
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-[0.98]"
              }`}
              id="training-previous-btn"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
              id="training-next-btn"
            >
              <span>{trainingStep === 16 ? "Finish Training" : "Next Step"}</span>
              {trainingStep === 16 ? <Check size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* ===================== 2. TRAINING SLIDES INDEX (SHOWN BELOW SLIDE PLAYER) ===================== */}
      <div id="training-slides-index" className="space-y-4 pt-2">
        <div className="bg-[#F8F9FA] p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              <Layers size={16} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Training Slides Index
              </h2>
              <p className="text-xs text-slate-500">
                Click on any slide card below to start or replay that module step by step.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full shadow-2xs shrink-0">
            16 Total Modules
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRAINING_SLIDES.map((slide) => {
            const isCurrent = trainingStep === slide.id;
            const isCompleted = completedModules.includes(slide.id);

            return (
              <div
                key={slide.id}
                onClick={() => handleSelectModuleFromIndex(slide.id)}
                className={`group rounded-2xl p-4 bg-white border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${
                  isCurrent
                    ? "border-red-500 ring-2 ring-red-100 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Card Header: Number Circle & Title */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCurrent
                            ? "bg-red-600 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {slide.id}
                      </span>
                      <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug line-clamp-1">
                        {slide.title}
                      </h3>
                    </div>
                    {isCompleted && (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    )}
                  </div>

                  {/* Card Content & Icon */}
                  <div className="flex items-start gap-3 my-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {slide.icon}
                    </div>
                    <p className="text-[11.5px] text-slate-500 line-clamp-2 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-400 font-semibold text-[11px]">
                    Module {slide.id}
                  </span>
                  <span className="text-red-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Learn →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
