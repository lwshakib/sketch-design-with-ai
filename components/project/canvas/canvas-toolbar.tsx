import { Hand, MousePointer2, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import { useProjectStore } from "@/hooks/use-project-store";

export function CanvasToolbar() {
  const { activeTool, setActiveTool } = useProjectStore();

  const toolbarButtonClass = (isActive: boolean) =>
    cn(
      "flex items-center justify-center h-10 w-10 rounded-xl transition-all outline-none focus:outline-none",
      isActive
        ? "bg-primary/10 text-primary shadow-inner hover:bg-primary/10"
        : "text-muted-foreground hover:text-foreground hover:bg-transparent",
    );

  return (
    <div className="pointer-events-auto absolute right-6 top-1/2 z-50 -translate-y-1/2">
      <div className="bg-card/80 border-border/50 flex flex-col items-center gap-1 rounded-2xl border p-1 shadow-2xl backdrop-blur-xl transition-all hover:shadow-primary/5">
        <button
          onClick={() => setActiveTool("select")}
          className={toolbarButtonClass(activeTool === "select")}
          title="Select (V)"
          aria-label="Select Tool"
        >
          <MousePointer2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => setActiveTool("hand")}
          className={toolbarButtonClass(activeTool === "hand")}
          title="Hand (H / Space)"
          aria-label="Hand Tool"
        >
          <Hand className="h-4 w-4" />
        </button>
        <button
          onClick={() => setActiveTool("edit")}
          className={toolbarButtonClass(activeTool === "edit")}
          title="Edit Mode (E)"
          aria-label="Edit Tool"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
