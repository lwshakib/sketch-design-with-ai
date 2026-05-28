import { Hand, MousePointer2, Pencil, Pointer } from "lucide-react";

import { cn } from "@/lib/utils";
import { useProjectStore } from "@/hooks/use-project-store";

export function CanvasToolbar() {
  const { activeTool, setActiveTool } = useProjectStore();

  const toolbarButtonClass = (isActive: boolean) =>
    cn(
      "flex items-center justify-center h-9 w-9 rounded-full transition-all duration-200 outline-none focus:outline-none",
      isActive
        ? "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(59,130,246,0.3)] scale-105 hover:bg-primary/90"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:scale-105",
    );

  return (
    <div className="pointer-events-auto absolute right-6 top-1/2 z-50 -translate-y-1/2">
      <div className="bg-card/85 border-border/40 flex flex-col items-center gap-1.5 rounded-full border p-1.5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:shadow-primary/5 hover:border-primary/20">
        <button
          onClick={() => setActiveTool("select")}
          className={toolbarButtonClass(activeTool === "select")}
          title="Select (V)"
          aria-label="Select Tool"
        >
          <MousePointer2 className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={() => setActiveTool("hand")}
          className={toolbarButtonClass(activeTool === "hand")}
          title="Hand (H / Space)"
          aria-label="Hand Tool"
        >
          <Hand className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={() => setActiveTool("interact")}
          className={toolbarButtonClass(activeTool === "interact")}
          title="Interact (I)"
          aria-label="Interact Tool"
        >
          <Pointer className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={() => setActiveTool("edit")}
          className={toolbarButtonClass(activeTool === "edit")}
          title="Edit Mode (E)"
          aria-label="Edit Tool"
        >
          <Pencil className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}

