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
  | "admin-access";

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
];

function getInitialTab(): WorkspaceTab {
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as WorkspaceTab | null;
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
    const url = new URL(window.location.href);
    if (tab === "overview") {
      url.searchParams.set("tab", "overview");
    } else {
      url.searchParams.set("tab", tab);
    }
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
}));

// Listen to browser Back/Forward navigation
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as WorkspaceTab | null;
      if (tabParam && VALID_TABS.includes(tabParam)) {
        useWorkspaceStore.getState().setActiveTab(tabParam, false);
      } else {
        useWorkspaceStore.getState().setActiveTab("overview", false);
      }
    } catch {}
  });
}
