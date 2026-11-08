import React, { useEffect } from "react";
import { X, Volume2 } from "lucide-react";

export interface AudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export function AudioDrawer({ isOpen, onClose, children }: AudioDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm p-4 flex flex-col animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-drawer-title"
    >
      <div className="flex-1 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[24px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-foreground" />
            <h2 id="audio-drawer-title" className="text-sm font-semibold tracking-[-0.015em] text-foreground">
              Audio Player
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            aria-label="Close audio player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
