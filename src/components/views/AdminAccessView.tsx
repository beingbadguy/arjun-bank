"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Lock,
  UserPlus,
  ShieldCheck,
  Key,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  UserCheck,
  UserX,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  role: "superadmin" | "operator" | "analyst";
  status: "active" | "inactive";
  createdBy: string;
  createdAt: string;
  lastLogin?: string;
}

export const AdminAccessView: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { setActiveTab } = useWorkspaceStore();

  const [mounted, setMounted] = useState<boolean>(false);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [newRole, setNewRole] = useState<"operator" | "analyst" | "superadmin">("operator");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState<ManagedUser | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState<string>("");

  const isSuperadmin = currentUser?.role === "superadmin";
  const isAdminPath = typeof window !== "undefined" && window.location.pathname === "/admin";
  const hasAccess = isSuperadmin || isAdminPath;

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setErrorMessage(data.error || "Failed to load user list");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchUsers();
    }
  }, [hasAccess]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`User "${newName}" (${newEmail}) created successfully.`);
        setShowCreateModal(false);
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("operator");
        fetchUsers();
      } else {
        setErrorMessage(data.error || "Failed to create user");
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: ManagedUser) => {
    const nextStatus = user.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`User status changed to ${nextStatus}.`);
        fetchUsers();
      } else {
        setErrorMessage(data.error || "Failed to update user");
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !resetNewPassword) return;

    try {
      const res = await fetch(`/api/admin/users/${resetModalUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetNewPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Password updated for ${resetModalUser.email}`);
        setResetModalUser(null);
        setResetNewPassword("");
      } else {
        setErrorMessage(data.error || "Failed to reset password");
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  const handleDeleteUser = async (user: ManagedUser) => {
    if (!confirm(`Are you sure you want to delete user ${user.name} (${user.email})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message || "User deleted");
        fetchUsers();
      } else {
        setErrorMessage(data.error || "Failed to delete user");
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  if (!hasAccess) {
    return (
      <div className="p-6 md:p-10 max-w-6xl mx-auto w-full animate-fade-in">
        <div className="bg-[#FDF4F4] border border-[#F3C5C5] rounded-2xl p-14 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#FDE8E8] text-[#C53030] flex items-center justify-center mb-4">
            <Lock size={24} />
          </div>
          <h3 className="text-lg font-bold text-[#9B1C1C] mb-1.5">
            Superadmin Access Required
          </h3>
          <p className="text-sm text-[#576558] mb-6">
            Your current account role does not have authorization to view or manage user accounts.
          </p>
          <button
            type="button"
            className="px-6 py-2.5 bg-[#163A2C] text-white rounded-lg text-sm font-semibold cursor-pointer"
            onClick={() => setActiveTab("overview")}
          >
            Return to Overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
      {/* View Header */}
      <div className="mb-4">
        <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1">
          MANAGEMENT / ADMIN ACCESS
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-[26px] font-semibold tracking-tight text-[#17241B] mb-1">
              Admin access &amp; user management.
            </h1>
            <p className="text-xs md:text-[13px] text-[#576558]">
              Control access permissions and provision accounts for loan operations teams.
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

      {/* Security Policy Notice Banner */}
      <div className="bg-[#163A2C] text-white rounded-xl p-3.5 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 shadow-md shadow-[#163A2C]/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 text-[#DCE8D7] flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">
              Restricted Account Provisioning Enabled
            </div>
            <div className="text-[11.5px] text-[#B8CDB7] mt-0.5">
              Public registration is strictly disabled. Only you (the Superadmin) can create and manage user credentials.
            </div>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 bg-[#DCE8D7] hover:bg-white text-[#163A2C] px-3.5 h-8 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-xs active:scale-[0.99]"
          onClick={() => {
            setShowCreateModal(true);
            generateRandomPassword();
          }}
        >
          <UserPlus size={14} />
          <span>Create User</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {successMessage && (
        <div className="mb-3.5 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle size={15} className="shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mb-3.5 p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#E3EBE0] p-4 md:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs md:text-sm font-bold text-[#17241B]">
            Provisioned Workspace Accounts ({users.length})
          </h3>
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E3EBE0] hover:bg-[#F5F8F4] rounded-lg text-xs font-semibold text-[#17241B] transition-colors cursor-pointer"
            onClick={fetchUsers}
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-6 text-xs text-[#829283]">
            Loading users from MongoDB...
          </div>
        ) : (
          <div className="border border-[#E3EBE0] rounded-xl overflow-x-auto">
            <table className="w-full min-w-[580px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAF6] border-b border-[#ECEFE9] text-[#829283] text-[10px] font-bold tracking-wider uppercase">
                  <th className="py-2.5 px-3">User / Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last Login</th>
                  <th className="py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrent = u._id === currentUser?.id;
                  return (
                    <tr key={u._id} className="border-b border-[#ECEFE9] last:border-b-0 hover:bg-[#FBFDFB] transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#17241B]">
                          {u.name} {isCurrent && <span className="text-[11px] text-[#829283] font-normal">(You)</span>}
                        </div>
                        <div className="text-[10.5px] text-[#829283]">
                          Created by: {u.createdBy}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-[#576558]">
                        {u.email}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            u.role === "superadmin"
                              ? "bg-[#DCF2E4] text-[#17653C]"
                              : u.role === "analyst"
                              ? "bg-[#E2ECFE] text-[#1E4E9E]"
                              : "bg-[#F1F5EF] text-[#2C4A38]"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {u.status === "active" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#196D29] bg-[#E7F6E7] px-1.5 py-0.5 rounded">
                            <UserCheck size={10} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B91C1C] bg-[#FCE8E8] px-1.5 py-0.5 rounded">
                            <UserX size={10} /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-[#829283]">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Never"}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {/* Toggle Active */}
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                                u.status === "active"
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                    : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              }`}
                            >
                              {u.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                          )}

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalUser(u);
                              setResetNewPassword("");
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F2F6F0] hover:bg-[#E4EDE1] text-[#163A2C] text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <Key size={11} />
                            <span>Reset Pwd</span>
                          </button>

                          {/* Delete User */}
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete user"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal - Teleported directly to document.body to cover the entire page */}
      {showCreateModal && mounted && createPortal(
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card max-w-sm w-full mx-3" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header pb-3 mb-3">
              <div>
                <h3 className="modal-title text-base">Create New User</h3>
                <div className="text-[11px] text-[#829283]">
                  Only the Superadmin can issue credentials.
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#17241B] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full h-9 px-3 border border-[#E3EBE0] rounded-lg bg-white text-xs text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-2 focus:ring-[#163A2C]/10 transition-all"
                  placeholder="e.g. Priya Nair"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#17241B] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full h-9 px-3 border border-[#E3EBE0] rounded-lg bg-white text-xs text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-2 focus:ring-[#163A2C]/10 transition-all"
                  placeholder="e.g. priya.nair@loanops.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-semibold text-[#17241B]">
                    Initial Password
                  </label>
                  <button
                    type="button"
                    className="text-[11px] text-[#163A2C] font-semibold hover:underline cursor-pointer"
                    onClick={generateRandomPassword}
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  className="w-full h-9 px-3 border border-[#E3EBE0] rounded-lg bg-white text-xs text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-2 focus:ring-[#163A2C]/10 transition-all font-mono"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <div className="text-[10px] text-[#829283] mt-0.5">
                  Provide this password to the new team member so they can log in.
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#17241B] mb-1">
                  Role
                </label>
                <select
                  className="w-full h-9 px-2.5 border border-[#E3EBE0] rounded-lg bg-white text-xs text-[#17241B] outline-none cursor-pointer"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                >
                  <option value="operator">Operator (Search, EMI, PIN &amp; PDF Tools)</option>
                  <option value="analyst">Credit Analyst (Full Loan Operations &amp; Relook)</option>
                  <option value="superadmin">Superadmin (Full Control + User Management)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#ECEFE9]">
                <button
                  type="button"
                  className="flex-1 h-9 bg-white border border-[#E3EBE0] hover:bg-[#F5F8F4] text-[#17241B] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-9 bg-[#163A2C] hover:bg-[#102B21] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Reset Password Modal - Teleported directly to document.body to cover the entire page */}
      {resetModalUser && mounted && createPortal(
        <div className="modal-overlay" onClick={() => setResetModalUser(null)}>
          <div className="modal-card max-w-sm w-full mx-3" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header pb-3 mb-3">
              <div>
                <h3 className="modal-title text-base">Reset Password</h3>
                <div className="text-[11px] text-[#829283]">
                  For {resetModalUser.name} ({resetModalUser.email})
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setResetModalUser(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#17241B] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full h-9 px-3 border border-[#E3EBE0] rounded-lg bg-white text-xs text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-2 focus:ring-[#163A2C]/10 transition-all font-mono"
                  placeholder="Enter at least 6 characters"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#ECEFE9]">
                <button
                  type="button"
                  className="flex-1 h-9 bg-white border border-[#E3EBE0] hover:bg-[#F5F8F4] text-[#17241B] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  onClick={() => setResetModalUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-9 bg-[#163A2C] hover:bg-[#102B21] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
