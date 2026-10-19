"use client";

import React, { useState } from "react";
import {
  Files,
  ArrowUpRight,
  Upload,
  Scissors,
  RotateCw,
  Layers,
  Download,
  Trash2,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

interface SelectedPdf {
  id: string;
  name: string;
  size: string;
  pageCount: number;
}

export const PdfToolsView: React.FC = () => {
  const { setActiveTab } = useWorkspaceStore();
  const [activeSubTool, setActiveSubTool] = useState<"merge" | "split" | "rotate">("merge");
  const [files, setFiles] = useState<SelectedPdf[]>([
    { id: "1", name: "Salary_Slip_Jan2026.pdf", size: "412 KB", pageCount: 2 },
    { id: "2", name: "Form_16_AY2025-26.pdf", size: "1.2 MB", pageCount: 4 },
    { id: "3", name: "Bank_Statement_6M.pdf", size: "3.4 MB", pageCount: 18 },
  ]);
  const [splitRange, setSplitRange] = useState<string>("1-5");
  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: SelectedPdf[] = Array.from(e.target.files).map((file, idx) => ({
        id: `${Date.now()}-${idx}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        pageCount: Math.floor(Math.random() * 5) + 1,
      }));
      setFiles((prev) => [...prev, ...newItems]);
      setStatusMessage(`Added ${newItems.length} file(s)`);
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const handleProcessAction = () => {
    setStatusMessage("Processing PDF documents securely in your browser...");
    setTimeout(() => {
      setStatusMessage("Done! Documents organized and ready for underwriting submission.");
    }, 1200);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="mb-4">
        <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1">
          YOUR WORKSPACE / PDF TOOLKIT
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-[26px] font-semibold tracking-tight text-[#17241B] mb-1">
              PDF toolkit.
            </h1>
            <p className="text-xs md:text-[13px] text-[#576558]">
              Merge, split, organise and edit. Get your documents ready for the next step.
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

      {/* Subtool Tabs */}
      <div className="flex flex-wrap gap-2 mb-3.5">
        <button
          type="button"
          onClick={() => setActiveSubTool("merge")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
            activeSubTool === "merge"
              ? "bg-[#163A2C] border-[#163A2C] text-white"
              : "bg-white border-[#E3EBE0] text-[#17241B] hover:bg-[#F8FAF6]"
          }`}
        >
          <Layers size={13} />
          <span>Merge PDFs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTool("split")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
            activeSubTool === "split"
              ? "bg-[#163A2C] border-[#163A2C] text-white"
              : "bg-white border-[#E3EBE0] text-[#17241B] hover:bg-[#F8FAF6]"
          }`}
        >
          <Scissors size={13} />
          <span>Split PDF Pages</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTool("rotate")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
            activeSubTool === "rotate"
              ? "bg-[#163A2C] border-[#163A2C] text-white"
              : "bg-white border-[#E3EBE0] text-[#17241B] hover:bg-[#F8FAF6]"
          }`}
        >
          <RotateCw size={13} />
          <span>Rotate &amp; Organize</span>
        </button>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-xl border-2 border-dashed border-[#CDDCCD] p-5 md:p-6 text-center mb-4 cursor-pointer relative hover:border-[#163A2C]/50 transition-colors">
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileDrop}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div className="w-10 h-10 rounded-full bg-[#EDF5EC] text-[#163A2C] flex items-center justify-center mx-auto mb-2">
          <Upload size={18} />
        </div>
        <h3 className="text-sm font-bold text-[#17241B] mb-0.5">
          Drop PDF files here, or click to browse
        </h3>
        <p className="text-[11.5px] text-[#576558]">
          100% private. Files are processed locally in your browser memory and never uploaded to external servers.
        </p>
      </div>

      {/* Selected Files List */}
      <div className="bg-white rounded-xl border border-[#E3EBE0] p-4 md:p-5 mb-4 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs md:text-sm font-bold text-[#17241B]">
            Selected Files ({files.length})
          </h3>
          {files.length > 0 && (
            <button
              type="button"
              className="text-[11px] text-[#829283] hover:text-red-600 transition-colors cursor-pointer"
              onClick={() => setFiles([])}
            >
              Clear all
            </button>
          )}
        </div>

        {files.length === 0 ? (
          <div className="text-center py-4 text-xs text-[#829283]">
            No files queued yet. Drop or select files above.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {files.map((f, i) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-2.5 p-2.5 rounded-lg bg-[#F9FAF6] border border-[#ECEFE9]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="font-mono text-[11px] text-[#829283] w-4 shrink-0">
                    #{i + 1}
                  </span>
                  <Files size={16} className="text-[#163A2C] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#17241B] truncate">
                      {f.name}
                    </div>
                    <div className="text-[10.5px] text-[#829283] truncate">
                      {f.size} • {f.pageCount} pages
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="p-1.5 text-[#8E9E8E] hover:text-red-600 transition-colors cursor-pointer shrink-0"
                  title="Remove file"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Controls */}
        {files.length > 0 && (
          <div className="mt-4 border-t border-[#ECEFE9] pt-3.5">
            {activeSubTool === "split" && (
              <div className="flex items-center gap-2.5 mb-3">
                <label className="text-[11.5px] font-semibold text-[#17241B]">Pages to extract:</label>
                <input
                  type="text"
                  className="w-36 h-9 px-2.5 border border-[#E3EBE0] rounded-lg bg-white text-xs outline-none"
                  value={splitRange}
                  onChange={(e) => setSplitRange(e.target.value)}
                  placeholder="e.g. 1-3, 5"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-800">
                <ShieldCheck size={14} />
                <span>Zero server telemetry. Fully browser-executed.</span>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 bg-[#163A2C] hover:bg-[#102B21] text-white px-4 h-9 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.99]"
                onClick={handleProcessAction}
              >
                <Download size={14} />
                <span>
                  {activeSubTool === "merge"
                    ? "Merge & Download PDF"
                    : activeSubTool === "split"
                    ? "Extract Selected Pages"
                    : "Apply Rotation & Download"}
                </span>
              </button>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="mt-3 p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-1.5">
            <CheckCircle size={14} />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
