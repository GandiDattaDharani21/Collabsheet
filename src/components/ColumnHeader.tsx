import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface ColumnHeaderProps {
  id: string; // "A", "B", etc.
  width: number;
  onResize: (newWidth: number) => void;
  onInsert: () => void;
  onDelete: () => void;
}

export function ColumnHeader({ id, width, onResize, onDragStart, onDragOver, onDrop, onInsert, onDelete }: ColumnHeaderProps & { 
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const startX = React.useRef(0);
  const startWidth = React.useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag when resizing
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX.current;
      onResize(Math.max(40, startWidth.current + delta));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      draggable={!isResizing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative group flex items-center justify-center bg-header-bg border-r border-b border-border-strong text-[10px] font-bold text-header-text uppercase tracking-tighter select-none cursor-grab active:cursor-grabbing hover:bg-surface-hover transition-colors ${isResizing ? "z-50" : ""}`}
      style={{ width: `${width}px`, height: "32px" }}
    >
      <span className="group-hover:opacity-0 transition-opacity">{id}</span>
      
      {/* Action Menu */}
      <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-header-bg/80 backdrop-blur-[2px]">
        <button
          onClick={(e) => { e.stopPropagation(); onInsert(); }}
          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded text-blue-600 transition-colors"
          title="Insert Column Before"
        >
          <Plus className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded text-red-600 transition-colors"
          title="Delete Column"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div
        onMouseDown={handleMouseDown}
        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 transition-colors z-10 ${isResizing ? "bg-blue-500" : ""}`}
      />
    </div>
  );
}
