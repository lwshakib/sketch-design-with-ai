"use client";

/**
 * @file screen-share-view.tsx
 * @description Provides a focused, single-screen sharing experience.
 * Unlike the ProjectShareView which shows multiple screens on a canvas,
 * this component targets a specific screen but still offers full
 * zoom/pan capabilities and responsive viewport switching.
 */

import React, { useState, useRef, useEffect } from "react";
import { type Artifact } from "@/lib/artifact-renderer";
import { cn } from "@/lib/utils";
import {
  ZoomIn,
  ZoomOut,
  Hand,
  MousePointer2,
  RotateCcw,
  Smartphone,
  Tablet,
  Monitor,
  ExternalLink,
  QrCode,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArtifactFrame } from "@/components/project/canvas/artifact-frame";
import { Logo } from "@/components/logo";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/**
 * Props for the ScreenShareView component.
 */
interface ScreenShareViewProps {
  project: {
    /** Title of the project the screen belongs to */
    title: string;
    /** Token for shared access */
    shareToken: string;
    /** Available themes for the project */
    themes?: any[];
    /** The theme currently active for this shared view */
    appliedTheme?: any;
  };
  /** The specific screen artifact to be showcased */
  artifact: Artifact;
}

export function ScreenShareView({ project, artifact }: ScreenShareViewProps) {
  const [viewportMode, setViewportMode] = useState<
    "mobile" | "tablet" | "desktop"
  >("desktop");
  const [appliedTheme, setAppliedTheme] = useState<any>(
    project.appliedTheme || project.themes?.[0] || null,
  );
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [dynamicHeight, setDynamicHeight] = useState<number | null>(null);

  // Canvas State
  const [zoom, setZoom] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<"select" | "hand">("select");
  const [isPanning, setIsPanning] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const canvasOffsetRef = useRef(canvasOffset);
  const currentOffset = useRef(canvasOffset);

  useEffect(() => {
    zoomRef.current = zoom;
    canvasOffsetRef.current = canvasOffset;
  }, [zoom, canvasOffset]);

  const previewRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Initialize
  useEffect(() => {
    const timer = setTimeout(() => {
      if (project.themes && project.themes.length > 0 && !appliedTheme) {
        setAppliedTheme(project.themes[0]);
      }

      // Set initial viewport based on artifact type
      if (artifact.type === "app") setViewportMode("mobile");
      else setViewportMode("desktop");
    }, 0);

    return () => clearTimeout(timer);
  }, [project.themes, artifact.type, appliedTheme]);

  /**
   * Effect to listen for height updates from the child iframe.
   * This ensures the container wrapper correctly matches the content's
   * natural height for a pixel-perfect preview.
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data.type === "HEIGHT_UPDATE" &&
        typeof event.data.height === "number"
      ) {
        const sourceWindow = event.source as Window;
        if (iframeRef.current?.contentWindow === sourceWindow) {
          setDynamicHeight(event.data.height);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Zoom and Pan Handlers (Shared with ProjectShareView)
  const handleZoom = (newScale: number, mx: number, my: number) => {
    const prevZoom = zoomRef.current;
    const prevOffset = canvasOffsetRef.current;
    const nextZoom = Math.min(Math.max(newScale, 0.1), 5);

    if (nextZoom === prevZoom) return;

    const dx = (mx - prevOffset.x) / prevZoom;
    const dy = (my - prevOffset.y) / prevZoom;

    const newOffsetX = mx - dx * nextZoom;
    const newOffsetY = my - dy * nextZoom;

    setZoom(nextZoom);
    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
    currentOffset.current = { x: newOffsetX, y: newOffsetY }; // Sync ref
  };

  useEffect(() => {
    const element = previewRef.current;
    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const scaleFactor = Math.pow(1.2, -e.deltaY / 120);
        const rect = element.getBoundingClientRect();

        // Calculate mouse position relative to the center of the viewport
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const mx = e.clientX - rect.left - centerX;
        const my = e.clientY - rect.top - centerY;

        handleZoom(zoomRef.current * scaleFactor, mx, my);
      } else {
        const prevOffset = canvasOffsetRef.current;
        const newOffset = {
          x: prevOffset.x - e.deltaX,
          y: prevOffset.y - e.deltaY,
        };
        setCanvasOffset(newOffset);
        currentOffset.current = newOffset; // Sync ref
      }
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " && activeTool !== "hand") setActiveTool("hand");
      if (e.key.toLowerCase() === "v") setActiveTool("select");
      if (e.key.toLowerCase() === "h") setActiveTool("hand");

      // Zooming with keyboard uses center of viewport (0,0 relative to center)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          handleZoom(zoomRef.current * 1.2, 0, 0); // Center is 0,0
        } else if (e.key === "-") {
          e.preventDefault();
          handleZoom(zoomRef.current / 1.2, 0, 0);
        } else if (e.key === "0") {
          e.preventDefault();
          setZoom(1);
          setCanvasOffset({ x: 0, y: 0 });
          currentOffset.current = { x: 0, y: 0 };
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") setActiveTool("select");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [activeTool]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === "hand" || e.button === 1) {
      setIsPanning(true);
      dragStart.current = {
        x: e.clientX - canvasOffset.x,
        y: e.clientY - canvasOffset.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && contentRef.current) {
      e.preventDefault(); // Prevent text selection
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      currentOffset.current = { x: dx, y: dy };

      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(${zoomRef.current * 0.5})`;
        }
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setCanvasOffset(currentOffset.current); // Persist final position
    }
  };

  const getWidth = () => {
    if (viewportMode === "mobile") return 380;
    if (viewportMode === "tablet") return 768;
    return 1280;
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-950 font-sans text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Logo textSize="1.2rem" iconSize={28} className="text-white" />
          <div className="h-4 w-[1px] bg-zinc-800" />
          <h1 className="max-w-[200px] truncate text-sm font-medium text-zinc-400">
            {project.title}
          </h1>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-1 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-1">
          <Button
            variant={viewportMode === "mobile" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-lg"
            onClick={() => setViewportMode("mobile")}
            title="Mobile View"
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button
            variant={viewportMode === "tablet" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-lg"
            onClick={() => setViewportMode("tablet")}
            title="Tablet View"
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant={viewportMode === "desktop" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-lg"
            onClick={() => setViewportMode("desktop")}
            title="Desktop View"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-4 w-[1px] bg-zinc-800" />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg text-zinc-400 hover:text-white"
            onClick={() => window.open(window.location.href, "_blank")}
            title="Open in New Tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg text-zinc-400 hover:text-white"
            onClick={() => setShowQrDialog(true)}
            title="Show QR Code"
          >
            <QrCode className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex w-[200px] items-center justify-end gap-3">
          <Button
            onClick={handleCopyLink}
            className="h-9 gap-2 rounded-full bg-white px-4 text-xs font-semibold text-black hover:bg-zinc-200"
          >
            {hasCopied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {hasCopied ? "Copied" : "Copy Link"}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        ref={previewRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsSelected(false);
        }}
        className={cn(
          "relative flex-1 overflow-hidden bg-[#09090b] select-none",
          activeTool === "hand"
            ? isPanning
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-default",
        )}
      >
        {/* Grid Background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundAttachment: "fixed",
            transform: `translate(${canvasOffset.x % (20 * zoom)}px, ${canvasOffset.y % (20 * zoom)}px)`,
          }}
        />

        <div
          className={cn(
            "absolute inset-0 flex items-start justify-center pt-36",
            !isPanning && "transition-transform duration-75 ease-out",
          )}
        >
          <div
            ref={contentRef}
            className={cn(
              "group relative flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.5)]",
              isSelected &&
                "shadow-[0_60px_120px_rgba(0,0,0,0.6)] ring-2 ring-blue-500 ring-offset-4 ring-offset-zinc-950",
            )}
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom * 0.5})`,
              transformOrigin: "center top",
              width: getWidth(),
              height:
                dynamicHeight ||
                (viewportMode === "mobile"
                  ? 800
                  : viewportMode === "tablet"
                    ? 900
                    : 800),
              border: `1px solid ${appliedTheme?.cssVars?.border || "#27272a"}`,
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: appliedTheme?.cssVars?.background || "#09090b",
            }}
            onMouseDown={(e) => {
              if (activeTool === "select") {
                e.stopPropagation();
                setIsSelected(true);
              }
            }}
          >
            <ArtifactFrame
              artifact={{ ...artifact, width: getWidth(), height: undefined }}
              index={0}
              isEditMode={false}
              activeTool={activeTool}
              isDraggingFrame={false}
              appliedTheme={appliedTheme}
              onRef={(i, el) => (iframeRef.current = el)}
            />
          </div>
        </div>
      </main>

      {/* Bottom Toolbar */}
      <div className="pointer-events-auto absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4">
        <div className="flex items-center gap-1 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-1 shadow-2xl backdrop-blur-xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveTool("select")}
            className={cn(
              "h-10 w-10 rounded-xl transition-all",
              activeTool === "select"
                ? "bg-white/10 text-white shadow-inner"
                : "text-zinc-500 hover:bg-transparent hover:text-white",
            )}
            title="Select (V)"
          >
            <MousePointer2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveTool("hand")}
            className={cn(
              "h-10 w-10 rounded-xl transition-all",
              activeTool === "hand"
                ? "bg-white/10 text-white shadow-inner"
                : "text-zinc-500 hover:bg-transparent hover:text-white",
            )}
            title="Hand (H / Space)"
          >
            <Hand className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Right Controls */}
      <div className="pointer-events-auto absolute right-6 bottom-6 z-50 flex items-center gap-1 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-1 shadow-2xl backdrop-blur-xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleZoom(Math.max(0.1, zoom - 0.1), 0, 0)}
          className="h-10 w-10 rounded-xl text-zinc-500 transition-all hover:bg-transparent hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <div className="min-w-[40px] text-center text-[11px] font-bold text-zinc-400">
          {Math.round(zoom * 100)}%
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleZoom(Math.min(5, zoom + 0.1), 0, 0)}
          className="h-10 w-10 rounded-xl text-zinc-500 transition-all hover:bg-transparent hover:text-white"
          title="Zoom In"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <div className="mx-1 h-4 w-[1px] bg-zinc-800" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setZoom(1);
            setCanvasOffset({ x: 0, y: 0 });
          }}
          className="h-10 w-10 rounded-xl text-zinc-500 transition-all hover:bg-transparent hover:text-white"
          title="Reset View"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="overflow-hidden border-zinc-800 bg-zinc-950 p-0 text-white sm:max-w-sm">
          <div className="flex flex-col items-center justify-center gap-8 p-8">
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                Scan for mobile
              </h2>
              <p className="text-xs text-zinc-500">
                Open this screen on your device
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-2xl">
              <QRCodeSVG
                value={
                  typeof window !== "undefined" ? window.location.href : ""
                }
                size={180}
              />
            </div>

            <div className="flex w-full flex-col gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 font-mono text-[11px] leading-relaxed break-all text-zinc-400">
                {typeof window !== "undefined" ? window.location.href : ""}
              </div>
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="h-11 w-full gap-2 rounded-xl border-zinc-800 bg-zinc-900 text-xs font-medium hover:bg-zinc-800 hover:text-white"
              >
                {hasCopied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {hasCopied ? "Copied" : "Copy Link"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
