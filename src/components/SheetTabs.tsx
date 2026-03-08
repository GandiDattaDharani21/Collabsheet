"use client";

import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SheetTabsProps {
  sheets: string[];
  activeSheet: string;
  onSheetChange: (sheet: string) => void;
  onAddSheet: () => void;
  onRemoveSheet: (sheet: string) => void;
}

export function SheetTabs({ 
  sheets, 
  activeSheet, 
  onSheetChange, 
  onAddSheet, 
  onRemoveSheet 
}: SheetTabsProps) {
  return (
    <div className="bg-surface border-t border-border-subtle h-10 flex items-center px-4 overflow-x-auto no-scrollbar gap-1 select-none z-50 transition-colors">
      <AnimatePresence mode="popLayout" initial={false}>
        {sheets.map((sheet) => (
          <motion.div
            key={sheet}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => onSheetChange(sheet)}
            className={`group flex items-center gap-2 px-4 py-1.5 min-w-[100px] text-xs font-bold border-x border-t border-transparent cursor-pointer transition-all rounded-t-lg relative
              ${activeSheet === sheet 
                ? "bg-background border-border-subtle text-primary shadow-[0_-2px_4px_rgba(0,0,0,0.05)]" 
                : "text-header-text hover:bg-surface-hover hover:text-slate-700 dark:hover:text-slate-200"
              }`}
          >
            {activeSheet === sheet && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-primary z-20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="truncate">{sheet}</span>
            {sheets.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSheet(sheet);
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-surface-hover rounded p-0.5 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      
      <button
        onClick={onAddSheet}
        className="p-1.5 hover:bg-surface-hover rounded-md text-slate-500 transition-colors ml-2"
        title="Add New Sheet"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
