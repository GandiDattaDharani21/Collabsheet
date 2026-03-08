"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSpreadsheet } from "@/hooks/useSpreadsheet";
import { usePresence } from "@/hooks/usePresence";
import { Toolbar } from "@/components/Toolbar";
import { SpreadsheetGrid } from "@/components/SpreadsheetGrid";
import { SheetTabs } from "@/components/SheetTabs";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { exportToCSV } from "@/lib/exportUtils";
import { motion, AnimatePresence } from "framer-motion";
import { SHEET_THEMES } from "@/lib/themeConstants";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.docId as string;
  
  const [activeSheet, setActiveSheet] = useState("Sheet1");
  const [activeCell, setActiveCell] = useState<string | null>("A1");
  const { user, loading: authLoading } = useAuth();
  
  const { 
    document, 
    cells, 
    settings,
    computedValues, 
    updateCell, 
    updateCellStyle,
    updateSettings,
    insertRow,
    deleteRow,
    insertColumn,
    deleteColumn,
    undo,
    redo,
    canUndo,
    canRedo,
    loading: docLoading, 
    saveStatus 
  } = useSpreadsheet(docId, activeSheet);
  
  const { collaborators, updateSelection } = usePresence(docId);

  const sheets = document?.sheets || ["Sheet1"];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleAddSheet = async () => {
    if (!docId) return;
    const newSheetName = `Sheet${sheets.length + 1}`;
    const docRef = doc(db, "documents", docId);
    await updateDoc(docRef, {
      sheets: arrayUnion(newSheetName)
    });
    setActiveSheet(newSheetName);
  };

  const handleRemoveSheet = async (sheetName: string) => {
    if (!docId || sheets.length <= 1) return;
    const docRef = doc(db, "documents", docId);
    await updateDoc(docRef, {
      sheets: arrayRemove(sheetName)
    });
    if (activeSheet === sheetName) {
      setActiveSheet(sheets.find(s => s !== sheetName) || "Sheet1");
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Editor link copied to clipboard! Share it with your collaborators.");
  };

  const handleExport = () => {
    exportToCSV(cells, computedValues, document?.title || "spreadsheet-export");
  };

  const handleTitleUpdate = async (newTitle: string) => {
    if (!docId || !newTitle.trim()) return;
    const docRef = doc(db, "documents", docId);
    try {
      await updateDoc(docRef, { title: newTitle.trim() });
    } catch (error) {
      console.error("Error updating document title:", error);
    }
  };

  const handleThemeUpdate = async (themeId: string) => {
    if (!docId) return;
    const docRef = doc(db, "documents", docId);
    try {
      await updateDoc(docRef, { theme: themeId });
    } catch (error) {
      console.error("Error updating theme:", error);
    }
  };

  useEffect(() => {
    if (!document?.theme) return;
    const theme = SHEET_THEMES[document.theme] || SHEET_THEMES.classic;
    
    const root = window.document.documentElement;
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--background-sheet", theme.background);
    root.style.setProperty("--border-sheet", theme.border);
  }, [document?.theme]);

  const handleStyleUpdate = (style: any) => {
    if (activeCell) {
      updateCellStyle(activeCell, style);
    }
  };

  if (authLoading || (docLoading && !document)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium animate-pulse">Initializing Collaborative Environment...</p>
      </div>
    );
  }

  if (!document && !docLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h1 className="text-2xl font-bold text-slate-900">Document Not Found</h1>
        <p className="text-slate-500 max-w-md">
          The document you are looking for does not exist or you don't have permission to view it.
        </p>
        <button 
          onClick={() => router.push("/")}
          className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      <Toolbar 
        document={document} 
        collaborators={collaborators} 
        saveStatus={saveStatus} 
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onShare={handleShare}
        onExport={handleExport}
        onTitleUpdate={handleTitleUpdate}
        onThemeUpdate={handleThemeUpdate}
        activeCell={activeCell ? cells[activeCell] : null}
        onStyleUpdate={handleStyleUpdate}
      />
      
      <motion.main 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <SpreadsheetGrid
          cells={cells}
          computedValues={computedValues}
          onCellUpdate={updateCell}
          collaborators={collaborators}
          onSelectionChange={updateSelection}
          activeCell={activeCell}
          onActiveCellChange={setActiveCell}
          settings={settings}
          onSettingsUpdate={updateSettings}
          onInsertRow={insertRow}
          onDeleteRow={deleteRow}
          onInsertColumn={insertColumn}
          onDeleteColumn={deleteColumn}
          onStyleUpdate={updateCellStyle}
        />
      </motion.main>

      <SheetTabs 
        sheets={sheets}
        activeSheet={activeSheet}
        onSheetChange={setActiveSheet}
        onAddSheet={handleAddSheet}
        onRemoveSheet={handleRemoveSheet}
      />
      
      {/* Footer Info / Status Bar */}
      <footer className="h-6 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-400 font-medium select-none z-50">
        <div className="flex items-center gap-4">
          <span>Rows: 50</span>
          <span>Cols: 26</span>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-blue-500 uppercase">{activeSheet}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>CollabSheet Engine v1.1.0</span>
          {user && <span>Logged in as: {user.displayName}</span>}
        </div>
      </footer>
    </div>
  );
}
