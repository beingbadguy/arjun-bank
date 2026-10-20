"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Key,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AdminAccessView } from "@/components/views/AdminAccessView";
import { SupportDeskModal } from "@/components/modals/SupportDeskModal";
import { CallingScriptModal } from "@/components/modals/CallingScriptModal";
import { BenefitsModal } from "@/components/modals/BenefitsModal";

export default function AdminAccessPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCheckingInitial, setIsCheckingInitial] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { fetchMe } = useAuthStore();
  const { setActiveTab } = useWorkspaceStore();

  // Check on mount if admin access is already unlocked in current session
  useEffect(() => {
    setActiveTab("admin-access", false);
    fetchMe();

    const checkStatus = async () => {
      try {
        const stored = sessionStorage.getItem("admin_access_unlocked");
        if (stored === "true") {
          setIsUnlocked(true);
          setIsCheckingInitial(false);
          return;
        }

        const res = await fetch("/api/vault/verify");
        const data = await res.json();
        if (data.unlocked) {
          sessionStorage.setItem("admin_access_unlocked", "true");
          setIsUnlocked(true);
        }
      } catch (err) {
        console.error("Failed to check admin vault status", err);
      } finally {
        setIsCheckingInitial(false);
      }
    };

    checkStatus();
  }, [fetchMe, setActiveTab]);

  // Focus input when lock screen appears
  useEffect(() => {
    if (!isUnlocked && !isCheckingInitial) {
      inputRef.current?.focus();
    }
  }, [isUnlocked, isCheckingInitial]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage("Please enter the admin security password.");
      inputRef.current?.focus();
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/vault/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem("admin_access_unlocked", "true");
        setIsUnlocked(true);
        setPassword("");
        // Refresh auth state so superadmin role is active
        await fetchMe();
      } else {
        setErrorMessage(data.error || "Incorrect password. Access denied.");
        setPassword("");
        inputRef.current?.focus();
      }
    } catch {
      setErrorMessage("Network error during verification. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLockAdmin = async () => {
    try {
      await fetch("/api/vault/verify", { method: "DELETE" });
    } catch (e) {
      console.error("Lock error", e);
    }
    sessionStorage.removeItem("admin_access_unlocked");
    setIsUnlocked(false);
    setPassword("");
    setErrorMessage(null);
  };

  if (isCheckingInitial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9F5] gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#163A2C] text-[#DCE8D7] flex items-center justify-center font-bold text-lg font-mono shadow-xs animate-pulse">
          ag.
        </div>
        <div className="text-xs font-semibold text-[#829283] tracking-wide">
          Verifying administrative credentials...
        </div>
      </div>
    );
  }

  // PASSWORD GATE: When admin access is locked
  if (!isUnlocked) {
    return (
      <div className="min-h-screen w-full bg-[#F8F9F5] flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#163A2C]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-white border border-[#DCE4D9] rounded-2xl shadow-xl p-6 sm:p-8 relative z-10 animate-fade-in">
          {/* Key Icon & Badge */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#163A2C] text-[#DCE8D7] flex items-center justify-center shadow-md mb-4 relative">
              <Key size={26} />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#257853] text-white flex items-center justify-center border-2 border-white">
                <Lock size={10} />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF4E9] border border-[#D6E4D3] text-[#163A2C] text-[11px] font-bold uppercase tracking-wider mb-2">
              <ShieldCheck size={13} className="text-[#257853]" />
              <span>Restricted Security Zone</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17241B]">
              Admin Access Control
            </h1>
            <p className="text-xs sm:text-sm text-[#576558] mt-1.5 leading-relaxed">
              Enter master security password to provision user accounts &amp; configure permissions.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800 animate-fade-in">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="admin-password"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#576558] mb-1.5"
              >
                Admin Master Password
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter admin password"
                  disabled={isVerifying}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE4D9] bg-[#FAFCF9] text-sm text-[#17241B] placeholder:text-[#9AA89A] focus:outline-hidden focus:border-[#163A2C] focus:ring-2 focus:ring-[#163A2C]/15 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#7B8B7C] hover:text-[#17241B] transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || !password}
              className="w-full py-2.5 px-4 rounded-xl bg-[#163A2C] hover:bg-[#102B21] disabled:bg-[#163A2C]/50 text-[#DCE8D7] hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 mt-1"
            >
              {isVerifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Master Password...</span>
                </>
              ) : (
                <>
                  <Unlock size={15} />
                  <span>Unlock Admin Access</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Return link */}
          <div className="mt-6 pt-5 border-t border-[#EEF2EB] text-center">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#576558] hover:text-[#163A2C] transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Return to Workspace Overview</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // UNLOCKED VIEW: Full Workspace with AdminAccessView and Lock Button
  return (
    <Suspense fallback={null}>
      <div className="app-container">
        <Sidebar />
        <div className="app-main">
          {/* Top Master Security Ribbon */}
          <div className="bg-[#163A2C] text-[#DCE8D7] px-3.5 sm:px-6 py-2 flex items-center justify-between text-xs font-semibold shadow-xs z-30 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-bold tracking-wide">
                🔒 ADMIN ACCESS ACTIVE
              </span>
              <span className="hidden md:inline text-xs text-[#A8BAA5]">
                • Route: /admin • Authorized session
              </span>
            </div>
            <button
              type="button"
              onClick={handleLockAdmin}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all cursor-pointer border border-white/15"
              title="Lock admin access and exit"
            >
              <Lock size={12} />
              <span>Lock Admin Access</span>
            </button>
          </div>

          <Header />
          <main className="flex-1 w-full min-w-0 pb-20 sm:pb-10">
            <AdminAccessView />
          </main>
        </div>
      </div>
      <SupportDeskModal />
      <CallingScriptModal />
      <BenefitsModal />
    </Suspense>
  );
}
