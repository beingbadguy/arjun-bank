import { create } from "zustand";

export type WorkspaceTab =
  | "overview"
  | "company-search"
  | "pin-search"
  | "cibil-relook"
  | "emi-calc"
  | "eligibility"
  | "pdf-tools"
  | "data-update"
  | "admin-access"
  | "cases-vault"
  | "training"
  | "bankers-search"
  | "utm-links";

export const VALID_TABS: WorkspaceTab[] = [
  "overview",
  "company-search",
  "pin-search",
  "cibil-relook",
  "emi-calc",
  "eligibility",
  "pdf-tools",
  "data-update",
  "admin-access",
  "cases-vault",
  "training",
  "bankers-search",
  "utm-links",
];

function getInitialTab(): WorkspaceTab {
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as WorkspaceTab | null;
      if (tabParam === "cases-vault") {
        window.location.replace("/private");
        return "overview";
      }
      if (tabParam === "admin-access") {
        window.location.replace("/admin");
        return "overview";
      }
      if (tabParam === "data-update") {
        window.location.replace("/data");
        return "overview";
      }
      if (tabParam && VALID_TABS.includes(tabParam)) {
        return tabParam;
      }
    } catch {
      // Fallback to overview
    }
  }
  return "overview";
}

function updateBrowserUrl(tab: WorkspaceTab) {
  if (typeof window === "undefined") return;
  try {
    if (tab === "cases-vault") {
      window.location.href = "/private";
      return;
    }
    if (tab === "admin-access") {
      window.location.href = "/admin";
      return;
    }
    if (tab === "data-update") {
      window.location.href = "/data";
      return;
    }
    const url = new URL(window.location.href);
    if (url.pathname === "/private" || url.pathname === "/admin" || url.pathname === "/data") {
      window.location.href = `/?tab=${tab}`;
      return;
    }
    const currentTab = url.searchParams.get("tab");
    if (currentTab !== tab) {
      const paramsToClear = [
        "page", "search", "q", "status", "bank", "tool", "cat", "category",
        "lender", "pin", "amount", "rate", "tenure", "fee", "period", "salary",
        "foir", "emi", "factor"
      ];
      paramsToClear.forEach((p) => url.searchParams.delete(p));
    }
    url.searchParams.set("tab", tab);
    window.history.pushState({ tab }, "", url.toString());
  } catch (e) {
    console.error("Failed to update URL query", e);
  }
}

interface WorkspaceState {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab, syncUrl?: boolean) => void;
  companyQuery: string;
  setCompanyQuery: (q: string) => void;
  pinQuery: string;
  setPinQuery: (pin: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  syncFromUrl: () => void;
  supportModalOpen: boolean;
  setSupportModalOpen: (open: boolean) => void;
  scriptModalOpen: boolean;
  setScriptModalOpen: (open: boolean) => void;
  benefitsModalOpen: boolean;
  setBenefitsModalOpen: (open: boolean) => void;
  // Training and Audio Assist
  trainingStep: number;
  setTrainingStep: (step: number) => void;
  trainingViewMode: "index" | "player";
  setTrainingViewMode: (mode: "index" | "player") => void;
  audioAssistEnabled: boolean;
  setAudioAssistEnabled: (enabled: boolean) => void;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
  autoAdvance: boolean;
  setAutoAdvance: (auto: boolean) => void;
  completedModules: number[];
  markModuleCompleted: (step: number) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activeTab: getInitialTab(),

  setActiveTab: (tab: WorkspaceTab, syncUrl = true) => {
    if (!VALID_TABS.includes(tab)) return;
    set({ activeTab: tab, mobileMenuOpen: false });
    if (syncUrl) {
      updateBrowserUrl(tab);
    }
  },

  syncFromUrl: () => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as WorkspaceTab | null;
      if (tabParam === "cases-vault") {
        window.location.replace("/private");
        return;
      }
      if (tabParam === "admin-access") {
        window.location.replace("/admin");
        return;
      }
      if (tabParam === "data-update") {
        window.location.replace("/data");
        return;
      }
      if (tabParam && VALID_TABS.includes(tabParam)) {
        if (get().activeTab !== tabParam) {
          set({ activeTab: tabParam, mobileMenuOpen: false });
        }
      }
    } catch {}
  },

  companyQuery: "",
  setCompanyQuery: (q) => set({ companyQuery: q }),
  pinQuery: "",
  setPinQuery: (pin) => set({ pinQuery: pin }),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  supportModalOpen: false,
  setSupportModalOpen: (open) => set({ supportModalOpen: open }),
  scriptModalOpen: false,
  setScriptModalOpen: (open) => set({ scriptModalOpen: open }),
  benefitsModalOpen: false,
  setBenefitsModalOpen: (open) => set({ benefitsModalOpen: open }),

  // Training & Audio defaults
  trainingStep: 1,
  setTrainingStep: (step: number) => {
    const validStep = Math.max(1, Math.min(16, step));
    set({ trainingStep: validStep });
    get().markModuleCompleted(validStep);
  },
  trainingViewMode: "player",
  setTrainingViewMode: (mode: "index" | "player") => set({ trainingViewMode: mode }),
  audioAssistEnabled: true,
  setAudioAssistEnabled: (enabled: boolean) => set({ audioAssistEnabled: enabled }),
  isSpeaking: false,
  setIsSpeaking: (speaking: boolean) => set({ isSpeaking: speaking }),
  autoAdvance: false,
  setAutoAdvance: (auto: boolean) => set({ autoAdvance: auto }),
  completedModules: [1],
  markModuleCompleted: (step: number) => {
    const current = get().completedModules;
    if (!current.includes(step)) {
      set({ completedModules: [...current, step] });
    }
  },
}));

// Listen to browser Back/Forward navigation
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as WorkspaceTab | null;
      if (tabParam === "cases-vault") {
        window.location.replace("/private");
        return;
      }
      if (tabParam === "admin-access") {
        window.location.replace("/admin");
        return;
      }
      if (tabParam === "data-update") {
        window.location.replace("/data");
        return;
      }
      if (tabParam && VALID_TABS.includes(tabParam)) {
        useWorkspaceStore.getState().setActiveTab(tabParam, false);
      } else {
        useWorkspaceStore.getState().setActiveTab("overview", false);
      }
    } catch {}
  });
}
