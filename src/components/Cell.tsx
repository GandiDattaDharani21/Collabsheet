"use client";

import React, { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CellData, PresenceData } from "@/types/spreadsheet";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface CellProps {
  id: string;
  value: string | number;
  formula: string | null;
  computedValue?: string | number;
  isActive: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onValueChange: (value: string) => void;
  onCancel: () => void;
  onMove: (direction: "up" | "down" | "left" | "right" | "tab" | "enter") => void;
  collaborators: PresenceData[];
  style?: CellData['style'];
  onContextMenu: (e: React.MouseEvent) => void;
}

export function Cell({
  id,
  value,
  formula,
  computedValue,
  isActive,
  isEditing,
  onSelect,
  onEdit,
  onValueChange,
  onCancel,
  onMove,
  collaborators,
  style,
  onContextMenu
}: CellProps) {
  const [localValue, setLocalValue] = useState(formula || value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setLocalValue(formula || value.toString());
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing, formula, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (isEditing) {
        onValueChange(localValue);
        onMove("enter");
      } else {
        onEdit();
      }
      e.preventDefault();
    } else if (e.key === "Tab") {
      if (isEditing) onValueChange(localValue);
      onMove("tab");
      e.preventDefault();
    } else if (e.key === "Escape") {
      if (isEditing) {
        setLocalValue(formula || value.toString());
        onCancel();
      }
    } else if (!isEditing) {
      if (e.key === "ArrowUp") onMove("up");
      else if (e.key === "ArrowDown") onMove("down");
      else if (e.key === "ArrowLeft") onMove("left");
      else if (e.key === "ArrowRight") onMove("right");
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Start typing directly
        onEdit();
        setLocalValue(e.key);
      }
    }
  };

  const handleBlur = () => {
    if (isEditing) {
      onValueChange(localValue);
    }
  };

  const displayValue = computedValue !== undefined ? computedValue : value;

  const cellStyle: React.CSSProperties = {
    fontWeight: style?.bold ? "bold" : "normal",
    fontStyle: style?.italic ? "italic" : "normal",
    color: style?.color || "inherit",
    backgroundColor: style?.backgroundColor || "transparent",
    fontSize: style?.fontSize ? `${style.fontSize}px` : "14px",
    textAlign: style?.textAlign || (typeof displayValue === "number" ? "right" : "left"),
  };

  return (
    <div
      onClick={onSelect}
      onDoubleClick={onEdit}
      onContextMenu={onContextMenu}
      className={cn(
        "relative min-w-[100px] h-8 border-r border-b border-border-subtle text-sm flex items-center px-2 outline-none cursor-cell select-none transition-colors",
        isActive ? "bg-blue-500/10 ring-2 ring-inset ring-blue-500 z-10" : "hover:bg-surface-hover"
      )}
      style={cellStyle}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          className="absolute inset-0 w-full h-full px-2 bg-surface text-foreground border-2 border-blue-600 outline-none z-20 shadow-lg"
          style={{
            ...cellStyle,
            backgroundColor: "var(--surface)",
            textAlign: style?.textAlign || (typeof displayValue === "number" ? "right" : "left"),
          }}
        />
      ) : (
        <span className={cn(
          "truncate w-full",
          displayValue === "#ERROR!" || displayValue === "#REF!" ? "text-red-500 font-bold" : "text-foreground font-medium"
        )}
        style={{ color: style?.color }}
        >
          {displayValue}
        </span>
      )}
      
      {/* Presence Indicators */}
      {collaborators.map((c, i) => (
        <div 
          key={c.userId}
          className="absolute inset-0 pointer-events-none border-2 z-0"
          style={{ 
            borderColor: c.color,
            opacity: 0.6,
            transform: `translate(${i * 2}px, ${i * 2}px)`
          }}
        />
      ))}
    </div>
  );
}
