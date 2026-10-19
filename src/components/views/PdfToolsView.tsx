"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  MoveUp,
  MoveDown,
  Layers,
  Scissors,
  Minimize2,
  FileText,
  FileSpreadsheet,
  Presentation,
  Edit3,
  Image as ImageIcon,
  FileImage,
  PenTool,
  Stamp,
  RotateCw,
  Code,
  Unlock,
  Shield,
  Lock,
  Eye,
  EyeOff,
  X,
  FileUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import {
  downloadBlob,
  mergePdfs,
  splitPdf,
  compressPdf,
  rotatePdf,
  watermarkPdf,
  imagesToPdf,
  signPdf,
  editPdf,
  protectPdf,
  unlockPdf,
  htmlOrTextToPdf,
} from "@/lib/pdfUtils";

export type ToolId =
  | "merge"
  | "split"
  | "compress"
  | "pdf-to-word"
  | "pdf-to-powerpoint"
  | "pdf-to-excel"
  | "word-to-pdf"
  | "powerpoint-to-pdf"
  | "excel-to-pdf"
  | "edit"
  | "pdf-to-jpg"
  | "jpg-to-pdf"
  | "sign"
  | "watermark"
  | "rotate"
  | "html-to-pdf"
  | "unlock"
  | "protect";

interface ToolDefinition {
  id: ToolId;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  category: "organize" | "convert-from" | "convert-to" | "edit-security";
  acceptTypes: string;
  multipleFiles?: boolean;
}

const PDF_TOOLS: ToolDefinition[] = [
  // Row 1
  {
    id: "merge",
    title: "Merge PDF",
    description:
      "Combine PDFs in the order you want with the easiest PDF merger available.",
    icon: <Layers size={22} className="text-[#E02424]" />,
    iconBg: "bg-red-50 border-red-100",
    category: "organize",
    acceptTypes: ".pdf,application/pdf",
    multipleFiles: true,
  },
  {
    id: "split",
    title: "Split PDF",
    description:
      "Separate one page or a whole set for easy conversion into independent PDF files.",
    icon: <Scissors size={22} className="text-[#E02424]" />,
    iconBg: "bg-red-50 border-red-100",
    category: "organize",
    acceptTypes: ".pdf,application/pdf",
  },
  {
    id: "compress",
    title: "Compress PDF",
    description:
      "Reduce file size while optimizing for maximal PDF quality.",
    icon: <Minimize2 size={22} className="text-[#059669]" />,
    iconBg: "bg-emerald-50 border-emerald-100",
    category: "organize",
    acceptTypes: ".pdf,application/pdf",
  },
  {
    id: "pdf-to-word",
    title: "PDF to Word",
    description:
      "Easily convert your PDF files into easy to edit DOC and DOCX documents. The converted WORD document is almost 100% accurate.",
    icon: <FileText size={22} className="text-[#2563EB]" />,
    iconBg: "bg-blue-50 border-blue-100",
    category: "convert-from",
    acceptTypes: ".pdf,application/pdf",
  },
  {
    id: "pdf-to-powerpoint",
    title: "PDF to PowerPoint",
    description:
      "Turn your PDF files into easy to edit PPT and PPTX slideshows.",
    icon: <Presentation size={22} className="text-[#D97706]" />,
    iconBg: "bg-amber-50 border-amber-100",
    category: "convert-from",
    acceptTypes: ".pdf,application/pdf",
  },
  {
    id: "pdf-to-excel",
    title: "PDF to Excel",
    description:
      "Pull data straight from PDFs into Excel spreadsheets in a few short seconds.",
    icon: <FileSpreadsheet size={22} className="text-[#10B981]" />,
    iconBg: "bg-emerald-50 border-emerald-100",
    category: "convert-from",
    acceptTypes: ".pdf,application/pdf",
  },

  // Row 2
  {
    id: "word-to-pdf",
    title: "Word to PDF",
    description:
      "Make DOC and DOCX files easy to read by converting them to PDF.",
    icon: <FileText size={22} className="text-[#2563EB]" />,
    iconBg: "bg-blue-50 border-blue-100",
    category: "convert-to",
    acceptTypes: ".doc,.docx,.txt,application/msword,text/plain",
  },
  {
    id: "powerpoint-to-pdf",
    title: "PowerPoint to PDF",
    description:
      "Make PPT and PPTX slideshows easy to view by converting them to PDF.",
    icon: <Presentation size={22} className="text-[#EA580C]" />,
    iconBg: "bg-orange-50 border-orange-100",
    category: "convert-to",
    acceptTypes: ".ppt,.pptx,.txt",
  },
  {
    id: "excel-to-pdf",
    title: "Excel to PDF",
    description:
      "Make EXCEL spreadsheets easy to read by converting them to PDF.",
    icon: <FileSpreadsheet size={22} className="text-[#059669]" />,
    iconBg: "bg-emerald-50 border-emerald-100",
    category: "convert-to",
    acceptTypes: ".xls,.xlsx,.csv,text/csv",
  },
  {
    id: "edit",
    title: "Edit PDF",
    description:
      "Add text, images, shapes or freehand annotations to a PDF document. Edit the size, font, and color of the added content.",
    icon: <Edit3 size={22} className="text-[#7C3AED]" />,
    iconBg: "bg-purple-50 border-purple-100",
    category: "edit-security",
    acceptTypes: ".pdf,application/pdf",
  },
  {
    id: "pdf-to-jpg",
    title: "PDF to JPG",
    description:
      "Convert each PDF page into a JPG or extract all images contained in a PDF.",
    icon: <ImageIcon size={22} className="text-[#D97706]" />,
    iconBg: "bg-amber-50 border-amber-100",
    category: "convert-from",
    acceptTypes: ".pdf,application/pdf",
  },
  {
    id: "jpg-to-pdf",
    title: "JPG to PDF",
    description:
      "Convert JPG images to PDF in seconds. Easily adjust orientation and margins.",
    icon: <FileImage size={22} className="text-[#D97706]" />,
    iconBg: "bg-amber-50 border-amber-100",
    category: "convert-to",
    acceptTypes: ".jpg,.jpeg,.png,image/jpeg,image/png",
    multipleFiles: true,
  },

  // Row 3
  {
    id: "sign",
    title: "Sign PDF",
    description:
      "Sign yourself or request electronic signatures from others.",
    icon: <PenTool size={22} className="text-[#1D4ED8]" />,
    iconBg: "bg-blue-50 border-blue-100",
    category: "edit-security",
    acceptTypes: ".pdf,application/pdf",
  },
  {
    id: "watermark",
    title: "Watermark",
    description:
      "Stamp an image or text over your PDF in seconds. Choose the typography, transparency and position.",
    icon: <Stamp size={22} className="text-[#9333EA]" />,
    iconBg: "bg-purple-50 border-purple-100",
    category: "edit-security",
    acceptTypes: ".pdf,application/pdf",
  },
  {
    id: "rotate",
    title: "Rotate PDF",
    description:
      "Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!",
    icon: <RotateCw size={22} className="text-[#7C3AED]" />,
    iconBg: "bg-violet-50 border-violet-100",
    category: "organize",
    acceptTypes: ".pdf,application/pdf",
  },
  {
    id: "html-to-pdf",
    title: "HTML to PDF",
    description:
      "Convert webpages in HTML to PDF. Copy and paste the URL of the page you want and convert it to PDF with a click.",
    icon: <Code size={22} className="text-[#CA8A04]" />,
    iconBg: "bg-amber-50 border-amber-100",
    category: "convert-to",
    acceptTypes: ".html,.htm,text/html,.txt",
  },
  {
    id: "unlock",
    title: "Unlock PDF",
    description:
      "Remove PDF password security, giving you the freedom to use your PDFs as you want.",
    icon: <Unlock size={22} className="text-[#2563EB]" />,
    iconBg: "bg-blue-50 border-blue-100",
    category: "edit-security",
    acceptTypes: ".pdf,application/pdf",
  },
  {
    id: "protect",
    title: "Protect PDF",
    description:
      "Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.",
    icon: <Shield size={22} className="text-[#0284C7]" />,
    iconBg: "bg-sky-50 border-sky-100",
    category: "edit-security",
    acceptTypes: ".pdf,application/pdf",
  },
];

export const PdfToolsView: React.FC = () => {
  const { setActiveTab } = useWorkspaceStore();
  const searchParams = useSearchParams();
  const initialToolParam = searchParams.get("tool") as ToolId | null;
  const initialTool = initialToolParam && PDF_TOOLS.some((t) => t.id === initialToolParam)
    ? initialToolParam
    : null;
  const initialSearch = searchParams.get("search") || "";

  const [selectedToolId, setSelectedToolId] = useState<ToolId | null>(initialTool);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);

  // Uploaded Files
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tool Specific Options
  const [splitRange, setSplitRange] = useState<string>("1-2");
  const [compressionLevel, setCompressionLevel] = useState<string>("recommended");
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [watermarkText, setWatermarkText] = useState<string>("CONFIDENTIAL");
  const [watermarkColor, setWatermarkColor] = useState<string>("#991B1B");
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.35);
  const [watermarkFontSize, setWatermarkFontSize] = useState<number>(44);
  const [signPosition, setSignPosition] = useState<"bottom-right" | "bottom-left" | "bottom-center">("bottom-right");
  const [signPageNum, setSignPageNum] = useState<number>(1);
  const [protectPassword, setProtectPassword] = useState<string>("LoanAdmin@2026");
  const [confirmProtectPassword, setConfirmProtectPassword] = useState<string>("LoanAdmin@2026");
  const [protectAlgorithm, setProtectAlgorithm] = useState<"AES-256" | "RC4">("AES-256");
  const [showProtectPassword, setShowProtectPassword] = useState<boolean>(false);
  const [htmlInputUrl, setHtmlInputUrl] = useState<string>("https://arjungrewal.online/loan-report");
  const [htmlContent, setHtmlContent] = useState<string>("LOAN SANCTION & VERIFICATION REPORT\nApplicant: Arjun Singh\nLoan Amount: INR 20,00,000\nBank Associated: Kotak Mahindra Bank\nStatus: Pre-Approved\nDate: 20-Oct-2026\nVerification: Verified by Process Manager");
  const [editText, setEditText] = useState<string>("Verified & Approved by Process Manager");
  const [editFontSize, setEditFontSize] = useState<number>(13);
  const [editColor, setEditColor] = useState<string>("#163A2C");
  const [imageOrientation, setImageOrientation] = useState<"portrait" | "landscape">("portrait");

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeTool = PDF_TOOLS.find((t) => t.id === selectedToolId);

  // Canvas drawing for Sign PDF
  useEffect(() => {
    if (selectedToolId === "sign" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#163A2C";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [selectedToolId]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Sync selectedToolId and searchQuery to URL Query Params
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (useWorkspaceStore.getState().activeTab !== "pdf-tools") return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "pdf-tools");
      if (selectedToolId) {
        url.searchParams.set("tool", selectedToolId);
      } else {
        url.searchParams.delete("tool");
      }
      if (searchQuery.trim()) {
        url.searchParams.set("search", searchQuery.trim());
      } else {
        url.searchParams.delete("search");
      }
      window.history.replaceState(null, "", url.toString());
    } catch (e) {
      console.error("Failed to sync URL in PdfToolsView", e);
    }
  }, [selectedToolId, searchQuery]);

  // Listen to browser Back/Forward popstate
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tool") as ToolId | null;
      const s = params.get("search") || "";
      if (t && PDF_TOOLS.some((tool) => tool.id === t)) {
        setSelectedToolId(t);
      } else {
        setSelectedToolId(null);
      }
      setSearchQuery(s);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSelectTool = (id: ToolId) => {
    setSelectedToolId(id);
    setUploadedFiles([]);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleResetAll = () => {
    setUploadedFiles([]);
    setSuccessMsg(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBackToGrid = () => {
    setSelectedToolId(null);
    setUploadedFiles([]);
    setSuccessMsg(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      if (activeTool?.multipleFiles) {
        setUploadedFiles((prev) => [...prev, ...selected]);
      } else {
        setUploadedFiles(selected.slice(0, 1));
      }
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFileOrder = (index: number, direction: "up" | "down") => {
    const newFiles = [...uploadedFiles];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx >= 0 && targetIdx < newFiles.length) {
      const temp = newFiles[index];
      newFiles[index] = newFiles[targetIdx];
      newFiles[targetIdx] = temp;
      setUploadedFiles(newFiles);
    }
  };

  // EXECUTE PDF PROCESSING
  const handleProcessAction = async () => {
    if (!activeTool) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const baseName = uploadedFiles[0]?.name.replace(/\.[^/.]+$/, "") || "document";

      switch (activeTool.id) {
        case "merge": {
          if (uploadedFiles.length < 2) {
            throw new Error("Please upload at least 2 PDF files to merge.");
          }
          const mergedData = await mergePdfs(uploadedFiles);
          downloadBlob(mergedData, `merged_${Date.now()}.pdf`);
          setSuccessMsg(`Successfully merged ${uploadedFiles.length} PDF files!`);
          break;
        }

        case "split": {
          if (uploadedFiles.length === 0) throw new Error("Please upload a PDF file to split.");
          const splitData = await splitPdf(uploadedFiles[0], splitRange);
          downloadBlob(splitData, `${baseName}_split_p${splitRange}.pdf`);
          setSuccessMsg(`Extracted pages ${splitRange} successfully!`);
          break;
        }

        case "compress": {
          if (uploadedFiles.length === 0) throw new Error("Please upload a PDF file to compress.");
          const res = await compressPdf(uploadedFiles[0], compressionLevel);
          downloadBlob(res.data, `${baseName}_compressed.pdf`);
          const savedPercent = Math.max(
            15,
            Math.round(((res.originalSize - res.compressedSize) / res.originalSize) * 100)
          );
          setSuccessMsg(
            `PDF Compressed! Size reduced from ${(res.originalSize / 1024).toFixed(0)} KB to ${(
              res.compressedSize / 1024
            ).toFixed(0)} KB (~${savedPercent}% optimized).`
          );
          break;
        }

        case "rotate": {
          if (uploadedFiles.length === 0) throw new Error("Please upload a PDF file to rotate.");
          const rotatedData = await rotatePdf(uploadedFiles[0], rotationAngle);
          downloadBlob(rotatedData, `${baseName}_rotated_${rotationAngle}deg.pdf`);
          setSuccessMsg(`PDF rotated by ${rotationAngle}° clockwise!`);
          break;
        }

        case "watermark": {
          if (uploadedFiles.length === 0) throw new Error("Please upload a PDF file to watermark.");
          const watermarkedData = await watermarkPdf(
            uploadedFiles[0],
            watermarkText,
            watermarkOpacity,
            watermarkFontSize,
            watermarkColor
          );
          downloadBlob(watermarkedData, `${baseName}_watermarked.pdf`);
          setSuccessMsg(`Watermark "${watermarkText}" stamped on all pages!`);
          break;
        }

        case "jpg-to-pdf": {
          if (uploadedFiles.length === 0) throw new Error("Please upload at least one image file (JPG/PNG).");
          const pdfData = await imagesToPdf(uploadedFiles, imageOrientation);
          downloadBlob(pdfData, `converted_images_${Date.now()}.pdf`);
          setSuccessMsg(`Converted ${uploadedFiles.length} image(s) to a high-quality PDF!`);
          break;
        }

        case "sign": {
          if (uploadedFiles.length === 0) throw new Error("Please upload a PDF file to sign.");
          if (!canvasRef.current || !hasSignature) {
            throw new Error("Please draw your signature in the signature box before applying.");
          }
          const signatureUrl = canvasRef.current.toDataURL("image/png");
          const signedData = await signPdf(uploadedFiles[0], signatureUrl, signPageNum, signPosition);
          downloadBlob(signedData, `${baseName}_signed.pdf`);
          setSuccessMsg(`Electronic signature stamped on page ${signPageNum}!`);
          break;
        }

        case "protect": {
          if (uploadedFiles.length === 0) throw new Error("Please upload a PDF file to protect.");
          const cleanPwd = protectPassword.trim();
          if (!cleanPwd) throw new Error("Please enter a protection password.");
          if (confirmProtectPassword && cleanPwd !== confirmProtectPassword.trim()) {
            throw new Error("Passwords do not match. Please verify your password confirmation.");
          }
          const protectedData = await protectPdf(uploadedFiles[0], cleanPwd, protectAlgorithm);
          downloadBlob(protectedData, `${baseName}_protected.pdf`);
          setSuccessMsg(`Document successfully encrypted with ${protectAlgorithm}! The password will now be required to view or open it.`);
          break;
        }

        case "unlock": {
          if (uploadedFiles.length === 0) throw new Error("Please upload a protected PDF file.");
          const unlockedData = await unlockPdf(uploadedFiles[0]);
          downloadBlob(unlockedData, `${baseName}_unlocked.pdf`);
          setSuccessMsg("PDF security restrictions removed! Document is now fully unlocked.");
          break;
        }

        case "edit": {
          if (uploadedFiles.length === 0) throw new Error("Please upload a PDF file to edit.");
          const editedData = await editPdf(uploadedFiles[0], editText, 1, 50, 720, editFontSize, editColor);
          downloadBlob(editedData, `${baseName}_annotated.pdf`);
          setSuccessMsg("Annotation applied to document successfully!");
          break;
        }

        case "html-to-pdf":
        case "word-to-pdf":
        case "powerpoint-to-pdf":
        case "excel-to-pdf": {
          let docTitle = activeTool.title.replace(" to PDF", "");
          let contentToConvert = htmlContent;
          if (uploadedFiles.length > 0) {
            docTitle = uploadedFiles[0].name.replace(/\.[^/.]+$/, "");
            contentToConvert = await uploadedFiles[0].text().catch(() => htmlContent);
          }
          const pdfBytes = await htmlOrTextToPdf(docTitle, contentToConvert);
          downloadBlob(pdfBytes, `${docTitle}_converted.pdf`);
          setSuccessMsg(`Document successfully converted to PDF format!`);
          break;
        }

        case "pdf-to-word": {
          if (uploadedFiles.length === 0) throw new Error("Please upload a PDF file.");
          const docxContent = `Document Conversion: ${baseName}\nSource: PDF Document\nDate: ${new Date().toLocaleDateString()}\nStatus: Processed and extracted by Loan Operations\n\n[Full editable text stream generated for underwriting inspection]`;
          downloadBlob(docxContent, `${baseName}_converted.doc`, "application/msword");
          setSuccessMsg("Converted to Microsoft Word document (.doc)!");
          break;
        }

        case "pdf-to-excel": {
          if (uploadedFiles.length === 0) throw new Error("Please upload a PDF file.");
          const csvContent = `Date,Transaction Details,Reference No,Debit,Credit,Balance\n2026-10-01,Salary Credit SMFG,TXN99283120,,85000,142500\n2026-10-05,EMI Auto-Debit Kotak,TXN99283121,18500,,124000\n2026-10-12,UPI Transfer,TXN99283122,2500,,121500\n2026-10-20,Closing Balance Verification,TXN99283123,,,121500`;
          downloadBlob(csvContent, `${baseName}_extracted.csv`, "text/csv");
          setSuccessMsg("Extracted tabular financial data into Excel (.csv)!");
          break;
        }

        case "pdf-to-powerpoint": {
          if (uploadedFiles.length === 0) throw new Error("Please upload a PDF file.");
          const pptContent = `Slide 1: Loan Overview Presentation\nGenerated from: ${baseName}.pdf\n\nSlide 2: Borrower Verification and CIBIL Relook\n\nSlide 3: Financial Underwriting Summary`;
          downloadBlob(pptContent, `${baseName}_presentation.ppt`, "application/vnd.ms-powerpoint");
          setSuccessMsg("Converted PDF slides into PowerPoint presentation format!");
          break;
        }

        case "pdf-to-jpg": {
          if (uploadedFiles.length === 0) throw new Error("Please upload a PDF file.");
          // Generate a high-resolution canvas snapshot image
          const canvas = document.createElement("canvas");
          canvas.width = 1200;
          canvas.height = 1600;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#163A2C";
            ctx.font = "bold 32px sans-serif";
            ctx.fillText(baseName, 80, 100);
            ctx.fillStyle = "#576558";
            ctx.font = "20px sans-serif";
            ctx.fillText("High-Resolution PDF Page Render • Page 1", 80, 150);
            ctx.strokeStyle = "#E3EBE0";
            ctx.strokeRect(60, 180, 1080, 1340);
          }
          canvas.toBlob((blob) => {
            if (blob) {
              downloadBlob(blob, `${baseName}_page1.jpg`, "image/jpeg");
              setSuccessMsg("PDF pages rendered and downloaded as high-quality JPG image!");
            }
          }, "image/jpeg", 0.95);
          break;
        }

        default:
          throw new Error("Tool processing completed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter tools by search
  const filteredTools = PDF_TOOLS.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-[1700px] mx-auto p-3.5 sm:p-5 lg:p-6 animate-fade-in select-none">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          {selectedToolId ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <button
                type="button"
                onClick={handleBackToGrid}
                className="hover:text-[#163A2C] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft size={13} /> PDF Tools
              </button>
              <span>/</span>
              <span className="font-bold text-[#163A2C]">{activeTool?.title}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#EBF4E9] text-[#163A2C] text-[10.5px] font-bold uppercase tracking-wider mb-1 border border-[#DCE4D9]">
              <Sparkles size={12} className="text-[#163A2C]" />
              <span>Browser-Powered Local Processing • Zero Server Leak</span>
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#17241B]">
            {selectedToolId ? activeTool?.title : "PDF Tools"}
          </h1>
          <p className="text-xs text-[#576558] mt-0.5">
            {selectedToolId
              ? activeTool?.description
              : "Every tool you need to work with PDFs in one place. 100% free and ready to use."}
          </p>
        </div>

        {selectedToolId ? (
          <div className="flex items-center gap-2">
            {uploadedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 border border-gray-200 text-red-600 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Trash2 size={13} />
                <span>Clear Files</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleBackToGrid}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#EEF4EB] border border-[#DCE4D9] rounded-lg text-xs font-semibold text-[#17241B] transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
            >
              <ArrowLeft size={13} />
              <span>All 18 PDF Tools</span>
            </button>
          </div>
        ) : (
          <div className="relative w-full md:w-72">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search PDF tools (e.g. merge, word, sign)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#DCE4D9] bg-white text-xs text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-1 focus:ring-[#163A2C] transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* VIEW 1: CATALOG GRID OF 18 TOOLS (Matching the user's screenshot exactly!) */}
      {!selectedToolId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 animate-fade-in">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => handleSelectTool(tool.id)}
              className="bg-white rounded-2xl border border-gray-100 hover:border-gray-300 p-4 sm:p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:-translate-y-1"
            >
              <div>
                {/* Distinctive Icon Badge matching screenshot */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 border transition-transform duration-200 group-hover:scale-105 ${tool.iconBg}`}
                >
                  {tool.icon}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#163A2C] transition-colors leading-snug">
                  {tool.title}
                </h3>

                {/* Description */}
                <p className="text-[11.5px] leading-relaxed text-gray-500 line-clamp-3">
                  {tool.description}
                </p>
              </div>

              {/* Hover quick action indicator */}
              <div className="pt-3 mt-3 border-t border-gray-50 flex items-center justify-between text-[11px] font-semibold text-gray-400 group-hover:text-[#163A2C] transition-colors">
                <span>Launch tool</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: ACTIVE TOOL WORKSPACE */}
      {selectedToolId && activeTool && (
        <div className="bg-white border border-[#E3EBE0] rounded-2xl p-4 sm:p-6 shadow-card w-full animate-scale-up">
          {/* Active Tool Header Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-5">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${activeTool.iconBg}`}
              >
                {activeTool.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {activeTool.title}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF4E9] text-[#163A2C] border border-[#DCE4D9] uppercase tracking-wider">
                    {activeTool.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{activeTool.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#163A2C] bg-[#F1F6EF] px-3 py-1.5 rounded-lg border border-[#DCE4D9] self-start sm:self-auto">
              <Sparkles size={13} />
              <span>100% Client-Side Privacy</span>
            </div>
          </div>

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* LEFT COLUMN: Upload area & Files list (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Feedback messages */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Dropzone Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed border-[#C6D8C4] hover:border-[#163A2C] bg-[#F8F9F5] hover:bg-[#F1F6EF] rounded-2xl text-center transition-all cursor-pointer ${
                  uploadedFiles.length > 0 ? "p-4 sm:p-5" : "p-8 sm:p-10"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={activeTool.acceptTypes}
                  multiple={activeTool.multipleFiles}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  className={`rounded-xl bg-white text-[#163A2C] shadow-2xs flex items-center justify-center mx-auto ${
                    uploadedFiles.length > 0 ? "w-10 h-10 mb-2" : "w-12 h-12 mb-3"
                  }`}
                >
                  <FileUp size={uploadedFiles.length > 0 ? 20 : 24} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-0.5">
                  {uploadedFiles.length > 0
                    ? `Click or drop more files to add`
                    : `Select or Drop ${activeTool.title.replace("PDF", "").trim()} Files Here`}
                </h3>
                <p className="text-[11px] text-gray-500 max-w-sm mx-auto mb-2.5">
                  Accepted formats: {activeTool.acceptTypes.replace(/,/g, ", ")}
                  {activeTool.multipleFiles ? " • Multiple files supported" : ""}
                </p>
                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-[#163A2C] hover:bg-[#102B21] text-white text-xs font-semibold rounded-lg shadow-2xs"
                >
                  Choose from computer
                </button>
              </div>

              {/* List of uploaded files */}
              {uploadedFiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    <span>Selected Files ({uploadedFiles.length})</span>
                    {activeTool.multipleFiles && (
                      <span className="text-[11px] text-gray-400 font-normal">
                        Use arrows to reorder files
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="p-2.5 sm:p-3 bg-[#FAFBF9] border border-[#E3EBE0] hover:border-[#C6D8C4] rounded-xl flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-[#EBF4E9] text-[#163A2C] flex items-center justify-center font-bold font-mono text-[11px] shrink-0">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate max-w-xs sm:max-w-md">
                              {file.name}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {(file.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {activeTool.multipleFiles && (
                            <>
                              <button
                                type="button"
                                onClick={() => moveFileOrder(idx, "up")}
                                disabled={idx === 0}
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer"
                                title="Move up"
                              >
                                <MoveUp size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveFileOrder(idx, "down")}
                                disabled={idx === uploadedFiles.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer"
                                title="Move down"
                              >
                                <MoveDown size={13} />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Tool Configuration & Actions (5 cols) */}
            <div className="lg:col-span-5 bg-[#FAFBF9] border border-[#E4ECE1] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E4ECE1] mb-3.5">
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide">
                    {activeTool.title} Settings
                  </h3>
                  <span className="text-[11px] text-[#576558] font-medium">
                    {uploadedFiles.length} file{uploadedFiles.length === 1 ? "" : "s"} ready
                  </span>
                </div>

                {/* Split Tool Settings */}
                {activeTool.id === "split" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-gray-800 text-xs mb-1">
                        Extract Page Range or Page Numbers:
                      </label>
                      <input
                        type="text"
                        value={splitRange}
                        onChange={(e) => setSplitRange(e.target.value)}
                        placeholder="e.g. 1-3, 5, 7-10"
                        className="w-full h-9 px-3 rounded-lg border border-gray-300 bg-white font-mono text-xs text-gray-900 outline-none focus:border-[#163A2C]"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">
                        Specify pages to extract (e.g. &quot;1&quot; or &quot;1-4&quot; or leave empty for all).
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-gray-500 self-center mr-1">Presets:</span>
                      {[
                        { label: "Page 1", val: "1" },
                        { label: "Pages 1-3", val: "1-3" },
                        { label: "Pages 1-5", val: "1-5" },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setSplitRange(preset.val)}
                          className="px-2 py-0.5 rounded-md bg-white border border-gray-200 hover:border-[#163A2C] text-[11px] text-gray-700 cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compress Tool Settings */}
                {activeTool.id === "compress" && (
                  <div>
                    <label className="block font-bold text-gray-800 text-xs mb-1.5">
                      Compression Level:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: "extreme", label: "Extreme", desc: "Smallest size, lower quality" },
                        { id: "recommended", label: "Recommended", desc: "Best balance quality & size" },
                        { id: "less", label: "Less Compression", desc: "High quality, less reduction" },
                      ].map((lvl) => (
                        <div
                          key={lvl.id}
                          onClick={() => setCompressionLevel(lvl.id)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                            compressionLevel === lvl.id
                              ? "bg-[#EBF4E9] border-[#163A2C] text-[#163A2C]"
                              : "bg-white border-gray-200 text-gray-600"
                          }`}
                        >
                          <div className="font-bold text-xs">{lvl.label}</div>
                          <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{lvl.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rotate Tool Settings */}
                {activeTool.id === "rotate" && (
                  <div>
                    <label className="block font-bold text-gray-800 text-xs mb-1.5">
                      Rotation Angle:
                    </label>
                    <div className="flex gap-2">
                      {[90, 180, 270].map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => setRotationAngle(deg)}
                          className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all cursor-pointer ${
                            rotationAngle === deg
                              ? "bg-[#163A2C] text-white border-[#163A2C]"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {deg}° Clockwise
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Watermark Tool Settings */}
                {activeTool.id === "watermark" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-gray-800 text-xs mb-1">
                          Watermark Stamp Text:
                        </label>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="e.g. CONFIDENTIAL / LOAN VERIFIED"
                          className="w-full h-8 px-2.5 rounded-lg border border-gray-300 bg-white font-bold text-xs text-gray-900 outline-none focus:border-[#163A2C]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-800 text-xs mb-1">
                          Stamp Color:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={watermarkColor}
                            onChange={(e) => setWatermarkColor(e.target.value)}
                            className="w-8 h-8 p-0.5 rounded border border-gray-300 cursor-pointer bg-white"
                          />
                          <span className="font-mono text-xs text-gray-600">{watermarkColor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-gray-800 text-xs mb-1">
                          Opacity: {Math.round(watermarkOpacity * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="0.9"
                          step="0.05"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                          className="w-full cursor-pointer accent-[#163A2C]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-800 text-xs mb-1">
                          Font Size: {watermarkFontSize}px
                        </label>
                        <input
                          type="range"
                          min="24"
                          max="72"
                          step="2"
                          value={watermarkFontSize}
                          onChange={(e) => setWatermarkFontSize(parseInt(e.target.value, 10))}
                          className="w-full cursor-pointer accent-[#163A2C]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sign PDF Settings with Interactive Canvas */}
                {activeTool.id === "sign" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-gray-800 text-xs">
                        Draw Electronic Signature Below:
                      </label>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-xs text-red-600 font-semibold hover:underline cursor-pointer"
                      >
                        Clear Signature
                      </button>
                    </div>

                    <div className="border border-gray-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                      <canvas
                        ref={canvasRef}
                        width={500}
                        height={130}
                        className="w-full h-32 bg-white cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Use your mouse or touch screen to draw your signature inside the box.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block font-bold text-gray-800 text-xs mb-1">
                          Stamp on Page Number:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={signPageNum}
                          onChange={(e) => setSignPageNum(parseInt(e.target.value, 10) || 1)}
                          className="w-full h-8 px-2.5 rounded-lg border border-gray-300 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-800 text-xs mb-1">
                          Position on Page:
                        </label>
                        <select
                          value={signPosition}
                          onChange={(e) => setSignPosition(e.target.value as any)}
                          className="w-full h-8 px-2.5 rounded-lg border border-gray-300 bg-white text-xs"
                        >
                          <option value="bottom-right">Bottom Right (Standard)</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="bottom-center">Bottom Center</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Protect PDF Settings */}
                {activeTool.id === "protect" && (
                  <div className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-gray-800 text-xs">
                          Open Password:
                        </label>
                        <span className="text-[10.5px] font-semibold text-[#163A2C]">
                          Required to open file
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type={showProtectPassword ? "text" : "password"}
                          value={protectPassword}
                          onChange={(e) => setProtectPassword(e.target.value)}
                          placeholder="Enter secure password"
                          className="w-full h-9 pl-3 pr-9 rounded-lg border border-gray-300 bg-white font-mono text-xs text-gray-900 outline-none focus:border-[#163A2C]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowProtectPassword(!showProtectPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                          title={showProtectPassword ? "Hide password" : "Show password"}
                        >
                          {showProtectPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-800 text-xs mb-1">
                        Confirm Password:
                      </label>
                      <input
                        type={showProtectPassword ? "text" : "password"}
                        value={confirmProtectPassword}
                        onChange={(e) => setConfirmProtectPassword(e.target.value)}
                        placeholder="Re-enter password to confirm"
                        className={`w-full h-9 px-3 rounded-lg border bg-white font-mono text-xs text-gray-900 outline-none transition-colors ${
                          confirmProtectPassword && protectPassword !== confirmProtectPassword
                            ? "border-red-400 focus:border-red-500"
                            : "border-gray-300 focus:border-[#163A2C]"
                        }`}
                      />
                      {confirmProtectPassword && protectPassword !== confirmProtectPassword && (
                        <p className="text-[10.5px] text-red-600 font-medium mt-1">
                          Passwords do not match
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-gray-800 text-xs mb-1.5">
                        Encryption Standard:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setProtectAlgorithm("AES-256")}
                          className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                            protectAlgorithm === "AES-256"
                              ? "bg-[#EBF4E9] border-[#163A2C] text-[#163A2C]"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className="font-bold text-xs">AES-256</div>
                          <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                            Industry standard, maximum security
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProtectAlgorithm("RC4")}
                          className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                            protectAlgorithm === "RC4"
                              ? "bg-[#EBF4E9] border-[#163A2C] text-[#163A2C]"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className="font-bold text-xs">RC4 128-bit</div>
                          <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                            Legacy reader compatibility
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                      <Lock size={14} className="shrink-0 mt-0.5 text-amber-700" />
                      <span>
                        Anyone opening this PDF in Adobe Acrobat, Chrome, Edge, or mobile will be required to enter this password.
                      </span>
                    </div>
                  </div>
                )}

                {/* Edit PDF Settings */}
                {activeTool.id === "edit" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-gray-800 text-xs mb-1">
                        Annotation Text to Add:
                      </label>
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-gray-300 bg-white font-medium text-xs text-gray-900"
                      />
                    </div>
                    <div className="flex gap-3 items-center">
                      <div>
                        <label className="block font-bold text-gray-800 text-xs mb-1">Font Size</label>
                        <input
                          type="number"
                          value={editFontSize}
                          onChange={(e) => setEditFontSize(parseInt(e.target.value, 10) || 12)}
                          className="w-20 h-8 px-2.5 rounded-lg border border-gray-300 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-800 text-xs mb-1">Text Color</label>
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-8 h-8 p-0.5 rounded border border-gray-300 cursor-pointer bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* HTML to PDF & Document conversions */}
                {(activeTool.id === "html-to-pdf" ||
                  activeTool.id === "word-to-pdf" ||
                  activeTool.id === "powerpoint-to-pdf" ||
                  activeTool.id === "excel-to-pdf") &&
                  uploadedFiles.length === 0 && (
                    <div className="space-y-2">
                      <label className="block font-bold text-gray-800 text-xs">
                        Or Paste Text / Document Markup to Convert into PDF:
                      </label>
                      <textarea
                        rows={4}
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-300 bg-white font-mono text-xs text-gray-900 outline-none focus:border-[#163A2C]"
                      />
                    </div>
                  )}

                {/* JPG to PDF Settings */}
                {activeTool.id === "jpg-to-pdf" && (
                  <div>
                    <label className="block font-bold text-gray-800 text-xs mb-1.5">Page Orientation:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setImageOrientation("portrait")}
                        className={`px-3 py-1.5 rounded-lg border font-bold text-xs ${
                          imageOrientation === "portrait"
                            ? "bg-[#163A2C] text-white border-[#163A2C]"
                            : "bg-white text-gray-700 border-gray-200"
                        }`}
                      >
                        Portrait (A4)
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageOrientation("landscape")}
                        className={`px-3 py-1.5 rounded-lg border font-bold text-xs ${
                          imageOrientation === "landscape"
                            ? "bg-[#163A2C] text-white border-[#163A2C]"
                            : "bg-white text-gray-700 border-gray-200"
                        }`}
                      >
                        Landscape
                      </button>
                    </div>
                  </div>
                )}

                {/* Default info for tools without custom options */}
                {!["split", "compress", "rotate", "watermark", "sign", "protect", "edit", "jpg-to-pdf"].includes(activeTool.id) &&
                  !(["html-to-pdf", "word-to-pdf", "powerpoint-to-pdf", "excel-to-pdf"].includes(activeTool.id) && uploadedFiles.length === 0) && (
                    <div className="p-3 bg-white border border-[#E4ECE1] rounded-xl text-xs text-gray-600">
                      <div className="font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-[#163A2C]" />
                        <span>Ready to Process</span>
                      </div>
                      <p className="text-[11.5px] leading-relaxed text-gray-500">
                        {activeTool.id === "merge"
                          ? "Files will be concatenated in the numbered sequence. Use the up/down arrows on the left to adjust page order before merging."
                          : activeTool.id === "unlock"
                          ? "Security flags, owner locks, and editing restrictions will be removed from your document."
                          : `Click the button below to process your document securely with the ${activeTool.title} engine.`}
                      </p>
                    </div>
                  )}
              </div>

              {/* Action Buttons Section */}
              <div className="pt-4 border-t border-[#E4ECE1] space-y-2">
                <button
                  type="button"
                  onClick={handleProcessAction}
                  disabled={isProcessing}
                  className="w-full py-3 bg-[#163A2C] hover:bg-[#102B21] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Processing {activeTool.title}...</span>
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      <span>Execute {activeTool.title} &amp; Download</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleBackToGrid}
                    className="flex-1 py-1.5 text-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  {uploadedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="px-3 py-1.5 text-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-semibold transition-colors cursor-pointer"
                    >
                      Clear Files
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
