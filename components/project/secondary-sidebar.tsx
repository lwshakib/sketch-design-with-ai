"use client";

import React from "react";
import { useProjectStore } from "@/hooks/use-project-store";
import { ElementSettings } from "./element-settings";
import { ThemeSettings } from "./theme-settings";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SecondarySidebarProps {
  commitEdits: () => void;
  applyTheme: (theme: any) => void;
}

export function SecondarySidebar({
  commitEdits,
  applyTheme,
}: SecondarySidebarProps) {
  const {
    secondarySidebarMode,
    setSecondarySidebarMode,
    activeThemeId,
    appliedTheme,
    selectedEl,
    setSelectedEl,
  } = useProjectStore();

  if (secondarySidebarMode === "none") return null;

  return (
    <aside className="bg-sidebar absolute inset-0 z-30 flex flex-col shadow-2xl transition-all duration-300">
      <div className="absolute top-3 right-3 z-30">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSecondarySidebarMode("none")}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-8 w-8 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {secondarySidebarMode === "properties" ? (
          <ElementSettings
            selectedEl={selectedEl}
            setSelectedEl={setSelectedEl}
            clearSelection={() => setSelectedEl(null)}
            onUpdate={commitEdits}
          />
        ) : (
          <ThemeSettings
            activeThemeId={activeThemeId}
            onApplyTheme={applyTheme}
            appliedTheme={appliedTheme}
          />
        )}
      </div>
    </aside>
  );
}
