"use client";

import React, { useState } from "react";
import { ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export const LoginView: React.FC = () => {
  const { login, error, isLoading, clearError } = useAuthStore();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(email, password);
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex items-center justify-center p-3.5 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl border border-[#E3EBE0] shadow-[0_12px_36px_rgba(22,58,44,0.08)] p-5 sm:p-8 md:p-10 animate-fade-in">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="bg-[#163A2C] text-white w-8 sm:w-9 h-8 sm:h-9 rounded-lg flex items-center justify-center font-bold text-base sm:text-lg tracking-tight">
            ag.
          </div>
          <div className="flex flex-col">
            <div className="text-xs sm:text-sm font-bold text-[#17241B] leading-tight tracking-tight">
              arjungrewal.online
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold tracking-widest text-[#829283] uppercase">
              LOAN OPERATIONS
            </div>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17241B] mb-1.5">
          Welcome back.
        </h1>
        <p className="text-xs sm:text-sm text-[#576558] mb-5 sm:mb-6">
          Sign in to access your loan operations workspace.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17241B] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              className="w-full h-10 sm:h-11 px-3 sm:px-3.5 border border-[#E3EBE0] rounded-lg bg-white text-base sm:text-sm text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-2 focus:ring-[#163A2C]/10 transition-all placeholder:text-[#9AAB9B]"
              placeholder="name@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17241B] mb-1.5">
              Password
            </label>
            <input
              type="password"
              className="w-full h-10 sm:h-11 px-3 sm:px-3.5 border border-[#E3EBE0] rounded-lg bg-white text-base sm:text-sm text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-2 focus:ring-[#163A2C]/10 transition-all placeholder:text-[#9AAB9B]"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="w-full h-10 sm:h-11 bg-[#163A2C] hover:bg-[#102B21] text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer mt-2 active:scale-[0.99]"
            disabled={isLoading}
          >
            <span>{isLoading ? "Authenticating..." : "Sign In to Workspace"}</span>
            {!isLoading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Restricted Sign Up Policy Callout */}
        <div className="mt-6 pt-5 border-t border-[#ECEFE9] flex items-start gap-2.5 text-[11.5px] text-[#829283] leading-relaxed">
          <ShieldCheck size={16} className="text-[#347C56] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#576558]">Restricted Access:</strong> Public signup is disabled. User accounts can only be provisioned internally by the Superadmin.
          </div>
        </div>
      </div>
    </div>
  );
};
