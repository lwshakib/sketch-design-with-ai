"use client";

/**
 * @file secondary-sidebar.tsx
 * @description This component acts as the secondary inspector panel.
 * It is dynamically toggled by the user or by context-specific actions (like selecting an element).
 * It shows the ElementSettings for the currently selected DOM element.
 */

import React from "react";
import { useProjectStore } from "@/hooks/use-project-store";
import { ElementSettings } from "./element-settings";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Props for the SecondarySidebar component.
 */
interface SecondarySidebarProps {
  /** Callback to persist changes made in the element inspector back to the project state */
  commitEdits: () => void;
}

export function SecondarySidebar({ commitEdits }: SecondarySidebarProps) {
  const {
    secondarySidebarMode,
    setSecondarySidebarMode,
    selectedEl,
    setSelectedEl,
  } = useProjectStore();

  if (secondarySidebarMode === "none") return null;

  return (
    <aside className="bg-card/95 border-border/50 absolute inset-y-0 right-0 z-[100] flex w-[320px] flex-col border-l shadow-2xl backdrop-blur-3xl animate-in slide-in-from-right duration-300">
      <div className="absolute top-3 right-3 z-[110]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
             setSecondarySidebarMode("none");
             setSelectedEl(null);
          }}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-8 w-8 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <ElementSettings
          selectedEl={selectedEl}
          setSelectedEl={setSelectedEl}
          onUpdate={commitEdits}
        />
      </div>
    </aside>
  );
}
