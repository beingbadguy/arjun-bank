"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Link2,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Search,
  Pencil,
  Trash2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  Info,
  Building2,
  Hash,
  Share2,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { clientCache } from "@/lib/clientCache";

export interface UtmLinkData {
  _id: string;
  tagName: string;
  url: string;
  category?: string;
  description?: string;
  clicks?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const UtmLinksView: React.FC = () => {
  const { user } = useAuthStore();
  const isSuperadmin = user?.role === "superadmin";

  const [links, setLinks] = useState<UtmLinkData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status notifications
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingLink, setEditingLink] = useState<UtmLinkData | null>(null);
  const [formTagName, setFormTagName] = useState<string>("");
  const [formUrl, setFormUrl] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("Poonawalla Fincorp");
  const [formDescription, setFormDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Confirmation Modal state
  const [deletingLink, setDeletingLink] = useState<UtmLinkData | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch active UTM links
  const fetchLinks = async () => {
    const cached = clientCache.get<{ success: boolean; links: UtmLinkData[] }>(
      "/api/utm-links"
    );
    if (cached && cached.success) {
      setLinks(cached.links || []);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/utm-links");
      const data = await res.json();
      if (res.ok && data.success) {
        setLinks(data.links || []);
        clientCache.set("/api/utm-links", data, 60_000);
      } else {
        setErrorMessage(data.error || "Failed to load UTM links.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect to server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  // Compute available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    links.forEach((l) => {
      if (l.category && l.category.trim()) {
        set.add(l.category.trim());
      }
    });
    return ["all", ...Array.from(set)];
  }, [links]);

  // Filtered links
  const filteredLinks = useMemo(() => {
    return links.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.tagName?.toLowerCase().includes(q) ||
        item.url?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    });
  }, [links, selectedCategory, searchQuery]);

  // Click & Redirect Handler (Opens in a New Tab)
  const handleOpenLink = (link: UtmLinkData) => {
    if (!link.url) return;
    // Log click asynchronously in background
    try {
      fetch("/api/utm-links/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link._id }),
      }).catch(() => {});
    } catch {}

    // Open target in new tab
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  // Copy to clipboard
  const handleCopyLink = async (link: UtmLinkData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link._id);
      setStatusMessage(`Copied "${link.tagName}" link to clipboard!`);
      setTimeout(() => {
        setCopiedId(null);
        setStatusMessage(null);
      }, 3000);
    } catch {
      setErrorMessage("Failed to copy link to clipboard.");
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingLink(null);
    setFormTagName("");
    setFormUrl("");
    setFormCategory("Poonawalla Fincorp");
    setFormDescription("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (link: UtmLinkData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingLink(link);
    setFormTagName(link.tagName);
    setFormUrl(link.url);
    setFormCategory(link.category || "Poonawalla Fincorp");
    setFormDescription(link.description || "");
    setIsModalOpen(true);
  };

  // Open Delete Confirmation
  const handleOpenDeleteModal = (link: UtmLinkData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingLink(link);
  };

  // Save Link (Create or Update)
  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTagName.trim() || !formUrl.trim()) {
      setErrorMessage("Please fill in both Tag Name and Destination URL.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const isEdit = Boolean(editingLink);
    const method = isEdit ? "PUT" : "POST";
    const payload = {
      ...(isEdit ? { id: editingLink?._id } : {}),
      tagName: formTagName.trim(),
      url: formUrl.trim(),
      category: formCategory.trim(),
      description: formDescription.trim(),
    };

    try {
      const res = await fetch("/api/utm-links", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        clientCache.clear();
        setStatusMessage(resData.message || "UTM Link saved successfully!");
        setIsModalOpen(false);
        await fetchLinks();
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setErrorMessage(resData.error || "Failed to save UTM link.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Soft-Delete -> Moves to Recycle Bin
  const handleConfirmDelete = async () => {
    if (!deletingLink) return;

    setIsDeleting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/utm-links?id=${deletingLink._id}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        clientCache.clear();
        setStatusMessage(
          `"${deletingLink.tagName}" has been moved to the Recycle Bin.`
        );
        setDeletingLink(null);
        await fetchLinks();
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        setErrorMessage(resData.error || "Failed to delete UTM link.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to parse query parameters from a URL for preview badges
  const parseQueryParams = (urlStr: string) => {
    try {
      const url = new URL(urlStr);
      const entries: { key: string; value: string }[] = [];
      url.searchParams.forEach((val, key) => {
        entries.push({ key, value: val });
      });
      return entries;
    } catch {
      return [];
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in space-y-6">
      {/* Top Banner / Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-[#163A2C] via-[#1A4534] to-[#123125] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_top_right,rgba(220,232,215,0.12),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md text-[#DCE8D7] border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#DCE8D7]" />
              <span>DSA Redirection &amp; Campaign Links</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              UTM Links Directory
            </h1>

            <p className="text-xs sm:text-sm text-[#B8CDB7] leading-relaxed">
              Access and share verified lender campaign links with DSA tracking parameters. 
              Clicking any card immediately redirects you to the link in a new tab. 
              {isSuperadmin ? " As an administrator, you have full CRUD permissions." : " Read-only view for workspace users."}
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isSuperadmin && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#DCE8D7] text-[#163A2C] hover:bg-white transition-all shadow-sm cursor-pointer active:scale-[0.98]"
                id="btn-add-utm-link"
              >
                <Plus className="w-4 h-4" />
                <span>Add UTM Link</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchLinks}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh links"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-[#B8CDB7] font-medium flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-[#DCE8D7]" />
              Active UTM Links
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
              {links.length}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-[#B8CDB7] font-medium flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#DCE8D7]" />
              Lenders &amp; Partners
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
              {Math.max(0, categories.length - 1)}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-[#B8CDB7] font-medium flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#DCE8D7]" />
              Filtered Results
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
              {filteredLinks.length}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-[#B8CDB7] font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#DCE8D7]" />
              Access Level
            </div>
            <div className="text-xs sm:text-sm font-bold font-mono text-[#DCE8D7] mt-1.5 uppercase">
              {isSuperadmin ? "Full Admin (CRUD)" : "Operator (Read Only)"}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div className="rounded-xl bg-[#E3EDE0] border border-[#C5DAC0] p-4 flex items-center gap-3 text-[#163A2C] text-xs sm:text-sm font-medium animate-fadeIn shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-[#257853] shrink-0" />
          <div className="flex-1">{statusMessage}</div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[#576558] hover:text-[#17241B] text-xs font-semibold px-2 py-1 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl bg-[#FDF2F2] border border-[#F8D7DA] p-4 flex items-center gap-3 text-[#B42318] text-xs sm:text-sm font-medium animate-fadeIn shadow-2xs">
          <AlertCircle className="w-5 h-5 text-[#D92D20] shrink-0" />
          <div className="flex-1">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[#B42318] hover:underline text-xs font-semibold px-2 py-1 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#E3EBE0] shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#829283] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by tag name, lender, URL parameter, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-[#F4F6F0] border border-[#E3EBE0] text-[#17241B] placeholder-[#829283] focus:outline-none focus:border-[#163A2C] focus:bg-white transition-all"
            id="utm-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#829283] hover:text-[#17241B] cursor-pointer"
            >
              &times;
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#163A2C] text-[#DCE8D7] shadow-xs"
                  : "bg-[#F4F6F0] text-[#576558] hover:bg-[#E3EDE0] hover:text-[#17241B]"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Links Grid */}
      {isLoading ? (
        <div className="min-h-72 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-[#E3EBE0] p-12">
          <div className="w-10 h-10 rounded-xl bg-[#163A2C] text-[#DCE8D7] flex items-center justify-center font-bold text-sm font-mono shadow-xs animate-pulse">
            ag.
          </div>
          <div className="text-xs font-medium text-[#829283]">
            Loading UTM Links directory...
          </div>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E3EBE0] p-12 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-[#F4F6F0] text-[#829283] flex items-center justify-center mx-auto">
            <Link2 className="w-6 h-6 text-[#829283]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#17241B]">
              {searchQuery || selectedCategory !== "all"
                ? "No matching UTM links found"
                : "No UTM links currently active"}
            </h3>
            <p className="text-xs text-[#576558] max-w-md mx-auto leading-relaxed">
              {searchQuery || selectedCategory !== "all"
                ? "Try broadening your search term or clearing the selected category filter."
                : "Add your campaign links with UTM parameters to make them instantly accessible to all loan operators."}
            </p>
          </div>
          {isSuperadmin && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#163A2C] text-[#DCE8D7] hover:bg-[#102B21] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add First UTM Link</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredLinks.map((link) => {
            const queryParams = parseQueryParams(link.url);
            const isCopied = copiedId === link._id;

            return (
              <div
                key={link._id}
                className="bg-white rounded-2xl border border-[#E3EBE0] p-5 shadow-2xs hover:shadow-xs hover:border-[#C5DAC0] transition-all flex flex-col justify-between group space-y-4"
              >
                {/* Header: Tag Name & Category */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      {/* Bold Tag Name */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black tracking-wide uppercase bg-[#E3EDE0] text-[#163A2C] border border-[#CCDDC6] shadow-2xs">
                          <Link2 className="w-3.5 h-3.5 text-[#257853]" />
                          <span>{link.tagName}</span>
                        </span>
                        {link.category && (
                          <span className="text-[11px] font-semibold text-[#576558] bg-[#F4F6F0] px-2.5 py-0.5 rounded-full border border-[#E3EBE0]">
                            {link.category}
                          </span>
                        )}
                      </div>

                      {link.description && (
                        <p className="text-xs text-[#576558] pt-1 leading-relaxed">
                          {link.description}
                        </p>
                      )}
                    </div>

                    {/* Admin Action Menu */}
                    {isSuperadmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(link, e)}
                          className="p-1.5 rounded-lg text-[#829283] hover:text-[#163A2C] hover:bg-[#F4F6F0] transition-all cursor-pointer"
                          title="Edit link details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenDeleteModal(link, e)}
                          className="p-1.5 rounded-lg text-[#829283] hover:text-[#B42318] hover:bg-[#FDF2F2] transition-all cursor-pointer"
                          title="Delete link (moves to Recycle Bin)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Destination Link Box (Clickable to open in new tab) */}
                  <div
                    onClick={() => handleOpenLink(link)}
                    className="p-3 rounded-xl bg-[#F8F9F5] hover:bg-[#EEF4EB] border border-[#E3EBE0] hover:border-[#CCDDC6] transition-all cursor-pointer space-y-1.5 group/box"
                    title="Click to redirect to link in a new tab"
                  >
                    <div className="flex items-center justify-between text-[10.5px] font-semibold text-[#829283] group-hover/box:text-[#163A2C]">
                      <span className="flex items-center gap-1 uppercase tracking-wider">
                        <ExternalLink className="w-3 h-3 text-[#257853]" />
                        <span>Redirects to (New Tab)</span>
                      </span>
                      <span className="text-[#257853] font-bold inline-flex items-center gap-0.5 group-hover/box:translate-x-0.5 transition-transform">
                        <span>Open</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="text-xs font-mono text-[#17241B] break-all line-clamp-2 leading-relaxed">
                      {link.url}
                    </div>
                  </div>

                  {/* UTM Parameters Detected Inspector */}
                  {queryParams.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold text-[#829283] uppercase tracking-wider flex items-center gap-1">
                        <Hash className="w-3 h-3 text-[#829283]" />
                        <span>Detected Parameters ({queryParams.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                        {queryParams.map((p, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#F4F6F0] text-[#17241B] border border-[#E3EBE0] flex items-center gap-1"
                          >
                            <span className="text-[#829283]">{p.key}:</span>
                            <span className="font-semibold text-[#163A2C] truncate max-w-[150px]">
                              {p.value}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-[#ECEFE9] flex items-center justify-between gap-2">
                  <div className="text-[11px] text-[#829283]">
                    {link.clicks !== undefined && (
                      <span className="font-mono">
                        {link.clicks} {link.clicks === 1 ? "click" : "clicks"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(link, e)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                        isCopied
                          ? "bg-[#E3EDE0] text-[#163A2C] border-[#CCDDC6]"
                          : "bg-white text-[#576558] hover:bg-[#F4F6F0] hover:text-[#17241B] border-[#E3EBE0]"
                      }`}
                      title="Copy full URL to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#257853]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    {/* Primary Open in New Tab Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenLink(link)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#163A2C] text-[#DCE8D7] hover:bg-[#102B21] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                      title="Open link in new tab"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#DCE8D7]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Link Modal (Admin only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E3EBE0] space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#17241B] flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#257853]" />
                  <span>{editingLink ? "Edit UTM Link" : "Add New UTM Link"}</span>
                </h3>
                <p className="text-xs text-[#576558] mt-0.5">
                  Set the tag name and destination link. Loan operators can open or copy this link directly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#829283] hover:text-[#17241B] hover:bg-[#F4F6F0] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-4">
              {/* Tag Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17241B] flex items-center justify-between">
                  <span>Tag Name *</span>
                  <span className="text-[10.5px] font-normal text-[#829283]">
                    Displayed on card badge
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. POONAWALA UTM LINK"
                  value={formTagName}
                  onChange={(e) => setFormTagName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-[#F8F9F5] border border-[#E3EBE0] text-[#17241B] focus:outline-none focus:border-[#163A2C] focus:bg-white transition-all font-semibold"
                />

                {/* Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-[#829283]">Quick suggestions:</span>
                  {["POONAWALA UTM LINK", "HDFC DIGITAL PL", "AXIS INSTA LOAN", "BAJAJ FINSERV PL"].map(
                    (sugg) => (
                      <button
                        key={sugg}
                        type="button"
                        onClick={() => setFormTagName(sugg)}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F4F6F0] hover:bg-[#E3EDE0] text-[#163A2C] border border-[#E3EBE0] transition-all cursor-pointer"
                      >
                        {sugg}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Destination URL Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17241B]">
                  Destination UTM Link URL *
                </label>
                <textarea
                  rows={3}
                  placeholder="https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=113231..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-mono bg-[#F8F9F5] border border-[#E3EBE0] text-[#17241B] focus:outline-none focus:border-[#163A2C] focus:bg-white transition-all"
                />
              </div>

              {/* Category & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#17241B]">
                    Lender / Partner Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Poonawalla Fincorp"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F8F9F5] border border-[#E3EBE0] text-[#17241B] focus:outline-none focus:border-[#163A2C] focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#17241B]">
                    Notes / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Instant Pocket Loan via PrimePL"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F8F9F5] border border-[#E3EBE0] text-[#17241B] focus:outline-none focus:border-[#163A2C] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              {formTagName && formUrl && (
                <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E3EBE0] space-y-1">
                  <div className="text-[10px] font-bold text-[#829283] uppercase tracking-wider">
                    Live Card Preview:
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase bg-[#E3EDE0] text-[#163A2C] border border-[#CCDDC6]">
                      {formTagName}
                    </span>
                    <span className="text-[11px] text-[#576558]">
                      {formCategory || "General Partner"}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#257853] truncate">
                    {formUrl}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#ECEFE9]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#576558] hover:bg-[#F4F6F0] hover:text-[#17241B] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#163A2C] text-[#DCE8D7] hover:bg-[#102B21] transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingLink ? "Update Link" : "Create Link"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Moves to Recycle Bin) */}
      {deletingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E3EBE0] space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] text-[#B42318] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#D92D20]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#17241B]">
                  Move UTM Link to Recycle Bin?
                </h3>
                <p className="text-xs text-[#576558] leading-relaxed">
                  Are you sure you want to delete{" "}
                  <strong className="text-[#17241B]">
                    &ldquo;{deletingLink.tagName}&rdquo;
                  </strong>
                  ? It will not be permanently lost; it will be safely moved to the{" "}
                  <span className="font-semibold text-[#163A2C]">Recycle Bin</span>,
                  where you can restore it back anytime.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#ECEFE9]">
              <button
                type="button"
                onClick={() => setDeletingLink(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#576558] hover:bg-[#F4F6F0] hover:text-[#17241B] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#D92D20] text-white hover:bg-[#B42318] transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? "animate-spin" : ""}`} />
                <span>{isDeleting ? "Moving..." : "Move to Recycle Bin"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
