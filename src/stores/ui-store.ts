import { create } from "zustand";

interface FilterState {
  category_id: string | null;
  category_slug: string | null;
  material: string | null;
  min_price: number | null;
  max_price: number | null;
  sort: string;
  order: "asc" | "desc";
}

interface UIState {
  /** Mobile sidebar open state */
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  /** Global search state */
  searchOpen: boolean;
  searchQuery: string;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;

  /** Storefront filter state */
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  category_id: null,
  category_slug: null,
  material: null,
  min_price: null,
  max_price: null,
  sort: "created_at",
  order: "desc",
};

export const useUIStore = create<UIState>()((set) => ({
  // Sidebar
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // Search
  searchOpen: false,
  searchQuery: "",
  setSearchOpen: (open) => set({ searchOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Filters
  filters: { ...defaultFilters },
  setFilter: (key, value) =>
    set((s) => ({
      filters: { ...s.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
}));
