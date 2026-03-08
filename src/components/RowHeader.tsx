import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface RowHeaderProps {
  id: number; // 1, 2, etc.
  height: number;
  onResize: (newHeight: number) => void;
  onInsert: () => void;
  onDelete: () => void;
}

export function RowHeader({ id, height, onResize, onDragStart, onDragOver, onDrop, onInsert, onDelete }: RowHeaderProps & {
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const startY = React.useRef(0);
  const startHeight = React.useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    startY.current = e.clientY;
    startHeight.current = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY.current;
      onResize(Math.max(24, startHeight.current + delta));
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
      className={`relative group flex items-center justify-center bg-header-bg border-r border-b border-border-strong text-[10px] font-bold text-header-text select-none cursor-grab active:cursor-grabbing hover:bg-surface-hover transition-colors ${isResizing ? "z-50" : ""}`}
      style={{ width: "40px", height: `${height}px` }}
    >
      <span className="group-hover:opacity-0 transition-opacity">{id}</span>

      {/* Action Menu */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-header-bg/80 backdrop-blur-[2px]">
        <button
          onClick={(e) => { e.stopPropagation(); onInsert(); }}
          className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded text-blue-600 transition-colors"
          title="Insert Row Above"
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded text-red-600 transition-colors"
          title="Delete Row"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>

      <div
        onMouseDown={handleMouseDown}
        className={`absolute bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-400 transition-colors z-10 ${isResizing ? "bg-blue-500" : ""}`}
      />
    </div>
  );
}
