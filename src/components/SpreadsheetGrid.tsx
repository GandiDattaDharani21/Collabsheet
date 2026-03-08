"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Cell } from "./Cell";
import { ColumnHeader } from "./ColumnHeader";
import { RowHeader } from "./RowHeader";
import { ContextMenu } from "./ContextMenu";
import { CellData, PresenceData, SheetSettings } from "@/types/spreadsheet";

interface SpreadsheetGridProps {
  cells: Record<string, CellData>;
  computedValues: Record<string, string | number>;
  onCellUpdate: (cellId: string, value: string) => void;
  collaborators: PresenceData[];
  onSelectionChange: (cellId: string) => void;
  activeCell: string | null;
  onActiveCellChange: (cellId: string | null) => void;
  settings: SheetSettings | null;
  onSettingsUpdate: (settings: Partial<SheetSettings>) => void;
  onInsertRow: (index: number) => void;
  onDeleteRow: (index: number) => void;
  onInsertColumn: (index: number) => void;
  onDeleteColumn: (index: number) => void;
  onStyleUpdate: (cellId: string, style: Partial<CellData['style']>) => void;
}

const ROWS = 50;
const COLS = 26; // A-Z

export function SpreadsheetGrid({
  cells,
  computedValues,
  onCellUpdate,
  collaborators,
  onSelectionChange,
  activeCell,
  onActiveCellChange,
  settings,
  onSettingsUpdate,
  onInsertRow,
  onDeleteRow,
  onInsertColumn,
  onDeleteColumn,
  onStyleUpdate
}: SpreadsheetGridProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  
  const [menuConfig, setMenuConfig] = useState<{ x: number, y: number, cellId: string } | null>(null);
  
  // Local state for layout (synced with settings)
  const [colWidths, setColWidths] = useState<Record<number, number>>(settings?.columnWidths ? 
    Object.fromEntries(Object.entries(settings.columnWidths).map(([k, v]) => [parseInt(k), v])) : {}
  );
  const [rowHeights, setRowHeights] = useState<Record<number, number>>(settings?.rowHeights ? 
    Object.fromEntries(Object.entries(settings.rowHeights).map(([k, v]) => [parseInt(k), v])) : {}
  );

  const [colOrder, setColOrder] = useState<number[]>(settings?.columnOrder || Array.from({ length: COLS }, (_, i) => i));
  const [rowOrder, setRowOrder] = useState<number[]>(settings?.rowOrder || Array.from({ length: ROWS }, (_, i) => i + 1));
  const [draggedItem, setDraggedItem] = useState<{ type: "col" | "row"; index: number } | null>(null);

  // Sync with remote settings
  useEffect(() => {
    if (settings) {
      if (settings.columnWidths) {
        setColWidths(Object.fromEntries(Object.entries(settings.columnWidths).map(([k, v]) => [parseInt(k), v])));
      }
      if (settings.rowHeights) {
        setRowHeights(Object.fromEntries(Object.entries(settings.rowHeights).map(([k, v]) => [parseInt(k), v])));
      }
      if (settings.columnOrder) setColOrder(settings.columnOrder);
      if (settings.rowOrder) setRowOrder(settings.rowOrder);
    }
  }, [settings]);

  const getColLetter = (index: number) => String.fromCharCode(65 + index);
  const getColIndex = (letter: string) => letter.charCodeAt(0) - 65;

  const handleMove = useCallback((direction: string) => {
    if (!activeCell) return;
    
    const colLetter = activeCell.match(/[A-Z]+/)?.[0] || "A";
    const rowNumber = parseInt(activeCell.match(/[0-9]+/)?.[0] || "1");
    
    let nextColIndex = getColIndex(colLetter);
    let nextRow = rowNumber;

    switch (direction) {
      case "up": nextRow = Math.max(1, rowNumber - 1); break;
      case "down": nextRow = Math.min(ROWS, rowNumber + 1); break;
      case "left": nextColIndex = Math.max(0, nextColIndex - 1); break;
      case "right": nextColIndex = Math.min(COLS - 1, nextColIndex + 1); break;
      case "tab": nextColIndex = (nextColIndex + 1) % COLS; if (nextColIndex === 0) nextRow = Math.min(ROWS, nextRow + 1); break;
      case "enter": nextRow = Math.min(ROWS, rowNumber + 1); break;
    }

    const nextCellId = `${getColLetter(nextColIndex)}${nextRow}`;
    onActiveCellChange(nextCellId);
    setEditingCell(null);
    onSelectionChange(nextCellId);
  }, [activeCell, onActiveCellChange, onSelectionChange]);

  const handleSelect = (cellId: string) => {
    onActiveCellChange(cellId);
    setEditingCell(null);
    onSelectionChange(cellId);
  };

  const handleEdit = (cellId: string) => {
    onActiveCellChange(cellId);
    setEditingCell(cellId);
    onSelectionChange(cellId);
  };

  // Reordering Logic
  const handleColResize = (index: number, width: number) => {
    setColWidths((prev) => {
      const next = { ...prev, [index]: width };
      onSettingsUpdate({ 
        columnWidths: Object.fromEntries(Object.entries(next).map(([k, v]) => [k.toString(), v]))
      });
      return next;
    });
  };

  const handleRowResize = (index: number, height: number) => {
    setRowHeights((prev) => {
      const next = { ...prev, [index]: height };
      onSettingsUpdate({ 
        rowHeights: Object.fromEntries(Object.entries(next).map(([k, v]) => [k.toString(), v]))
      });
      return next;
    });
  };

  const handleDragStart = (type: "col" | "row", index: number) => {
    setDraggedItem({ type, index });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleColumnDrop = (dropIndex: number) => {
    if (draggedItem?.type !== "col") return;
    const fromIndex = draggedItem.index;
    const newOrder = [...colOrder];
    const [moved] = newOrder.splice(newOrder.indexOf(fromIndex), 1);
    newOrder.splice(newOrder.indexOf(dropIndex), 0, moved);
    setColOrder(newOrder);
    onSettingsUpdate({ columnOrder: newOrder });
    setDraggedItem(null);
  };

  const handleRowDrop = (dropIndex: number) => {
    if (draggedItem?.type !== "row") return;
    const fromIndex = draggedItem.index;
    
    // Convert to relative position in rowOrder
    const fromPos = rowOrder.indexOf(fromIndex);
    const dropPos = rowOrder.indexOf(dropIndex);
    
    const newOrder = [...rowOrder];
    const [moved] = newOrder.splice(fromPos, 1);
    newOrder.splice(dropPos, 0, moved);
    setRowOrder(newOrder);
    onSettingsUpdate({ rowOrder: newOrder });
    setDraggedItem(null);
  };

  const handleContextMenu = (e: React.MouseEvent, cellId: string) => {
    e.preventDefault();
    setMenuConfig({ x: e.clientX, y: e.clientY, cellId });
  };

  const handleMenuAction = async (action: string) => {
    if (!menuConfig) return;
    const { cellId } = menuConfig;
    const cell = cells[cellId];

    switch (action) {
      case "copy":
        const content = cell?.formula || cell?.value || "";
        localStorage.setItem("spreadsheet_clipboard", JSON.stringify({
          value: content,
          style: cell?.style || {}
        }));
        break;
      case "paste":
        const clipboard = localStorage.getItem("spreadsheet_clipboard");
        if (clipboard) {
          const { value, style } = JSON.parse(clipboard);
          onCellUpdate(cellId, value);
          onStyleUpdate(cellId, style);
        }
        break;
      case "clear":
        onCellUpdate(cellId, "");
        break;
      case "bold":
        onStyleUpdate(cellId, { bold: !cell?.style?.bold });
        break;
      case "italic":
        onStyleUpdate(cellId, { italic: !cell?.style?.italic });
        break;
      case "link":
        const url = `${window.location.origin}${window.location.pathname}?cell=${cellId}`;
        navigator.clipboard.writeText(url);
        break;
    }
  };

  const collaboratorSelections = useMemo(() => {
    const map: Record<string, string> = {};
    collaborators.forEach(p => {
      if (p.selection) map[p.selection] = p.color;
    });
    return map;
  }, [collaborators]);

  return (
    <div className="flex-1 overflow-auto bg-grid-main p-0 relative transition-colors">
      <div className="inline-grid border-l border-t border-border-strong bg-surface shadow-2xl transition-colors" 
           style={{ 
             gridTemplateColumns: `40px ${colOrder.map(i => `${colWidths[i] || 120}px`).join(" ")}`,
             minWidth: "max-content"
           }}>
        
        <div className="bg-header-bg border-r border-b border-border-strong sticky top-0 left-0 z-40 transition-colors" />
        
        {colOrder.map((i) => (
          <div key={`col-${i}`} className="sticky top-0 z-30">
            <ColumnHeader 
              id={getColLetter(i)} 
              width={colWidths[i] || 120} 
              onResize={(w) => handleColResize(i, w)}
              onDragStart={() => handleDragStart("col", i)}
              onDragOver={handleDragOver}
              onDrop={() => handleColumnDrop(i)}
              onInsert={() => onInsertColumn(i)}
              onDelete={() => onDeleteColumn(i)}
            />
          </div>
        ))}

        {rowOrder.map((rowNum) => {
          const rowHeight = rowHeights[rowNum - 1] || 32;
          
          return (
            <React.Fragment key={`row-${rowNum}`}>
              <div className="sticky left-0 z-20">
                <RowHeader 
                  id={rowNum} 
                  height={rowHeight} 
                  onResize={(h) => handleRowResize(rowNum - 1, h)}
                  onDragStart={() => handleDragStart("row", rowNum)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleRowDrop(rowNum)}
                  onInsert={() => onInsertRow(rowNum)}
                  onDelete={() => onDeleteRow(rowNum)}
                />
              </div>

              {colOrder.map((colIndex) => {
                const cellId = `${getColLetter(colIndex)}${rowNum}`;
                
                return (
                  <Cell
                  key={cellId}
                  id={cellId}
                  value={cells[cellId]?.value || ""}
                  formula={cells[cellId]?.formula || ""}
                  computedValue={computedValues[cellId]}
                  style={cells[cellId]?.style}
                  isActive={activeCell === cellId}
                  isEditing={editingCell === cellId}
                  onEdit={() => setEditingCell(cellId)}
                  onValueChange={(val) => {
                    onCellUpdate(cellId, val);
                    setEditingCell(null);
                  }}
                  onCancel={() => setEditingCell(null)}
                  onMove={handleMove}
                  collaborators={collaborators.filter((c) => c.selection === cellId)}
                  onSelect={() => {
                    onSelectionChange(cellId);
                    onActiveCellChange(cellId);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, cellId)}
                />
                );
              })}
            </React.Fragment>
          );
        })}
      </div>

      {menuConfig && (
        <ContextMenu 
          x={menuConfig.x} 
          y={menuConfig.y} 
          onClose={() => setMenuConfig(null)}
          onAction={handleMenuAction}
        />
      )}
    </div>
  );
}
