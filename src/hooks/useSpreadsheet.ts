"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  serverTimestamp, 
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CellData, SpreadsheetDocument, SheetSettings } from "@/types/spreadsheet";
import { FormulaEngine } from "@/lib/formulaEngine";
import { useAuth } from "@/context/AuthContext";

export function useSpreadsheet(docId: string, sheetId: string = "Sheet1") {
  const { user } = useAuth();
  const [document, setDocument] = useState<SpreadsheetDocument | null>(null);
  const [cells, setCells] = useState<Record<string, CellData>>({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved">("saved");
  const [settings, setSettings] = useState<SheetSettings | null>(null);

  // Undo/Redo stacks (local only for now, can be persisted)
  const [undoStack, setUndoStack] = useState<Record<string, CellData>[]>([]);
  const [redoStack, setRedoStack] = useState<Record<string, CellData>[]>([]);

  // Fetch document metadata
  useEffect(() => {
    if (!docId) return;
    const docRef = doc(db, "documents", docId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setDocument({ id: snapshot.id, ...snapshot.data() } as SpreadsheetDocument);
      }
    });
    return () => unsubscribe();
  }, [docId]);

  // Fetch sheet settings
  useEffect(() => {
    if (!docId || !sheetId) return;
    const settingsRef = doc(db, "documents", docId, "sheets", sheetId);
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists() && snapshot.data().settings) {
        setSettings(snapshot.data().settings as SheetSettings);
      }
    });
    return () => unsubscribe();
  }, [docId, sheetId]);

  // Fetch cells subcollection from specific sheet
  useEffect(() => {
    if (!docId || !sheetId) return;
    const cellsRef = collection(db, "documents", docId, "sheets", sheetId, "cells");
    const unsubscribe = onSnapshot(cellsRef, (snapshot) => {
      const newCells: Record<string, CellData> = {};
      snapshot.docs.forEach((doc) => {
        newCells[doc.id] = { id: doc.id, ...doc.data() } as CellData;
      });
      setCells(newCells);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [docId, sheetId]);

  // Computed cells based on formula engine (Recursive)
  const computedValues = useMemo(() => {
    const results: Record<string, string | number> = {};

    const evaluateCell = (id: string, stack: string[] = []): string | number => {
      if (results[id] !== undefined) return results[id];
      
      const cell = cells[id];
      if (!cell) {
        results[id] = "";
        return "";
      }
      
      if (!cell.formula) {
        results[id] = cell.value;
        return cell.value;
      }

      const value = FormulaEngine.evaluate(
        cell.formula,
        (refId, innerStack) => evaluateCell(refId, innerStack),
        id,
        stack
      );
      
      results[id] = value;
      return value;
    };

    Object.keys(cells).forEach(id => {
      evaluateCell(id);
    });

    return results;
  }, [cells]);

  const updateCell = async (cellId: string, rawValue: string, skipHistory: boolean = false) => {
    if (!user || !docId || !sheetId) return;

    if (!skipHistory) {
      setUndoStack(prev => [...prev, { ...cells }]);
      setRedoStack([]);
    }

    setSaveStatus("saving");
    const isFormula = rawValue.startsWith("=");
    const formula = isFormula ? rawValue : null;
    
    // Calculate immediate preview value
    let evaluatedValue = rawValue;
    if (isFormula) {
      evaluatedValue = FormulaEngine.evaluate(
        rawValue, 
        (id) => FormulaEngine.toNumber(computedValues[id] || 0),
        cellId,
        []
      ).toString();
    }

    const cellRef = doc(db, "documents", docId, "sheets", sheetId, "cells", cellId);
    
    try {
      const cellData = {
        value: evaluatedValue,
        formula: formula,
        updatedBy: user.displayName || "Anonymous",
        updatedAt: serverTimestamp(),
      };

      await setDoc(cellRef, cellData, { merge: true });

      // Write to history subcollection
      const historyRef = doc(collection(db, "documents", docId, "sheets", sheetId, "cells", cellId, "history"));
      await setDoc(historyRef, {
        ...cellData,
        timestamp: serverTimestamp(),
      });

      // Update document lastModified
      const docRef = doc(db, "documents", docId);
      await updateDoc(docRef, {
        lastModified: serverTimestamp(),
        lastModifiedBy: user.displayName || "Anonymous",
      });

      setSaveStatus("saved");
    } catch (error) {
      console.error("Error updating cell", error);
      setSaveStatus("saved");
    }
  };

  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;
    const previousCells = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, { ...cells }]);

    // Batch update (for simplicity, we update changed cells)
    // In a real app, use a write batch
    for (const [id, cell] of Object.entries(previousCells)) {
      if (cells[id]?.value !== cell.value || cells[id]?.formula !== cell.formula) {
        await updateCell(id, cell.formula || cell.value.toString(), true);
      }
    }
  }, [undoStack, cells]);

  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;
    const nextCells = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, { ...cells }]);

    for (const [id, cell] of Object.entries(nextCells)) {
      if (cells[id]?.value !== cell.value || cells[id]?.formula !== cell.formula) {
        await updateCell(id, cell.formula || cell.value.toString(), true);
      }
    }
  }, [redoStack, cells]);

  const updateCellStyle = async (cellId: string, style: Partial<CellData['style']>) => {
    if (!user || !docId || !sheetId) return;

    setUndoStack(prev => [...prev, { ...cells }]);
    setRedoStack([]);

    const cellRef = doc(db, "documents", docId, "sheets", sheetId, "cells", cellId);
    
    try {
      await setDoc(cellRef, {
        style: {
          ...(cells[cellId]?.style || {}),
          ...style
        },
        updatedBy: user.displayName || "Anonymous",
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setSaveStatus("saved");
    } catch (error) {
      console.error("Error updating cell style", error);
      setSaveStatus("saved");
    }
  };

  const insertRow = async (index: number) => {
    if (!user || !docId || !sheetId) return;
    setSaveStatus("saving");
    const batch = writeBatch(db);
    const cellsRef = collection(db, "documents", docId, "sheets", sheetId, "cells");

    Object.entries(cells).forEach(([cellId, cellData]) => {
      const match = cellId.match(/([A-Z]+)([0-9]+)/);
      if (!match) return;
      const col = match[1];
      const row = parseInt(match[2]);
      const oldRef = doc(cellsRef, cellId);
      
      let newFormula = cellData.formula;
      if (newFormula) {
        newFormula = FormulaEngine.shiftReferences(newFormula, 'row', index, 1);
      }

      if (row >= index) {
        const newCellId = `${col}${row + 1}`;
        const newRef = doc(cellsRef, newCellId);
        batch.delete(oldRef);
        batch.set(newRef, { ...cellData, id: newCellId, formula: newFormula, updatedAt: serverTimestamp() });
      } else if (newFormula !== cellData.formula) {
        batch.update(oldRef, { formula: newFormula, updatedAt: serverTimestamp() });
      }
    });

    try {
      await batch.commit();
      setSaveStatus("saved");
    } catch (error) {
      console.error("Error inserting row", error);
      setSaveStatus("saved");
    }
  };

  const deleteRow = async (index: number) => {
    if (!user || !docId || !sheetId) return;
    setSaveStatus("saving");
    const batch = writeBatch(db);
    const cellsRef = collection(db, "documents", docId, "sheets", sheetId, "cells");

    Object.entries(cells).forEach(([cellId, cellData]) => {
      const match = cellId.match(/([A-Z]+)([0-9]+)/);
      if (!match) return;
      const col = match[1];
      const row = parseInt(match[2]);
      const oldRef = doc(cellsRef, cellId);

      let newFormula = cellData.formula;
      if (newFormula) {
        newFormula = FormulaEngine.shiftReferences(newFormula, 'row', index, -1);
      }

      if (row === index) {
        batch.delete(oldRef);
      } else if (row > index) {
        const newCellId = `${col}${row - 1}`;
        const newRef = doc(cellsRef, newCellId);
        batch.delete(oldRef);
        batch.set(newRef, { ...cellData, id: newCellId, formula: newFormula, updatedAt: serverTimestamp() });
      } else if (newFormula !== cellData.formula) {
        batch.update(oldRef, { formula: newFormula, updatedAt: serverTimestamp() });
      }
    });

    try {
      await batch.commit();
      setSaveStatus("saved");
    } catch (error) {
      console.error("Error deleting row", error);
      setSaveStatus("saved");
    }
  };

  const insertColumn = async (index: number) => {
    if (!user || !docId || !sheetId) return;
    setSaveStatus("saving");
    const batch = writeBatch(db);
    const cellsRef = collection(db, "documents", docId, "sheets", sheetId, "cells");

    Object.entries(cells).forEach(([cellId, cellData]) => {
      const match = cellId.match(/([A-Z]+)([0-9]+)/);
      if (!match) return;
      const col = match[1];
      const row = parseInt(match[2]);
      const colIdx = col.charCodeAt(0) - 65;
      const oldRef = doc(cellsRef, cellId);

      let newFormula = cellData.formula;
      if (newFormula) {
        newFormula = FormulaEngine.shiftReferences(newFormula, 'col', index, 1);
      }

      if (colIdx >= index) {
        const newCol = String.fromCharCode(col.charCodeAt(0) + 1);
        const newCellId = `${newCol}${row}`;
        const newRef = doc(cellsRef, newCellId);
        batch.delete(oldRef);
        batch.set(newRef, { ...cellData, id: newCellId, formula: newFormula, updatedAt: serverTimestamp() });
      } else if (newFormula !== cellData.formula) {
        batch.update(oldRef, { formula: newFormula, updatedAt: serverTimestamp() });
      }
    });

    try {
      await batch.commit();
      setSaveStatus("saved");
    } catch (error) {
      console.error("Error inserting column", error);
      setSaveStatus("saved");
    }
  };

  const deleteColumn = async (index: number) => {
    if (!user || !docId || !sheetId) return;
    setSaveStatus("saving");
    const batch = writeBatch(db);
    const cellsRef = collection(db, "documents", docId, "sheets", sheetId, "cells");

    Object.entries(cells).forEach(([cellId, cellData]) => {
      const match = cellId.match(/([A-Z]+)([0-9]+)/);
      if (!match) return;
      const col = match[1];
      const row = parseInt(match[2]);
      const colIdx = col.charCodeAt(0) - 65;
      const oldRef = doc(cellsRef, cellId);

      let newFormula = cellData.formula;
      if (newFormula) {
        newFormula = FormulaEngine.shiftReferences(newFormula, 'col', index, -1);
      }

      if (colIdx === index) {
        batch.delete(oldRef);
      } else if (colIdx > index) {
        const newCol = String.fromCharCode(col.charCodeAt(0) - 1);
        const newCellId = `${newCol}${row}`;
        const newRef = doc(cellsRef, newCellId);
        batch.delete(oldRef);
        batch.set(newRef, { ...cellData, id: newCellId, formula: newFormula, updatedAt: serverTimestamp() });
      } else if (newFormula !== cellData.formula) {
        batch.update(oldRef, { formula: newFormula, updatedAt: serverTimestamp() });
      }
    });

    try {
      await batch.commit();
      setSaveStatus("saved");
    } catch (error) {
      console.error("Error deleting column", error);
      setSaveStatus("saved");
    }
  };

  const updateSettings = async (newSettings: Partial<SheetSettings>) => {
    if (!user || !docId || !sheetId) return;

    setSaveStatus("saving");
    const settingsRef = doc(db, "documents", docId, "sheets", sheetId);
    
    try {
      await setDoc(settingsRef, {
        settings: {
          ...settings,
          ...newSettings
        }
      }, { merge: true });
      setSaveStatus("saved");
    } catch (error) {
      console.error("Error updating settings", error);
      setSaveStatus("saved");
    }
  };

  return {
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
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    loading,
    saveStatus,
  };
}
