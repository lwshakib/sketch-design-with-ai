import { Hand, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/hooks/use-project-store";

export function CanvasToolbar() {
  const { activeTool, setActiveTool } = useProjectStore();

  const toolbarButtonClass = (isActive: boolean) => cn(
    "flex items-center justify-center h-10 w-10 rounded-xl transition-all outline-none focus:outline-none",
    isActive
      ? "bg-primary/10 text-primary shadow-inner hover:bg-primary/10"
      : "text-muted-foreground hover:text-foreground hover:bg-transparent"
  );

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="flex items-center gap-1 p-1 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl">
        <button
          onClick={() => setActiveTool('select')}
          className={toolbarButtonClass(activeTool === 'select')}
          title="Select (V)"
          aria-label="Select Tool"
        >
          <MousePointer2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => setActiveTool('hand')}
          className={toolbarButtonClass(activeTool === 'hand')}
          title="Hand (H / Space)"
          aria-label="Hand Tool"
        >
          <Hand className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
