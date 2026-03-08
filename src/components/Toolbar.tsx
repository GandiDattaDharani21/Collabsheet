import { SpreadsheetDocument, PresenceData, CellData } from "@/types/spreadsheet";
import { PresenceList } from "./PresenceList";
import { 
  Check, 
  Cloud, 
  Loader2, 
  Home, 
  RotateCcw, 
  RotateCw, 
  Share2, 
  Bold, 
  Italic, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette,
  Moon,
  Sun,
  Download
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SHEET_THEMES } from "@/lib/themeConstants";

interface ToolbarProps {
  document: SpreadsheetDocument | null;
  collaborators: PresenceData[];
  saveStatus: "saving" | "saved";
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onShare: () => void;
  activeCell: CellData | null;
  onStyleUpdate: (style: Partial<CellData['style']>) => void;
  onExport: () => void;
  onTitleUpdate: (newTitle: string) => void;
  onThemeUpdate: (themeId: string) => void;
}

export function Toolbar({ 
  document: spreadsheetDoc, 
  collaborators, 
  saveStatus,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onShare,
  activeCell,
  onStyleUpdate,
  onExport,
  onTitleUpdate,
  onThemeUpdate
}: ToolbarProps) {
  const [isDark, setIsDark] = useState(false);
  const [localTitle, setLocalTitle] = useState(spreadsheetDoc?.title || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const currentStyle = activeCell?.style || {};

  useEffect(() => {
    if (spreadsheetDoc?.title) {
      setLocalTitle(spreadsheetDoc.title);
    }
  }, [spreadsheetDoc?.title]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDarkMode = window.document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    }
  }, []);

  const toggleTheme = () => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      if (root.classList.contains("dark")) {
        root.classList.remove("dark");
        setIsDark(false);
      } else {
        root.classList.add("dark");
        setIsDark(true);
      }
    }
  };

  return (
    <div className="bg-toolbar border-b border-border-subtle px-4 h-14 flex items-center justify-between shadow-sm sticky top-0 z-50 transition-colors">
      <div className="flex items-center gap-4">
        <Link 
          href="/"
          className="p-2 hover:bg-surface-hover rounded-lg text-slate-500 transition-colors"
          title="Back to Dashboard"
        >
          <Home className="w-5 h-5" />
        </Link>
        <div className="flex flex-col min-w-[120px]">
          {isEditingTitle ? (
            <input
              autoFocus
              className="text-sm font-bold text-foreground bg-surface border border-blue-500 rounded px-1 outline-none w-full max-w-[200px]"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                if (localTitle !== spreadsheetDoc?.title) {
                  onTitleUpdate(localTitle);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsEditingTitle(false);
                  if (localTitle !== spreadsheetDoc?.title) {
                    onTitleUpdate(localTitle);
                  }
                } else if (e.key === "Escape") {
                  setIsEditingTitle(false);
                  setLocalTitle(spreadsheetDoc?.title || "");
                }
              }}
            />
          ) : (
            <h1 
              className="text-sm font-bold text-foreground leading-none mb-1 truncate max-w-[200px] hover:bg-surface-hover rounded px-1 cursor-text transition-colors"
              onClick={() => setIsEditingTitle(true)}
              title="Click to edit title"
            >
              {spreadsheetDoc?.title || "Untitled Spreadsheet"}
            </h1>
          )}
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 ml-1">
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-green-500" />
                <span>Saved</span>
              </>
            )}
          </div>
        </div>

        <div className="h-6 w-[1px] bg-border-subtle mx-1" />

        {/* Edit History */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 hover:bg-surface-hover rounded disabled:opacity-30 text-slate-600 transition-all active:scale-95"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 hover:bg-surface-hover rounded disabled:opacity-30 text-slate-600 transition-all active:scale-95"
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-[1px] bg-border-subtle mx-1" />

        {/* Formatting Controls */}
        <div className="flex items-center gap-0.5 bg-surface p-0.5 rounded-lg border border-border-subtle shadow-sm">
          <button
            onClick={() => onStyleUpdate({ bold: !currentStyle.bold })}
            className={`p-1.5 rounded transition-all active:scale-95 ${currentStyle.bold ? "bg-blue-100 text-blue-600 shadow-inner dark:bg-blue-900/50 dark:text-blue-300" : "hover:bg-surface-hover text-slate-600 dark:text-slate-400"}`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStyleUpdate({ italic: !currentStyle.italic })}
            className={`p-1.5 rounded transition-all active:scale-95 ${currentStyle.italic ? "bg-blue-100 text-blue-600 shadow-inner dark:bg-blue-900/50 dark:text-blue-300" : "hover:bg-surface-hover text-slate-600 dark:text-slate-400"}`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          
          <div className="w-[1px] h-4 bg-border-subtle mx-1" />

          <button
            onClick={() => {
              const color = prompt("Enter text color (hex or name):", currentStyle.color || "#000000");
              if (color) onStyleUpdate({ color });
            }}
            className="p-1.5 hover:bg-surface-hover rounded text-slate-600 dark:text-slate-400 transition-all active:scale-95 flex items-center gap-1"
            title="Text Color"
          >
            <Type className="w-4 h-4" />
            <div className="w-3 h-1 rounded-full" style={{ backgroundColor: currentStyle.color || (isDark ? "#fff" : "#000") }} />
          </button>

          <button
            onClick={() => {
              const bg = prompt("Enter background color (hex or name):", currentStyle.backgroundColor || "#ffffff");
              if (bg) onStyleUpdate({ backgroundColor: bg });
            }}
            className="p-1.5 hover:bg-surface-hover rounded text-slate-600 dark:text-slate-400 transition-all active:scale-95"
            title="Fill Color"
          >
            <Palette className="w-4 h-4" style={{ color: currentStyle.backgroundColor }} />
          </button>

          <div className="w-[1px] h-4 bg-border-subtle mx-1" />

          <button
            onClick={() => onStyleUpdate({ textAlign: "left" })}
            className={`p-1.5 rounded transition-all active:scale-95 ${currentStyle.textAlign === "left" || !currentStyle.textAlign ? "bg-blue-100 text-blue-600 shadow-inner dark:bg-blue-900/50" : "hover:bg-surface-hover text-slate-600 dark:text-slate-400"}`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStyleUpdate({ textAlign: "center" })}
            className={`p-1.5 rounded transition-all active:scale-95 ${currentStyle.textAlign === "center" ? "bg-blue-100 text-blue-600 shadow-inner dark:bg-blue-900/50" : "hover:bg-surface-hover text-slate-600 dark:text-slate-400"}`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStyleUpdate({ textAlign: "right" })}
            className={`p-1.5 rounded transition-all active:scale-95 ${currentStyle.textAlign === "right" ? "bg-blue-100 text-blue-600 shadow-inner dark:bg-blue-900/50" : "hover:bg-surface-hover text-slate-600 dark:text-slate-400"}`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {/* Theme & Mode */}
          <div className="flex items-center gap-1 bg-surface border border-border-subtle rounded-lg p-0.5 shadow-sm relative mr-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 hover:bg-surface-hover rounded-md text-slate-500 transition-all active:scale-95"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="w-[1px] h-4 bg-border-subtle mx-0.5" />
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className={`p-1.5 rounded-md transition-all active:scale-95 ${showThemePicker ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40" : "hover:bg-surface-hover text-slate-500"}`}
              title="Sheet Themes"
            >
              <Palette className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showThemePicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 p-2 bg-surface border border-border-subtle rounded-xl shadow-xl min-w-[180px] z-[60] backdrop-blur-md bg-surface/90"
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Select Theme</p>
                  <div className="grid grid-cols-1 gap-1">
                    {Object.values(SHEET_THEMES).map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          onThemeUpdate(theme.id);
                          setShowThemePicker(false);
                        }}
                        className={`flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors text-left ${spreadsheetDoc?.theme === theme.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <span className="text-xs font-semibold text-foreground">{theme.name}</span>
                        {spreadsheetDoc?.theme === theme.id && <Check className="w-3 h-3 text-blue-500 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 mr-4">
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border-subtle rounded text-xs font-semibold hover:bg-surface-hover transition-all text-foreground shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={onShare}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition-all active:scale-95 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>

          <div className="flex items-center gap-2 border-l border-border-subtle pl-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Active Users</span>
            <PresenceList collaborators={collaborators} />
          </div>
        </div>
      </div>
    </div>
  );
}
