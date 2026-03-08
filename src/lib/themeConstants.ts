export interface SheetTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
}

export const SHEET_THEMES: Record<string, SheetTheme> = {
  classic: {
    id: "classic",
    name: "Classic",
    primary: "#3b82f6", // blue-600
    secondary: "#64748b", // slate-500
    accent: "#60a5fa", // blue-400
    background: "#f8fafc", // slate-50
    surface: "#ffffff",
    border: "#e2e8f0", // slate-200
  },
  emerald: {
    id: "emerald",
    name: "Emerald Forest",
    primary: "#059669", // emerald-600
    secondary: "#4b5563", // gray-600
    accent: "#34d399", // emerald-400
    background: "#ecfdf5", // emerald-50
    surface: "#ffffff",
    border: "#d1fae5", // emerald-100
  },
  amethyst: {
    id: "amethyst",
    name: "Amethyst Dream",
    primary: "#7c3aed", // violet-600
    secondary: "#4b5563", // gray-600
    accent: "#a78bfa", // violet-400
    background: "#f5f3ff", // violet-50
    surface: "#ffffff",
    border: "#ddd6fe", // violet-200
  },
  midnight: {
    id: "midnight",
    name: "Midnight Ocean",
    primary: "#0f172a", // slate-900
    secondary: "#475569", // slate-600
    accent: "#38bdf8", // sky-400
    background: "#f1f5f9", // slate-100
    surface: "#ffffff",
    border: "#cbd5e1", // slate-300
  },
  rose: {
    id: "rose",
    name: "Desert Rose",
    primary: "#e11d48", // rose-600
    secondary: "#4b5563", // gray-600
    accent: "#fb7185", // rose-400
    background: "#fff1f2", // rose-50
    surface: "#ffffff",
    border: "#ffe4e6", // rose-100
  },
};
