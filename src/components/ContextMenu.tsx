import React, { useEffect, useRef } from "react";
import { 
  Copy, 
  Clipboard, 
  Trash2, 
  Bold, 
  Italic, 
  Link as LinkIcon 
} from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
}

export function ContextMenu({ x, y, onClose, onAction }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const actions = [
    { id: "copy", label: "Copy", icon: Copy },
    { id: "paste", label: "Paste", icon: Clipboard },
    { id: "clear", label: "Clear Content", icon: Trash2 },
    { type: "divider" },
    { id: "bold", label: "Toggle Bold", icon: Bold },
    { id: "italic", label: "Toggle Italic", icon: Italic },
    { type: "divider" },
    { id: "link", label: "Copy Cell Link", icon: LinkIcon },
  ];

  return (
    <div 
      ref={menuRef}
      className="fixed z-[100] bg-surface border border-border-subtle rounded-lg shadow-xl py-1 min-w-[160px] backdrop-blur-md bg-surface/90"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      {actions.map((action, index) => {
        if (action.type === "divider") {
          return <div key={`div-${index}`} className="my-1 border-t border-border-subtle" />;
        }
        
        const Icon = action.icon!;
        return (
          <button
            key={action.id}
            onClick={() => {
              onAction(action.id!);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover transition-colors text-left"
          >
            <Icon className="w-3.5 h-3.5 text-slate-400" />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
