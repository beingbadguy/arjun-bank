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
import {
  COMPANY_NAME,
  COMPANY_TAGLINE,
  PROCESS_MANAGER_NAME,
  PROCESS_MANAGER_PHONE,
} from "@/config/branding";

interface TrainingSlide {
  id: number;
  stepLabel: string;
  title: string;
  subtitle: string;
  quote: string;
  icon: React.ReactNode;
}

export interface SlideTheme {
  id: number;
  name: string;
  categoryTag: string;
  // Canvas & player styling (Blue and white foundational financial theme with slide-specific color accent)
  canvasGradient: string;
  borderGlow: string;
  headerBarBg: string;
  stepBadgeClass: string;
  accentDotClass: string;
  progressBarClass: string;
  quoteBoxBg: string;
  quoteBtnBg: string;
  quoteTextClass: string;
  cardSurfaceBg: string;
  // Index Card Styling (White card with subtle theme tint, blue-white finance structure)
  indexCardBg: string;
  indexCardBorder: string;
  indexActiveRing: string;
  indexBadgeBg: string;
  indexIconBg: string;
  indexTagBg: string;
  indexActionText: string;
}

export const SLIDE_THEMES: Record<number, SlideTheme> = {
  1: {
    id: 1,
    name: "Royal Navy & Imperial Gold",
    categoryTag: "FLAGSHIP INTRO",
    canvasGradient: "bg-gradient-to-br from-[#071B38] via-[#0E2E5F] to-[#0A1732]",
    borderGlow: "border-amber-400/40 shadow-[0_12px_45px_rgba(245,158,11,0.18)]",
    headerBarBg: "bg-[#061833]/80 border-amber-400/20",
    stepBadgeClass: "bg-gradient-to-r from-amber-400 to-amber-500 text-blue-950 font-black shadow-xs",
    accentDotClass: "bg-amber-400",
    progressBarClass: "bg-gradient-to-r from-blue-500 via-amber-400 to-amber-300",
    quoteBoxBg: "bg-[#0A1D3D]/90 border-amber-400/30 hover:border-amber-400/60",
    quoteBtnBg: "bg-amber-500 text-blue-950 hover:bg-amber-400",
    quoteTextClass: "text-amber-200",
    cardSurfaceBg: "bg-white/95 border-amber-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-amber-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-amber-200 hover:border-amber-400",
    indexActiveRing: "ring-2 ring-amber-400 border-amber-500 shadow-md",
    indexBadgeBg: "bg-amber-500 text-blue-950 font-bold",
    indexIconBg: "bg-amber-100 text-amber-800 border border-amber-200",
    indexTagBg: "bg-amber-100 text-amber-900 border border-amber-200/60",
    indexActionText: "text-amber-700",
  },
  2: {
    id: 2,
    name: "Sapphire Blue & Mint Green",
    categoryTag: "LOAN CATEGORIES",
    canvasGradient: "bg-gradient-to-br from-[#061D36] via-[#0B355B] to-[#07242F]",
    borderGlow: "border-cyan-400/40 shadow-[0_12px_45px_rgba(6,182,212,0.18)]",
    headerBarBg: "bg-[#051A31]/80 border-cyan-400/20",
    stepBadgeClass: "bg-gradient-to-r from-cyan-400 to-blue-500 text-blue-950 font-black shadow-xs",
    accentDotClass: "bg-cyan-400",
    progressBarClass: "bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400",
    quoteBoxBg: "bg-[#07223D]/90 border-cyan-400/30 hover:border-cyan-400/60",
    quoteBtnBg: "bg-cyan-500 text-blue-950 hover:bg-cyan-400",
    quoteTextClass: "text-cyan-200",
    cardSurfaceBg: "bg-white/95 border-cyan-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-cyan-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-cyan-200 hover:border-cyan-400",
    indexActiveRing: "ring-2 ring-cyan-400 border-cyan-500 shadow-md",
    indexBadgeBg: "bg-cyan-600 text-white font-bold",
    indexIconBg: "bg-cyan-100 text-cyan-800 border border-cyan-200",
    indexTagBg: "bg-cyan-100 text-cyan-900 border border-cyan-200/60",
    indexActionText: "text-cyan-700",
  },
  3: {
    id: 3,
    name: "Indigo Blue & Royal Violet",
    categoryTag: "PRODUCT SUITE",
    canvasGradient: "bg-gradient-to-br from-[#0F1844] via-[#1D2569] to-[#121343]",
    borderGlow: "border-violet-400/40 shadow-[0_12px_45px_rgba(139,92,246,0.18)]",
    headerBarBg: "bg-[#0D153B]/80 border-violet-400/20",
    stepBadgeClass: "bg-gradient-to-r from-violet-400 to-purple-500 text-blue-950 font-black shadow-xs",
    accentDotClass: "bg-violet-400",
    progressBarClass: "bg-gradient-to-r from-blue-500 via-indigo-400 to-violet-400",
    quoteBoxBg: "bg-[#101946]/90 border-violet-400/30 hover:border-violet-400/60",
    quoteBtnBg: "bg-violet-500 text-white hover:bg-violet-400",
    quoteTextClass: "text-violet-200",
    cardSurfaceBg: "bg-white/95 border-violet-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-violet-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-violet-200 hover:border-violet-400",
    indexActiveRing: "ring-2 ring-violet-400 border-violet-500 shadow-md",
    indexBadgeBg: "bg-violet-600 text-white font-bold",
    indexIconBg: "bg-violet-100 text-violet-800 border border-violet-200",
    indexTagBg: "bg-violet-100 text-violet-900 border border-violet-200/60",
    indexActionText: "text-violet-700",
  },
  4: {
    id: 4,
    name: "Cobalt Blue & Crimson Rose",
    categoryTag: "LOAN ELIGIBILITY",
    canvasGradient: "bg-gradient-to-br from-[#1C143A] via-[#2A184A] to-[#151235]",
    borderGlow: "border-rose-400/40 shadow-[0_12px_45px_rgba(244,63,94,0.18)]",
    headerBarBg: "bg-[#181132]/80 border-rose-400/20",
    stepBadgeClass: "bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black shadow-xs",
    accentDotClass: "bg-rose-400",
    progressBarClass: "bg-gradient-to-r from-blue-500 via-rose-500 to-pink-400",
    quoteBoxBg: "bg-[#1D133F]/90 border-rose-400/30 hover:border-rose-400/60",
    quoteBtnBg: "bg-rose-500 text-white hover:bg-rose-400",
    quoteTextClass: "text-rose-200",
    cardSurfaceBg: "bg-white/95 border-rose-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-rose-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-rose-200 hover:border-rose-400",
    indexActiveRing: "ring-2 ring-rose-400 border-rose-500 shadow-md",
    indexBadgeBg: "bg-rose-600 text-white font-bold",
    indexIconBg: "bg-rose-100 text-rose-800 border border-rose-200",
    indexTagBg: "bg-rose-100 text-rose-900 border border-rose-200/60",
    indexActionText: "text-rose-700",
  },
  5: {
    id: 5,
    name: "Deep Oxford Navy & Corporate Steel",
    categoryTag: "COMPANY TIERS",
    canvasGradient: "bg-gradient-to-br from-[#081B38] via-[#0E2C59] to-[#07162E]",
    borderGlow: "border-blue-400/40 shadow-[0_12px_45px_rgba(59,130,246,0.18)]",
    headerBarBg: "bg-[#071731]/80 border-blue-400/20",
    stepBadgeClass: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black shadow-xs",
    accentDotClass: "bg-blue-400",
    progressBarClass: "bg-gradient-to-r from-blue-600 via-blue-400 to-sky-300",
    quoteBoxBg: "bg-[#091F41]/90 border-blue-400/30 hover:border-blue-400/60",
    quoteBtnBg: "bg-blue-600 text-white hover:bg-blue-500",
    quoteTextClass: "text-blue-200",
    cardSurfaceBg: "bg-white/95 border-blue-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-blue-50/90 via-white to-slate-50/50",
    indexCardBorder: "border-blue-200 hover:border-blue-400",
    indexActiveRing: "ring-2 ring-blue-400 border-blue-500 shadow-md",
    indexBadgeBg: "bg-blue-600 text-white font-bold",
    indexIconBg: "bg-blue-100 text-blue-800 border border-blue-200",
    indexTagBg: "bg-blue-100 text-blue-900 border border-blue-200/60",
    indexActionText: "text-blue-700",
  },
  6: {
    id: 6,
    name: "Aquamarine Navy & Teal",
    categoryTag: "LEGAL ENTITIES",
    canvasGradient: "bg-gradient-to-br from-[#06202B] via-[#0B3444] to-[#051C26]",
    borderGlow: "border-teal-400/40 shadow-[0_12px_45px_rgba(20,184,166,0.18)]",
    headerBarBg: "bg-[#051C26]/80 border-teal-400/20",
    stepBadgeClass: "bg-gradient-to-r from-teal-400 to-emerald-500 text-blue-950 font-black shadow-xs",
    accentDotClass: "bg-teal-400",
    progressBarClass: "bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400",
    quoteBoxBg: "bg-[#072532]/90 border-teal-400/30 hover:border-teal-400/60",
    quoteBtnBg: "bg-teal-500 text-blue-950 hover:bg-teal-400",
    quoteTextClass: "text-teal-200",
    cardSurfaceBg: "bg-white/95 border-teal-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-teal-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-teal-200 hover:border-teal-400",
    indexActiveRing: "ring-2 ring-teal-400 border-teal-500 shadow-md",
    indexBadgeBg: "bg-teal-600 text-white font-bold",
    indexIconBg: "bg-teal-100 text-teal-800 border border-teal-200",
    indexTagBg: "bg-teal-100 text-teal-900 border border-teal-200/60",
    indexActionText: "text-teal-700",
  },
  7: {
    id: 7,
    name: "Institutional Navy & Red Partner Seal",
    categoryTag: "BANK TIE-UPS",
    canvasGradient: "bg-gradient-to-br from-[#10193B] via-[#1E1F4F] to-[#111235]",
    borderGlow: "border-red-400/40 shadow-[0_12px_45px_rgba(239,68,68,0.18)]",
    headerBarBg: "bg-[#0E1533]/80 border-red-400/20",
    stepBadgeClass: "bg-gradient-to-r from-red-500 to-rose-600 text-white font-black shadow-xs",
    accentDotClass: "bg-red-400",
    progressBarClass: "bg-gradient-to-r from-blue-500 via-red-500 to-rose-400",
    quoteBoxBg: "bg-[#141B43]/90 border-red-400/30 hover:border-red-400/60",
    quoteBtnBg: "bg-red-600 text-white hover:bg-red-500",
    quoteTextClass: "text-red-200",
    cardSurfaceBg: "bg-white/95 border-red-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-red-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-red-200 hover:border-red-400",
    indexActiveRing: "ring-2 ring-red-400 border-red-500 shadow-md",
    indexBadgeBg: "bg-red-600 text-white font-bold",
    indexIconBg: "bg-red-100 text-red-800 border border-red-200",
    indexTagBg: "bg-red-100 text-red-900 border border-red-200/60",
    indexActionText: "text-red-700",
  },
  8: {
    id: 8,
    name: "Oceanic Blue & Warm Amber",
    categoryTag: "PAN INDIA",
    canvasGradient: "bg-gradient-to-br from-[#0F1F3D] via-[#1C2C4D] to-[#121633]",
    borderGlow: "border-orange-400/40 shadow-[0_12px_45px_rgba(249,115,22,0.18)]",
    headerBarBg: "bg-[#0C1A34]/80 border-orange-400/20",
    stepBadgeClass: "bg-gradient-to-r from-orange-400 to-amber-500 text-blue-950 font-black shadow-xs",
    accentDotClass: "bg-orange-400",
    progressBarClass: "bg-gradient-to-r from-blue-500 via-orange-400 to-amber-400",
    quoteBoxBg: "bg-[#112344]/90 border-orange-400/30 hover:border-orange-400/60",
    quoteBtnBg: "bg-orange-500 text-blue-950 hover:bg-orange-400",
    quoteTextClass: "text-orange-200",
    cardSurfaceBg: "bg-white/95 border-orange-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-orange-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-orange-200 hover:border-orange-400",
    indexActiveRing: "ring-2 ring-orange-400 border-orange-500 shadow-md",
    indexBadgeBg: "bg-orange-600 text-white font-bold",
    indexIconBg: "bg-orange-100 text-orange-800 border border-orange-200",
    indexTagBg: "bg-orange-100 text-orange-900 border border-orange-200/60",
    indexActionText: "text-orange-700",
  },
  9: {
    id: 9,
    name: "Pacific Blue & Emerald Malachite",
    categoryTag: "INCLUSIVE FINANCE",
    canvasGradient: "bg-gradient-to-br from-[#072030] via-[#0C323D] to-[#061C24]",
    borderGlow: "border-emerald-400/40 shadow-[0_12px_45px_rgba(16,185,129,0.18)]",
    headerBarBg: "bg-[#061B28]/80 border-emerald-400/20",
    stepBadgeClass: "bg-gradient-to-r from-emerald-400 to-teal-500 text-blue-950 font-black shadow-xs",
    accentDotClass: "bg-emerald-400",
    progressBarClass: "bg-gradient-to-r from-blue-500 via-emerald-400 to-teal-400",
    quoteBoxBg: "bg-[#082436]/90 border-emerald-400/30 hover:border-emerald-400/60",
    quoteBtnBg: "bg-emerald-500 text-blue-950 hover:bg-emerald-400",
    quoteTextClass: "text-emerald-200",
    cardSurfaceBg: "bg-white/95 border-emerald-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-emerald-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-emerald-200 hover:border-emerald-400",
    indexActiveRing: "ring-2 ring-emerald-400 border-emerald-500 shadow-md",
    indexBadgeBg: "bg-emerald-600 text-white font-bold",
    indexIconBg: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    indexTagBg: "bg-emerald-100 text-emerald-900 border border-emerald-200/60",
    indexActionText: "text-emerald-700",
  },
  10: {
    id: 10,
    name: "Cyber Sapphire & Electric Indigo",
    categoryTag: "DIGITAL LOGIN",
    canvasGradient: "bg-gradient-to-br from-[#0B1745] via-[#142266] to-[#0A103B]",
    borderGlow: "border-indigo-400/40 shadow-[0_12px_45px_rgba(99,102,241,0.22)]",
    headerBarBg: "bg-[#09133A]/80 border-indigo-400/20",
    stepBadgeClass: "bg-gradient-to-r from-indigo-400 to-violet-500 text-blue-950 font-black shadow-xs",
    accentDotClass: "bg-indigo-400",
    progressBarClass: "bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400",
    quoteBoxBg: "bg-[#0D1B52]/90 border-indigo-400/30 hover:border-indigo-400/60",
    quoteBtnBg: "bg-indigo-500 text-white hover:bg-indigo-400",
    quoteTextClass: "text-indigo-200",
    cardSurfaceBg: "bg-white/95 border-indigo-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-indigo-200 hover:border-indigo-400",
    indexActiveRing: "ring-2 ring-indigo-400 border-indigo-500 shadow-md",
    indexBadgeBg: "bg-indigo-600 text-white font-bold",
    indexIconBg: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    indexTagBg: "bg-indigo-100 text-indigo-900 border border-indigo-200/60",
    indexActionText: "text-indigo-700",
  },
  11: {
    id: 11,
    name: "Deep Navy & Lime Gold",
    categoryTag: "INCENTIVE SLABS",
    canvasGradient: "bg-gradient-to-br from-[#072030] via-[#0C323E] to-[#061C26]",
    borderGlow: "border-lime-400/40 shadow-[0_12px_45px_rgba(132,204,22,0.18)]",
    headerBarBg: "bg-[#061B28]/80 border-lime-400/20",
    stepBadgeClass: "bg-gradient-to-r from-lime-400 to-emerald-400 text-blue-950 font-black shadow-xs",
    accentDotClass: "bg-lime-400",
    progressBarClass: "bg-gradient-to-r from-blue-500 via-lime-400 to-emerald-400",
    quoteBoxBg: "bg-[#092538]/90 border-lime-400/30 hover:border-lime-400/60",
    quoteBtnBg: "bg-lime-500 text-blue-950 hover:bg-lime-400",
    quoteTextClass: "text-lime-200",
    cardSurfaceBg: "bg-white/95 border-lime-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-lime-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-lime-200 hover:border-lime-400",
    indexActiveRing: "ring-2 ring-lime-400 border-lime-500 shadow-md",
    indexBadgeBg: "bg-lime-600 text-white font-bold",
    indexIconBg: "bg-lime-100 text-lime-800 border border-lime-200",
    indexTagBg: "bg-lime-100 text-lime-900 border border-lime-200/60",
    indexActionText: "text-lime-700",
  },
  12: {
    id: 12,
    name: "Royal Blue & Wine Rose",
    categoryTag: "SUPPORT DESK",
    canvasGradient: "bg-gradient-to-br from-[#18143D] via-[#261A4E] to-[#141235]",
    borderGlow: "border-pink-400/40 shadow-[0_12px_45px_rgba(236,72,153,0.18)]",
    headerBarBg: "bg-[#151136]/80 border-pink-400/20",
    stepBadgeClass: "bg-gradient-to-r from-pink-400 to-rose-500 text-blue-950 font-black shadow-xs",
    accentDotClass: "bg-pink-400",
    progressBarClass: "bg-gradient-to-r from-blue-500 via-pink-400 to-rose-400",
    quoteBoxBg: "bg-[#1C1546]/90 border-pink-400/30 hover:border-pink-400/60",
    quoteBtnBg: "bg-pink-500 text-white hover:bg-pink-400",
    quoteTextClass: "text-pink-200",
    cardSurfaceBg: "bg-white/95 border-pink-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-pink-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-pink-200 hover:border-pink-400",
    indexActiveRing: "ring-2 ring-pink-400 border-pink-500 shadow-md",
    indexBadgeBg: "bg-pink-600 text-white font-bold",
    indexIconBg: "bg-pink-100 text-pink-800 border border-pink-200",
    indexTagBg: "bg-pink-100 text-pink-900 border border-pink-200/60",
    indexActionText: "text-pink-700",
  },
  13: {
    id: 13,
    name: "Navy Blue & Sunburst Amber",
    categoryTag: "QUICK START",
    canvasGradient: "bg-gradient-to-br from-[#0F1E3D] via-[#1B2F57] to-[#0E1A35]",
    borderGlow: "border-amber-400/40 shadow-[0_12px_45px_rgba(245,158,11,0.18)]",
    headerBarBg: "bg-[#0D1B36]/80 border-amber-400/20",
    stepBadgeClass: "bg-gradient-to-r from-amber-400 to-orange-500 text-blue-950 font-black shadow-xs",
    accentDotClass: "bg-amber-400",
    progressBarClass: "bg-gradient-to-r from-blue-500 via-amber-400 to-orange-400",
    quoteBoxBg: "bg-[#122347]/90 border-amber-400/30 hover:border-amber-400/60",
    quoteBtnBg: "bg-amber-500 text-blue-950 hover:bg-amber-400",
    quoteTextClass: "text-amber-200",
    cardSurfaceBg: "bg-white/95 border-amber-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-amber-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-amber-200 hover:border-amber-400",
    indexActiveRing: "ring-2 ring-amber-400 border-amber-500 shadow-md",
    indexBadgeBg: "bg-amber-500 text-blue-950 font-bold",
    indexIconBg: "bg-amber-100 text-amber-800 border border-amber-200",
    indexTagBg: "bg-amber-100 text-amber-900 border border-amber-200/60",
    indexActionText: "text-amber-700",
  },
  14: {
    id: 14,
    name: "Clean Azure & Sky Cyan",
    categoryTag: "CALL SCRIPT",
    canvasGradient: "bg-gradient-to-br from-[#081E3D] via-[#0C315B] to-[#061833]",
    borderGlow: "border-sky-400/40 shadow-[0_12px_45px_rgba(14,165,233,0.18)]",
    headerBarBg: "bg-[#061933]/80 border-sky-400/20",
    stepBadgeClass: "bg-gradient-to-r from-sky-400 to-blue-500 text-blue-950 font-black shadow-xs",
    accentDotClass: "bg-sky-400",
    progressBarClass: "bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300",
    quoteBoxBg: "bg-[#092244]/90 border-sky-400/30 hover:border-sky-400/60",
    quoteBtnBg: "bg-sky-500 text-blue-950 hover:bg-sky-400",
    quoteTextClass: "text-sky-200",
    cardSurfaceBg: "bg-white/95 border-sky-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-sky-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-sky-200 hover:border-sky-400",
    indexActiveRing: "ring-2 ring-sky-400 border-sky-500 shadow-md",
    indexBadgeBg: "bg-sky-600 text-white font-bold",
    indexIconBg: "bg-sky-100 text-sky-800 border border-sky-200",
    indexTagBg: "bg-sky-100 text-sky-900 border border-sky-200/60",
    indexActionText: "text-sky-700",
  },
  15: {
    id: 15,
    name: "Guardian Slate Navy & Dual Contrast",
    categoryTag: "COMPLIANCE",
    canvasGradient: "bg-gradient-to-br from-[#0E1A33] via-[#152542] to-[#0C1527]",
    borderGlow: "border-blue-400/40 shadow-[0_12px_45px_rgba(59,130,246,0.18)]",
    headerBarBg: "bg-[#0B152B]/80 border-blue-400/20",
    stepBadgeClass: "bg-gradient-to-r from-emerald-500 via-teal-500 to-rose-500 text-white font-black shadow-xs",
    accentDotClass: "bg-blue-400",
    progressBarClass: "bg-gradient-to-r from-emerald-400 via-blue-400 to-rose-500",
    quoteBoxBg: "bg-[#101D38]/90 border-blue-400/30 hover:border-blue-400/60",
    quoteBtnBg: "bg-blue-600 text-white hover:bg-blue-500",
    quoteTextClass: "text-slate-200",
    cardSurfaceBg: "bg-white/95 border-slate-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-slate-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-slate-200 hover:border-blue-400",
    indexActiveRing: "ring-2 ring-blue-400 border-blue-500 shadow-md",
    indexBadgeBg: "bg-slate-700 text-white font-bold",
    indexIconBg: "bg-slate-100 text-slate-800 border border-slate-200",
    indexTagBg: "bg-slate-100 text-slate-900 border border-slate-200/60",
    indexActionText: "text-blue-700",
  },
  16: {
    id: 16,
    name: "Royal Navy & Pure Trophy Gold",
    categoryTag: "GRADUATION",
    canvasGradient: "bg-gradient-to-br from-[#121A42] via-[#1E2563] to-[#101538]",
    borderGlow: "border-yellow-400/50 shadow-[0_12px_50px_rgba(250,204,21,0.25)]",
    headerBarBg: "bg-[#0E1537]/80 border-yellow-400/30",
    stepBadgeClass: "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-blue-950 font-black shadow-xs",
    accentDotClass: "bg-yellow-400",
    progressBarClass: "bg-gradient-to-r from-blue-500 via-yellow-400 to-amber-300",
    quoteBoxBg: "bg-[#141C48]/90 border-yellow-400/40 hover:border-yellow-400/70",
    quoteBtnBg: "bg-yellow-400 text-blue-950 hover:bg-yellow-300",
    quoteTextClass: "text-yellow-200",
    cardSurfaceBg: "bg-white/95 border-yellow-200/60 shadow-lg text-slate-900",
    indexCardBg: "bg-gradient-to-br from-yellow-50/90 via-white to-blue-50/50",
    indexCardBorder: "border-yellow-200 hover:border-yellow-400",
    indexActiveRing: "ring-2 ring-yellow-400 border-yellow-500 shadow-md",
    indexBadgeBg: "bg-yellow-500 text-blue-950 font-black",
    indexIconBg: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    indexTagBg: "bg-yellow-100 text-yellow-900 border border-yellow-200/60",
    indexActionText: "text-yellow-800",
  },
};

export const TRAINING_SLIDES: TrainingSlide[] = [
  {
    id: 1,
    stepLabel: "STEP 1 OF 16",
    title: `Welcome to ${COMPANY_NAME}`,
    subtitle: COMPANY_TAGLINE,
    quote:
      `"Welcome to ${COMPANY_NAME} New Caller Training Program! Here you will learn how to speak with customers, pitch loan products, and earn maximum incentive. Click Next Step to proceed."`,
    icon: <Users className="text-amber-500" size={24} />,
  },
  {
    id: 2,
    stepLabel: "STEP 2 OF 16",
    title: "Type of Category",
    subtitle: "Unsecured vs Secured Loans Differentiation",
    quote:
      '"Loans are categorized into two types: Unsecured Loans where no collateral is required, and Secured Loans where property or assets are mortgaged."',
    icon: <Layers className="text-cyan-500" size={24} />,
  },
  {
    id: 3,
    stepLabel: "STEP 3 OF 16",
    title: "Unsecured Loan Type",
    subtitle: "Personal, Business & Flexi Overdraft Details",
    quote:
      `"Under Unsecured loans, ${COMPANY_NAME} specializes in three main products: Personal Loans, Business Loans, and Flexi Overdraft facilities."`,
    icon: <Landmark className="text-violet-500" size={24} />,
  },
  {
    id: 4,
    stepLabel: "STEP 4 OF 16",
    title: "Personal Loan Details",
    subtitle: "Eligibility, Amount, Interest Rates & Tenure",
    quote:
      '"Personal Loans offer amounts from 1 Lakh to 1 Crore with ROI starting from 9.95% to 16% annually. Minimum salary required is 25,000."',
    icon: <CreditCard className="text-rose-500" size={24} />,
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
    icon: <Building2 className="text-teal-500" size={24} />,
  },
  {
    id: 7,
    stepLabel: "STEP 7 OF 16",
    title: "40+ Banks & NBFCs",
    subtitle: "Tie-ups with leading Indian Banks and NBFCs",
    quote:
      `"${COMPANY_NAME} has tie-ups with over 40 plus leading Banks and NBFCs like Bajaj Finance, HDFC, ICICI, Tata Capital, and Axis Bank."`,
    icon: <Landmark className="text-red-500" size={24} />,
  },
  {
    id: 8,
    stepLabel: "STEP 8 OF 16",
    title: "Pan India Funding",
    subtitle: "Servicing Customers Across All Indian States & Cities",
    quote:
      `"${COMPANY_NAME} provides loan disbursal pan India! No matter where your customer is located, digital verification enables instant loan sanction."`,
    icon: <MapPin className="text-orange-500" size={24} />,
  },
  {
    id: 9,
    stepLabel: "STEP 9 OF 16",
    title: "4th Grade Employed",
    subtitle: "Loan Eligibility for Support & Service Staff",
    quote:
      '"Special loan schemes are available for 4th Grade Employed personnel having official salary slips and active bank accounts."',
    icon: <User className="text-emerald-500" size={24} />,
  },
  {
    id: 10,
    stepLabel: "STEP 10 OF 16",
    title: "All Banks Digital Login",
    subtitle: "Paperless Online Disbursal in 30 Minutes",
    quote:
      '"Our proprietary portal allows digital login across all banks under 30 minutes with zero manual paperwork required."',
    icon: <Laptop className="text-indigo-500" size={24} />,
  },
  {
    id: 11,
    stepLabel: "STEP 11 OF 16",
    title: "Personal Loan Incentive",
    subtitle: "Variable Fees Structure • Slabs 1 to 8 (₹4,000 to ₹50,000+)",
    quote:
      '"Telecaller Personal Loan Incentive Structure: Disbursals from 30 Lacs earn 4,000 rupees up to 100 Lacs earning 50,000 rupees. Plus 250 rupees per lakh above slab for ARO!"',
    icon: <Coins className="text-lime-500" size={24} />,
  },
  {
    id: 12,
    stepLabel: "STEP 12 OF 16",
    title: "Process Manager Support",
    subtitle: "Dedicated Support Desk to Help You Close Deals",
    quote:
      `"You are never alone! Dedicated Process Manager ${PROCESS_MANAGER_NAME} is always available to assist you."`,
    icon: <Users className="text-pink-500" size={24} />,
  },
  {
    id: 13,
    stepLabel: "STEP 13 OF 16",
    title: "Join & Earn",
    subtitle: "Simple 3 Step Onboarding Process",
    quote:
      '"Complete this training module, clear the quick quiz, and start calling live leads to earn your first incentive today!"',
    icon: <Megaphone className="text-amber-500" size={24} />,
  },
  {
    id: 14,
    stepLabel: "STEP 14 OF 16",
    title: "Sample Calling Script",
    subtitle: "Greeting, Customer Need, Pitching & Closing",
    quote:
      '"Always follow the 4-step script: Polite Greeting, Understanding Need, Presenting Loan Offer, and Collecting Docs on WhatsApp."',
    icon: <FileEdit className="text-sky-500" size={24} />,
  },
  {
    id: 15,
    stepLabel: "STEP 15 OF 16",
    title: "Do's & Don'ts",
    subtitle: "Telecaller Guidelines for Professional Calling",
    quote:
      '"Do speak politely and give accurate loan rates. Don\'t demand cash processing fees or misguide the customer under any circumstance."',
    icon: <AlertTriangle className="text-blue-400" size={24} />,
  },
  {
    id: 16,
    stepLabel: "STEP 16 OF 16",
    title: "Thank You & Certification",
    subtitle: `You have completed ${COMPANY_NAME} New Caller Training!`,
    quote:
      '"Congratulations! You have completed all 16 training slides. Click below to start live calling or practice your script."',
    icon: <Trophy className="text-yellow-500" size={24} />,
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
    setBenefitsModalOpen,
  } = useWorkspaceStore();

  const [animatingKey, setAnimatingKey] = useState<number>(0);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = TRAINING_SLIDES[trainingStep - 1] || TRAINING_SLIDES[0];
  const currentTheme = SLIDE_THEMES[trainingStep] || SLIDE_THEMES[1];

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
    scrollToTop(true);
  };

  // Render Visual Canvas based on Slide Number with Blue and White Financial theme + Distinct Color Highlights
  const renderSlideCanvas = () => {
    switch (trainingStep) {
      case 1:
        // Welcome to Finance Buddha (Flagship Intro)
        return (
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-6 px-4 sm:px-8">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-400/90 text-blue-950 font-black text-[11px] rounded-full uppercase tracking-wider shadow-sm">
                <Sparkles size={13} className="text-blue-950" />
                <span>{COMPANY_NAME} ACADEMY • MODULE #1</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Welcome to <span className="text-amber-400">{COMPANY_NAME}</span>
              </h1>
              <p className="text-blue-100 text-sm sm:text-base font-normal max-w-lg leading-relaxed">
                {COMPANY_TAGLINE} Master client pitching, fast-track loan approvals, and unlock daily payouts.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-xs">
                  <Check size={14} className="text-emerald-400 stroke-[3]" />
                  <span>100% Digital Process</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/15 backdrop-blur-md border border-amber-400/30 text-amber-300 text-xs font-semibold shadow-xs">
                  <Coins size={14} className="text-amber-400" />
                  <span>Daily Disbursal Incentives</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-400/15 backdrop-blur-md border border-cyan-400/30 text-cyan-200 text-xs font-semibold shadow-xs">
                  <Zap size={14} className="text-cyan-400" />
                  <span>Direct Bank Logins</span>
                </div>
              </div>
            </div>

            {/* Glowing Trainer Persona Avatar with Gold & Navy Ring */}
            <div className="relative shrink-0 flex flex-col items-center justify-center">
              <div
                className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1.5 flex items-center justify-center transition-all duration-300 ${
                  isSpeaking
                    ? "bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.5)] scale-105"
                    : "bg-gradient-to-tr from-amber-400 to-blue-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]"
                }`}
              >
                <div className="w-full h-full rounded-full bg-[#0A1A36] flex flex-col items-center justify-center p-4 border border-amber-400/40">
                  <Headphones size={44} className="text-amber-400 mb-2 animate-bounce-subtle" />
                  <span className="text-[10px] font-extrabold tracking-widest text-white uppercase text-center">
                    TRAINER PERSONA
                  </span>
                  {isSpeaking && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="w-1 h-3 bg-amber-400 rounded-full animate-pulse" />
                      <span className="w-1 h-5 bg-yellow-300 rounded-full animate-pulse delay-75" />
                      <span className="w-1 h-2 bg-amber-500 rounded-full animate-pulse delay-150" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        // Type of Category: Unsecured vs Secured (Sapphire vs Emerald)
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4 px-2 sm:px-6">
            {/* UNSECURED (Sapphire Blue card) */}
            <div className="rounded-2xl p-6 bg-gradient-to-b from-[#1D4ED8] to-[#1E3A8A] text-white shadow-xl border border-blue-300/30 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center mb-3 shadow-inner">
                <Shield size={24} className="text-cyan-300 fill-cyan-300/30" />
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-1 text-white">UNSECURED LOANS</h2>
              <div className="text-xs text-blue-200 font-medium mb-4">(Zero Collateral / Mortgage Required)</div>
              <div className="w-full bg-white/10 backdrop-blur-md rounded-xl p-4 text-left space-y-2.5 border border-white/20 text-sm">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-cyan-300 stroke-[3]" />
                  <span className="font-medium text-white">Personal Loans (Salaried)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-cyan-300 stroke-[3]" />
                  <span className="font-medium text-white">Business Loans (Self-Employed)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-cyan-300 stroke-[3]" />
                  <span className="font-medium text-white">Flexi Overdraft Facilities</span>
                </div>
              </div>
            </div>

            {/* SECURED (Emerald Green card) */}
            <div className="rounded-2xl p-6 bg-gradient-to-b from-[#059669] to-[#064E3B] text-white shadow-xl border border-emerald-300/30 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center mb-3 shadow-inner">
                <Home size={24} className="text-emerald-200 fill-emerald-200/30" />
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-1 text-white">SECURED LOANS</h2>
              <div className="text-xs text-emerald-200 font-medium mb-4">(Asset / Property Collateral Required)</div>
              <div className="w-full bg-white/10 backdrop-blur-md rounded-xl p-4 text-left space-y-2.5 border border-white/20 text-sm">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-300 stroke-[3]" />
                  <span className="font-medium text-white">Home Loans (New &amp; Resale)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-300 stroke-[3]" />
                  <span className="font-medium text-white">Loan Against Property (LAP)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-300 stroke-[3]" />
                  <span className="font-medium text-white">Commercial Vehicle / Car Loans</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        // Unsecured Loan Type: 3 Cards (Violet, Ocean Blue, Bronze)
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 px-2 sm:px-4">
            {/* PERSONAL LOAN (Violet) */}
            <div className="rounded-2xl p-5 bg-gradient-to-b from-[#7C3AED] to-[#5B21B6] text-white shadow-lg border border-purple-300/30 flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center mb-3 shadow-inner">
                <User size={22} className="text-white" />
              </div>
              <h3 className="text-base font-bold tracking-tight mb-2 text-white">PERSONAL LOAN</h3>
              <p className="text-xs text-purple-100 font-normal leading-relaxed">
                For salaried employees with minimum salary ₹25,000/mo. No collateral needed.
              </p>
            </div>

            {/* BUSINESS LOAN (Ocean Blue) */}
            <div className="rounded-2xl p-5 bg-gradient-to-b from-[#2563EB] to-[#1E40AF] text-white shadow-lg border border-blue-300/30 flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center mb-3 shadow-inner">
                <Briefcase size={22} className="text-white" />
              </div>
              <h3 className="text-base font-bold tracking-tight mb-2 text-white">BUSINESS LOAN</h3>
              <p className="text-xs text-blue-100 font-normal leading-relaxed">
                For self-employed &amp; company owners with GST / ITR banking track record.
              </p>
            </div>

            {/* FLEXI OVERDRAFT (Amber/Bronze) */}
            <div className="rounded-2xl p-5 bg-gradient-to-b from-[#D97706] to-[#92400E] text-white shadow-lg border border-amber-300/30 flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center mb-3 shadow-inner">
                <Scale size={22} className="text-white" />
              </div>
              <h3 className="text-base font-bold tracking-tight mb-2 text-white">FLEXI OVERDRAFT</h3>
              <p className="text-xs text-amber-100 font-normal leading-relaxed">
                Revolving credit line: Pay interest only on the utilized amount by customer.
              </p>
            </div>
          </div>
        );

      case 4:
        // Personal Loan Details (Crimson & Rose Gold)
        return (
          <div className="flex flex-col items-center py-4 px-2 sm:px-6">
            <span className="px-3.5 py-1 bg-rose-500 text-white font-extrabold text-[11px] rounded-full uppercase tracking-wider mb-2 shadow-xs">
              PRODUCT SPECIFICATIONS
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-rose-300 tracking-tight mb-5 text-center">
              PERSONAL LOAN ELIGIBILITY &amp; METRICS
            </h2>

            <div className="w-full max-w-xl bg-white/95 rounded-2xl p-5 border border-rose-200 shadow-xl space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">₹</span>
                  <span className="text-sm font-semibold text-slate-800">Sanction Amount:</span>
                </div>
                <span className="text-sm sm:text-base font-black text-blue-700">₹ 1 Lakh to ₹ 1 Crore</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">%</span>
                  <span className="text-sm font-semibold text-slate-800">ROI (Interest Rate):</span>
                </div>
                <span className="text-sm sm:text-base font-black text-emerald-700">9.95% to 16% p.a.</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                <div className="flex items-center gap-3">
                  <Coins size={18} className="text-amber-600" />
                  <span className="text-sm font-semibold text-slate-800">Min. Salary:</span>
                </div>
                <span className="text-sm sm:text-base font-black text-amber-700">₹ 25,000 / month</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/70 border border-purple-100">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-purple-600" />
                  <span className="text-sm font-semibold text-slate-800">Tenure Period:</span>
                </div>
                <span className="text-sm sm:text-base font-black text-purple-700">1 Year to 8 Years</span>
              </div>
            </div>
          </div>
        );

      case 5:
        // Company Categories (Corporate Tiers)
        return (
          <div className="py-4 px-2 sm:px-6">
            <div className="text-center mb-5">
              <span className="px-3.5 py-1 bg-blue-500 text-white font-extrabold text-[11px] rounded-full uppercase tracking-wider">
                CORPORATE CATEGORIES
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">
                Company Tiers &amp; Eligibility Rates
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white/95 p-4 rounded-xl border border-emerald-300 shadow-lg">
                <div className="text-xs font-black text-emerald-700 mb-1">CAT A (SUPER PRIME)</div>
                <div className="text-sm font-bold text-slate-900 mb-2">TCS, Infosys, Reliance, Top MNCs</div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>ROI: <span className="font-bold text-emerald-700">10.25% - 11.5%</span></div>
                  <div>Max Loan: <span className="font-bold text-slate-900">₹ 50 Lakhs</span></div>
                  <div>FOIR: <span className="font-bold text-slate-900">Up to 70%</span></div>
                </div>
              </div>
              <div className="bg-white/95 p-4 rounded-xl border border-blue-300 shadow-lg">
                <div className="text-xs font-black text-blue-700 mb-1">CAT B (PRIME)</div>
                <div className="text-sm font-bold text-slate-900 mb-2">Reputed Listed &amp; Mid Corporates</div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>ROI: <span className="font-bold text-blue-700">10.75% - 12.5%</span></div>
                  <div>Max Loan: <span className="font-bold text-slate-900">₹ 35 Lakhs</span></div>
                  <div>FOIR: <span className="font-bold text-slate-900">Up to 65%</span></div>
                </div>
              </div>
              <div className="bg-white/95 p-4 rounded-xl border border-amber-300 shadow-lg">
                <div className="text-xs font-black text-amber-700 mb-1">CAT C (GROWTH)</div>
                <div className="text-sm font-bold text-slate-900 mb-2">Pvt Ltd with 100+ Staff</div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>ROI: <span className="font-bold text-amber-700">12.0% - 14.5%</span></div>
                  <div>Max Loan: <span className="font-bold text-slate-900">₹ 25 Lakhs</span></div>
                  <div>FOIR: <span className="font-bold text-slate-900">Up to 60%</span></div>
                </div>
              </div>
              <div className="bg-white/95 p-4 rounded-xl border border-rose-300 shadow-lg">
                <div className="text-xs font-black text-rose-700 mb-1">CAT D &amp; UNLISTED</div>
                <div className="text-sm font-bold text-slate-900 mb-2">LLPs, Partnerships, Small Firms</div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>ROI: <span className="font-bold text-rose-700">14.0% - 17.5%</span></div>
                  <div>Max Loan: <span className="font-bold text-slate-900">₹ 15 Lakhs</span></div>
                  <div>Banking: <span className="font-bold text-slate-900">Strict Verify</span></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        // All Types of Companies (Teal & Navy)
        return (
          <div className="py-4 px-2 sm:px-6 flex justify-center">
            <div className="w-full max-w-xl bg-white/95 border border-teal-200 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg sm:text-xl font-black text-teal-800 text-center mb-5">
                We Process All Types of Companies
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-teal-600 fill-teal-600/20 shrink-0" />
                  <span className="text-sm font-bold text-slate-900">Private Limited</span>
                </div>
                <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-teal-600 fill-teal-600/20 shrink-0" />
                  <span className="text-sm font-bold text-slate-900">Public Limited</span>
                </div>
                <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-teal-600 fill-teal-600/20 shrink-0" />
                  <span className="text-sm font-bold text-slate-900">Partnership Firm</span>
                </div>
                <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-teal-600 fill-teal-600/20 shrink-0" />
                  <span className="text-sm font-bold text-slate-900">Proprietorship</span>
                </div>
              </div>
              <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl flex items-center gap-3">
                <CheckCircle2 size={18} className="text-teal-600 fill-teal-600/20 shrink-0" />
                <span className="text-sm font-bold text-slate-900">LLP (Limited Liability Partnership) &amp; More...</span>
              </div>
            </div>
          </div>
        );

      case 7:
        // 40+ Banks & NBFCs (Red Partner Seal & Institutional Navy)
        return (
          <div className="py-4 px-2 sm:px-6 flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wider mb-4 shadow-sm">
              <Handshake size={14} className="stroke-[2.5]" />
              <span>{COMPANY_NAME} BANKING NETWORK</span>
            </div>

            <div className="w-full max-w-2xl bg-white/95 border border-red-200 rounded-2xl p-6 sm:p-8 text-center shadow-xl">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
                40+ Leading Banks &amp; NBFCs
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-normal mb-6">
                Direct association with premier lenders guaranteeing maximum sanction options for every profile.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {[
                  "HDFC Bank",
                  "ICICI Bank",
                  "Bajaj Finserv",
                  "Tata Capital",
                  "Axis Bank",
                  "Kotak Mahindra",
                  "L&T Finance",
                  "Aditya Birla",
                  "SMFG India Credit",
                ].map((bank, i) => (
                  <span
                    key={i}
                    className="px-3.5 py-1.5 bg-blue-50 text-blue-900 font-bold text-xs sm:text-[13px] rounded-lg shadow-xs border border-blue-200 hover:scale-105 transition-transform"
                  >
                    {bank}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 8:
        // Pan India Funding (Oceanic Blue & Warm Amber)
        return (
          <div className="py-6 px-4 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">
            <div className="flex-1 space-y-3">
              <span className="inline-block px-3.5 py-1 bg-orange-500 text-white font-extrabold text-[11px] rounded-full uppercase tracking-wider shadow-sm">
                NATIONWIDE REACH
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight leading-tight">
                PAN INDIA FUNDING
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm font-normal">
                Disbursing loans across Tier-1 metros, Tier-2 hubs, and Tier-3 smart cities.
              </p>

              <div className="bg-white/95 border border-orange-200 rounded-xl p-4 space-y-2.5 max-w-md shadow-md text-slate-800">
                <div className="flex items-center gap-2.5 text-xs sm:text-[13px] font-semibold">
                  <MapPin size={15} className="text-orange-500 shrink-0 fill-orange-500/20" />
                  <span>Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-[13px] font-semibold">
                  <MapPin size={15} className="text-orange-500 shrink-0 fill-orange-500/20" />
                  <span>Pune, Kolkata, Ahmedabad, Jaipur, Chandigarh &amp; All States</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-yellow-300 p-1 flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.4)]">
                <div className="w-full h-full rounded-full bg-[#081832] flex items-center justify-center border border-amber-300/40">
                  <Globe size={64} className="text-amber-300 stroke-[1.8]" />
                </div>
              </div>
            </div>
          </div>
        );

      case 9:
        // 4th Grade Employed (Pacific Blue & Emerald)
        return (
          <div className="py-4 px-2 sm:px-6 flex justify-center">
            <div className="w-full max-w-xl bg-white/95 border border-emerald-200 rounded-2xl p-6 sm:p-8 text-center shadow-xl">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Users size={24} className="text-emerald-700" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
                4th Grade Employee Loans
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto mb-5 font-normal">
                Drivers, Security Staff, Office Assistants &amp; Skilled Workers with official salary credit in bank accounts are eligible for instant approval.
              </p>

              <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs sm:text-sm shadow-xs">
                <Zap size={15} className="fill-emerald-600 text-emerald-600" />
                <span>Special NBFC Approval Rate: 95%</span>
              </div>
            </div>
          </div>
        );

      case 10:
        // All Banks Digital Login (Electric Indigo & 30-min Speed)
        return (
          <div className="py-4 px-2 sm:px-6 flex justify-center">
            <div className="w-full max-w-xl bg-white/95 border border-indigo-200 rounded-2xl p-6 sm:p-8 text-center shadow-xl">
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Timer size={36} className="text-indigo-700" />
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
                ALL BANKS DIGITAL LOGIN
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 font-normal mb-5">
                Fastest Turnaround Time in the Indian Telecalling Industry
              </p>

              <div className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md transition-transform">
                <Zap size={15} className="fill-white text-white" />
                <span>LOGIN IN UNDER 30 MINS</span>
              </div>
            </div>
          </div>
        );

      case 11:
        // Personal Loan Incentive Slabs (For Telecaller • Structure For Variable Fees)
        return (
          <div className="py-4 px-2 sm:px-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <span className="inline-block px-3 py-0.5 bg-lime-400 text-blue-950 font-black text-[10.5px] rounded-full uppercase tracking-wider mb-1 shadow-xs">
                  VARIABLE FEES STRUCTURE
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  For Telecaller: Personal Loan Incentive
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBenefitsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-lime-300 border border-lime-400/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Award size={14} />
                <span>Open Incentive Table</span>
              </button>
            </div>

            {/* 8 Slabs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
              {[
                { slab: "SLAB 1", disbursal: "30 Lacs", amt: "₹4,000" },
                { slab: "SLAB 2", disbursal: "40 Lacs", amt: "₹10,000" },
                { slab: "SLAB 3", disbursal: "50 Lacs", amt: "₹15,000" },
                { slab: "SLAB 4", disbursal: "60 Lacs", amt: "₹20,000" },
                { slab: "SLAB 5", disbursal: "70 Lacs", amt: "₹25,000" },
                { slab: "SLAB 6", disbursal: "80 Lacs", amt: "₹30,000" },
                { slab: "SLAB 7", disbursal: "90 Lacs", amt: "₹40,000" },
                { slab: "SLAB 8", disbursal: "100 Lacs", amt: "₹50,000", max: true },
              ].map((item) => (
                <div
                  key={item.slab}
                  className={`p-3 rounded-xl border text-center shadow-xs transition-all ${
                    item.max
                      ? "bg-gradient-to-b from-amber-400 to-yellow-300 text-blue-950 border-amber-300 font-bold scale-[1.02]"
                      : "bg-white/95 text-slate-800 border-slate-200"
                  }`}
                >
                  <div
                    className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${
                      item.max ? "text-blue-950" : "text-blue-600"
                    }`}
                  >
                    {item.slab}
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    {item.disbursal}
                  </div>
                  <div
                    className={`text-base font-black mt-1 ${
                      item.max ? "text-blue-950" : "text-emerald-700"
                    }`}
                  >
                    {item.amt}
                  </div>
                </div>
              ))}
            </div>

            {/* Above Slab per lakh Highlight Banner */}
            <div className="p-3 rounded-xl bg-white/95 border border-lime-300 flex items-center justify-between gap-3 text-xs sm:text-sm shadow-md">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Above Slab per lakh:</span>
              </div>
              <div className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-xs">
                Rs. 250 (for ARO)
              </div>
            </div>
          </div>
        );

      case 12:
        // Process Manager Support (Royal Blue & Wine Rose)
        return (
          <div className="py-4 px-2 sm:px-6 flex justify-center">
            <div className="w-full max-w-xl bg-white/95 border border-pink-200 rounded-2xl p-6 sm:p-8 text-center shadow-xl">
              <div className="w-14 h-14 rounded-full bg-pink-100 border border-pink-200 text-pink-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Headphones size={28} className="text-pink-600 stroke-[2.2]" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
                DIRECT PROCESS MANAGER SUPPORT
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 mb-2 font-normal">
                Dedicated Manager: <span className="font-bold text-blue-900">{PROCESS_MANAGER_NAME} ({PROCESS_MANAGER_PHONE})</span>
              </p>

              <p className="text-xs text-slate-600 leading-relaxed font-normal max-w-md mx-auto">
                Customer has a tricky question? Request an immediate manager call takeover or 3-way conference to seal the deal!
              </p>
            </div>
          </div>
        );

      case 13:
        // Join & Earn (Navy & Sunburst Amber)
        return (
          <div className="py-4 px-2 sm:px-6 max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight text-center mb-6">
              3 STEPS TO START EARNING
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white/95 border border-amber-200 rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-md">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-blue-950 font-black text-xs flex items-center justify-center mx-auto mb-3 shadow-xs">
                  1
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  Complete Training
                </div>
              </div>

              <div className="bg-white/95 border border-amber-200 rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-md">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-blue-950 font-black text-xs flex items-center justify-center mx-auto mb-3 shadow-xs">
                  2
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  Practice Script
                </div>
              </div>

              <div className="bg-white/95 border border-amber-200 rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-md">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-blue-950 font-black text-xs flex items-center justify-center mx-auto mb-3 shadow-xs">
                  3
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  Start Calling &amp; Earn
                </div>
              </div>
            </div>
          </div>
        );

      case 14:
        // Sample Calling Script (Clean Azure & Sky Cyan)
        return (
          <div className="py-4 px-2 sm:px-6 flex justify-center">
            <div className="w-full max-w-xl bg-white/95 border border-sky-200 rounded-2xl p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs sm:text-sm font-black text-blue-900 tracking-wider uppercase">
                  TELECALLER CALL FLOW SCRIPT
                </span>
                <button
                  type="button"
                  onClick={() => setScriptModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Open Full Script
                </button>
              </div>

              <div className="space-y-3 mt-4 text-xs sm:text-[13px] leading-relaxed">
                <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-100">
                  <span className="text-blue-700 font-bold">Step 1: </span>
                  <span className="text-slate-800 font-medium">&quot;Namaste Sir, {COMPANY_NAME} se [Name] baat kar raha hu.&quot;</span>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-100">
                  <span className="text-blue-700 font-bold">Step 2: </span>
                  <span className="text-slate-800 font-medium">&quot;Aapko Pre-approved Personal Loan offer mil rha h.&quot;</span>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-100">
                  <span className="text-blue-700 font-bold">Step 3: </span>
                  <span className="text-slate-800 font-medium">&quot;Lowest interest rate 9.95% se shuru hai.&quot;</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 15:
        // Do's & Don'ts (Dual Contrast)
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 px-2 sm:px-6 max-w-3xl mx-auto">
            {/* DO'S */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white/95 border border-emerald-300 text-xs sm:text-sm text-slate-800 flex flex-col justify-between shadow-lg">
              <div className="font-black text-emerald-700 text-sm sm:text-base flex items-center gap-2 mb-3.5">
                <CheckCircle2 size={18} className="text-emerald-600 fill-emerald-600/20" />
                <span>DO&apos;S (Follow Strictly)</span>
              </div>
              <ul className="space-y-2.5 list-none p-0 m-0 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Always greet customer with utmost courtesy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Verify monthly salary and banking eligibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Explain accurate ROI &amp; tenure transparently</span>
                </li>
              </ul>
            </div>

            {/* DON'TS */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white/95 border border-rose-300 text-xs sm:text-sm text-slate-800 flex flex-col justify-between shadow-lg">
              <div className="font-black text-rose-700 text-sm sm:text-base flex items-center gap-2 mb-3.5">
                <XCircle size={18} className="text-rose-600 fill-rose-600/20" />
                <span>DON&apos;TS (Strictly Prohibited)</span>
              </div>
              <ul className="space-y-2.5 list-none p-0 m-0 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Never ask for cash upfront or advance fee</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Don&apos;t argue with or interrupt the borrower</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Never quote incorrect or deceptive interest rates</span>
                </li>
              </ul>
            </div>
          </div>
        );

      case 16:
        // Congratulations / Certification
        return (
          <div className="flex flex-col items-center justify-center text-center py-6 px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-300 text-blue-950 flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Trophy size={36} className="text-blue-950 fill-blue-950" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-yellow-300 tracking-tight mb-2">
              CONGRATULATIONS!
            </h2>

            <p className="text-xs sm:text-sm text-blue-100 max-w-md mb-5 leading-relaxed font-normal">
              You have completed all 16 modules of {COMPANY_NAME} New Caller Training! You are now fully certified to speak with live prospects.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  playChime(440);
                  setTrainingStep(1);
                  setAnimatingKey((k) => k + 1);
                  scrollToTop(true);
                }}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-white text-blue-950 font-bold text-xs shadow-md border border-white hover:bg-blue-50 hover:scale-105 active:scale-[0.98] transition-all cursor-pointer"
              >
                <RotateCcw size={14} className="text-blue-900 stroke-[2.5]" />
                <span>Restart Training</span>
              </button>

              <button
                type="button"
                onClick={() => setScriptModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-yellow-400 text-blue-950 font-black text-xs shadow-md hover:bg-yellow-300 hover:scale-105 active:scale-[0.98] transition-all cursor-pointer"
              >
                <FileEdit size={14} className="text-blue-950 stroke-[2.5]" />
                <span>Practice Script</span>
              </button>
            </div>
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
      {/* Top Header Bar - Clean Blue & White Financial Theme */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-blue-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {COMPANY_NAME} Caller Academy
            </h1>
            <p className="text-xs text-slate-500">
              16 interactive voice-guided learning modules with realistic trainer audio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={scrollToIndex}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all cursor-pointer border border-blue-100"
          >
            <LayoutGrid size={14} />
            <span>Modules Index (16)</span>
          </button>

          <button
            type="button"
            onClick={scrollToPlayer}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <Play size={14} />
            <span>Slide Player ({trainingStep}/16)</span>
          </button>
        </div>
      </div>

      {/* ===================== 1. INTERACTIVE SLIDE PLAYER (BLUE & WHITE BASE + SLIDE-SPECIFIC THEME) ===================== */}
      <div id="training-slide-player" className="space-y-3 scroll-mt-6">
        {/* Dynamic Canvas Container */}
        <div
          className={`${currentTheme.canvasGradient} rounded-2xl shadow-xl border ${currentTheme.borderGlow} overflow-hidden flex flex-col justify-between min-h-[460px] relative transition-all duration-300`}
        >
          {/* Slide Header Bar with custom theme accents */}
          <div
            className={`px-4 sm:px-6 py-3.5 border-b flex items-center justify-between gap-3 ${currentTheme.headerBarBg}`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full ${currentTheme.accentDotClass} animate-pulse shrink-0`} />
              <span
                className={`px-2.5 py-1 text-[10.5px] sm:text-[11px] rounded-md tracking-wider uppercase shrink-0 ${currentTheme.stepBadgeClass}`}
              >
                {currentSlide.stepLabel}
              </span>
              <span className="text-sm sm:text-base font-bold text-white truncate">
                {currentSlide.title}
              </span>
            </div>

            {/* Audio Voice Status Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  !audioAssistEnabled
                    ? "bg-black/30 text-slate-400 border border-white/10"
                    : isSpeaking
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                    : "bg-white/10 text-white border border-white/20"
                }`}
              >
                {!audioAssistEnabled ? (
                  <>
                    <VolumeX size={13} className="text-slate-400" />
                    <span>Audio Muted</span>
                  </>
                ) : isSpeaking ? (
                  <>
                    <Volume2 size={13} className="text-emerald-300 animate-pulse" />
                    <span>Trainer Speaking...</span>
                  </>
                ) : (
                  <>
                    <Headphones size={13} className="text-blue-200" />
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

          {/* Voice Quote Banner (Themed to current slide) */}
          <div className="px-3 sm:px-6 pb-4">
            <div
              onClick={speakCurrentSlide}
              className={`rounded-xl p-3.5 sm:p-4 flex items-start sm:items-center gap-3 cursor-pointer transition-all shadow-inner group ${currentTheme.quoteBoxBg}`}
              title="Click to replay realistic trainer voice"
            >
              <button
                type="button"
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform cursor-pointer ${currentTheme.quoteBtnBg}`}
                aria-label="Replay voice narration"
              >
                <Volume2 size={16} />
              </button>
              <p className={`text-xs sm:text-[13.5px] font-medium leading-relaxed ${currentTheme.quoteTextClass}`}>
                {currentSlide.quote}
              </p>
            </div>
          </div>

          {/* Thematic Slide Progress Indicator Line */}
          <div className="w-full h-1.5 bg-black/30 relative">
            <div
              className={`h-full ${currentTheme.progressBarClass} transition-all duration-300`}
              style={{ width: `${(trainingStep / 16) * 100}%` }}
            />
          </div>
        </div>

        {/* Bottom Controls Bar - Crisp Blue & White Financial Theme */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-blue-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left Controls: Replay Animation & Auto-Advance */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={handleReplay}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 text-blue-900 hover:bg-blue-50 font-semibold text-xs transition-colors cursor-pointer shadow-2xs active:scale-[0.98]"
              id="replay-animation-btn"
            >
              <RotateCcw size={14} className="text-blue-700" />
              <span>Replay Audio</span>
            </button>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-blue-50/50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
              />
              <span>Auto-Advance Step</span>
            </label>
          </div>

          {/* Center Status: X / 16 COMPLETED */}
          <div className="text-xs font-bold text-slate-600 tracking-wider">
            MODULE <span className="text-blue-600 text-sm font-black">{trainingStep}</span> OF 16
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
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 active:scale-[0.98]"
              }`}
              id="training-previous-btn"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
              id="training-next-btn"
            >
              <span>{trainingStep === 16 ? "Finish Training" : "Next Step"}</span>
              {trainingStep === 16 ? <Check size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* ===================== 2. TRAINING SLIDES INDEX (16 CARDS WITH DISTINCT THEME PALETTES) ===================== */}
      <div id="training-slides-index" className="space-y-4 pt-2">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              <Layers size={18} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Training Slides Index
              </h2>
              <p className="text-xs text-slate-500">
                Each module features a unique color profile within the Blue and White financial curriculum. Click to learn or replay.
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
            const theme = SLIDE_THEMES[slide.id] || SLIDE_THEMES[1];

            return (
              <div
                key={slide.id}
                onClick={() => handleSelectModuleFromIndex(slide.id)}
                className={`group rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${
                  theme.indexCardBg
                } ${
                  isCurrent
                    ? theme.indexActiveRing
                    : `${theme.indexCardBorder} hover:shadow-sm`
                }`}
              >
                {/* Card Header: Number Circle & Title */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${theme.indexBadgeBg}`}
                      >
                        {slide.id}
                      </span>
                      <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug line-clamp-1">
                        {slide.title}
                      </h3>
                    </div>
                    {isCompleted ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <span className={`text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded ${theme.indexTagBg}`}>
                        {theme.categoryTag}
                      </span>
                    )}
                  </div>

                  {/* Card Content & Icon */}
                  <div className="flex items-start gap-3 my-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs ${theme.indexIconBg}`}>
                      {slide.icon}
                    </div>
                    <p className="text-[11.5px] text-slate-600 line-clamp-2 leading-relaxed font-normal">
                      {slide.subtitle}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-400 font-semibold text-[11px]">
                    Module {slide.id}
                  </span>
                  <span className={`font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 ${theme.indexActionText}`}>
                    {isCurrent ? "Playing ▶" : "Learn →"}
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
