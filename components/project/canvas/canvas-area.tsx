"use client";

import React from "react";
import {
  ChevronDown,
  Plus,
  RotateCcw,
  Columns,
  Pencil,
  Palette,
  Smartphone,
  Monitor,
  Tablet,
  MoreHorizontal,
  Code,
  Share2,
  Download,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Cloud,
  Check,
  Sparkles,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  QrCode,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import NumberFlow from "@number-flow/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/user-menu";
import { type Artifact } from "@/lib/artifact-renderer";
import { ArtifactFrame } from "./artifact-frame";
import { ModernShimmer } from "./modern-shimmer";
import { CanvasToolbar } from "./canvas-toolbar";
import { LogoIcon } from "@/components/logo";
import { toast } from "sonner";
import { useProjectStore } from "@/hooks/use-project-store";

const SELECTION_BLUE = "#3b82f6";

interface CanvasAreaProps {
  previewRef: React.RefObject<HTMLDivElement | null>;
  iframeRefs: React.MutableRefObject<Record<string, HTMLIFrameElement | null>>;

  // Interaction Handlers (from useCanvas)
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  startResizing: (e: React.MouseEvent, index: number, handle: string) => void;
  startDraggingFrame: (e: React.MouseEvent, index: number) => void;

  // Page-level Action Handlers
  handleArtifactAction: (
    action: "more" | "regenerate" | "variations",
    artifact: Artifact,
  ) => void;
  handleFeedback: (index: number, action: "like" | "dislike" | "none") => void;
  openCodeViewer: (index: number) => void;
  handleExportZip: (index: number) => void;
  deleteArtifact: (index: number) => void;
  setIsExportSheetOpen: (open: boolean) => void;
  setExportArtifactIndex: (index: number | null) => void;
  handleDownloadFullProject: () => void;
  handleDuplicateProject: () => void;
  handleDeleteProject: () => void;
}

export function CanvasArea({
  previewRef,
  iframeRefs,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  startResizing,
  startDraggingFrame,
  handleArtifactAction,
  handleFeedback,
  openCodeViewer,
  handleExportZip,
  deleteArtifact,
  setIsExportSheetOpen,
  setExportArtifactIndex,
  handleDownloadFullProject: _handleDownloadFullProject,
  handleDuplicateProject: _handleDuplicateProject,
  handleDeleteProject: _handleDeleteProject,
}: CanvasAreaProps) {
  const {
    zoom,
    setZoom,
    canvasOffset,
    setCanvasOffset,
    framePos,
    setFramePos,
    throttledArtifacts,
    setThrottledArtifacts,
    artifacts: _artifacts,
    setArtifacts,
    selectedArtifactIds,
    setSelectedArtifactIds,
    selectionBox,
    isDraggingFrame,
    isResizing,
    isGenerating: _isGenerating,
    realtimeStatus: _realtimeStatus,
    designPlan: _designPlan,
    artifactPreviewModes,
    setArtifactPreviewModes,
    dynamicFrameHeights,
    isSaving,
    hasUnsavedChanges,
    leftSidebarMode: _leftSidebarMode,
    setLeftSidebarMode: _setLeftSidebarMode,
    isPanning,
    secondarySidebarMode,
    setSecondarySidebarMode,
    activeTool,
    setActiveTool,
    appliedTheme,
    isSidebarVisible,
    setIsSidebarVisible,
    regeneratingArtifactIds,
    setIsCommandMenuOpen: _setIsCommandMenuOpen,
    isSettingsDialogOpen: _isSettingsDialogOpen,
    setIsSettingsDialogOpen: _setIsSettingsDialogOpen,
    setIsShareDialogOpen: _setIsShareDialogOpen,
    project,
  } = useProjectStore();

  const { credits } = useWorkspaceStore();

  const isEditMode = secondarySidebarMode === "properties";
  const _status = _isGenerating ? "streaming" : "ready"; // Simplification for UI checks

  const [isQrDialogOpen, setIsQrDialogOpen] = React.useState(false);
  const [qrCodeUrl, setQrCodeUrl] = React.useState("");

  return (
    <main
      ref={previewRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={(e) => {
        if (e.target === e.currentTarget) setSelectedArtifactIds(new Set());
      }}
      className={cn(
        "bg-muted relative flex flex-1 flex-col overflow-hidden",
        activeTool === "hand"
          ? isPanning
            ? "cursor-grabbing"
            : "cursor-grab"
          : activeTool === "select"
            ? "cursor-default"
            : "cursor-crosshair",
      )}
    >
      {/* Grid Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: `${20 * zoom * 0.5}px ${20 * zoom * 0.5}px`,
          transform: `translate(${canvasOffset.x % (20 * zoom * 0.5)}px, ${canvasOffset.y % (20 * zoom * 0.5)}px)`,
        }}
      />

      {/* Preview Header */}
      <header className="pointer-events-none absolute top-0 right-0 left-0 z-30 flex h-16 items-center justify-between px-6">
        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            className="bg-background/80 text-muted-foreground hover:text-foreground h-10 w-10 rounded-xl border shadow-sm backdrop-blur-md transition-all"
            title={isSidebarVisible ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarVisible ? (
              <ChevronLeft className="h-6 w-6" />
            ) : (
              <ChevronRight className="h-6 w-6" />
            )}
          </Button>
        </div>

        <div className="pointer-events-auto flex items-center gap-6">
          <div className="pointer-events-none flex items-center">
            <span className="text-muted-foreground/60 hover:text-muted-foreground flex items-center text-[11px] font-medium transition-colors">
              <NumberFlow
                value={
                  (credits || 0) >= 1000 ? (credits || 0) / 1000 : credits || 0
                }
                format={
                  (credits || 0) >= 1000
                    ? { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                    : {}
                }
              />
              <span className="ml-px">{(credits || 0) >= 1000 ? "k" : ""}</span>
              <span className="ml-1">credits remaining</span>
            </span>
          </div>

          <div className="flex h-8 w-8 items-center justify-center">
            {isSaving ? (
              <Loader2 className="text-foreground/40 h-4 w-4 animate-spin" />
            ) : hasUnsavedChanges ? (
              <div title="Unsaved">
                <Cloud className="text-foreground/40 h-4 w-4" />
              </div>
            ) : (
              <div className="relative opacity-20" title="Saved">
                <Cloud className="text-foreground h-4 w-4" />
                <Check className="text-foreground absolute -right-0.5 -bottom-0.5 h-2 w-2 stroke-[4px]" />
              </div>
            )}
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Content Layer */}
      <div
        className={cn(
          "absolute inset-0 flex select-none",
          throttledArtifacts.length === 0
            ? "items-center justify-center pb-20"
            : "items-start justify-center pt-36",
        )}
      >
        {throttledArtifacts.length > 0 ? (
          <div
            className="relative"
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom * 0.5})`,
              transformOrigin: "0 0",
              transition:
                isPanning || isDraggingFrame || isResizing
                  ? "none"
                  : "transform 0.5s cubic-bezier(0.2, 0, 0, 1)",
            }}
          >
            <div
              className="relative"
              style={{
                transform: `translate(${framePos.x}px, ${framePos.y}px)`,
              }}
            >
              {throttledArtifacts.map((artifact, index) => (
                <div
                  key={index}
                  onMouseDown={(e) => {
                    if (activeTool === "select") {
                      startDraggingFrame(e, index);
                    }
                  }}
                  onDoubleClick={() => {
                    if (activeTool === "select") {
                      useProjectStore.getState().focusArtifact(artifact.title);
                    }
                  }}
                  className={cn(
                    "group absolute top-0 left-0 select-none",
                    activeTool === "hand"
                      ? isPanning
                        ? "cursor-grabbing"
                        : "cursor-grab"
                      : isDraggingFrame
                        ? "cursor-grabbing"
                        : "cursor-default",
                  )}
                  style={{
                    transform: `translate(${artifact.x || 0}px, ${artifact.y || 0}px)`,
                    transition:
                      isDraggingFrame &&
                      artifact.id &&
                      selectedArtifactIds.has(artifact.id)
                        ? "none"
                        : isResizing
                          ? "none"
                          : "transform 0.2s ease-out",
                  }}
                >
                  {/* Modern Floating Toolbar */}
                  {activeTool === "select" &&
                    artifact.id &&
                    selectedArtifactIds.has(artifact.id) &&
                    selectedArtifactIds.size === 1 && (
                      <div
                        className={cn(
                          "animate-in fade-in slide-in-from-bottom-2 pointer-events-auto absolute left-1/2 z-[70] flex items-center gap-3 duration-300",
                          (!artifact.id ||
                            !selectedArtifactIds.has(artifact.id)) &&
                            "opacity-0 group-hover:opacity-100",
                        )}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                          bottom: `calc(100% + ${28 + 20 / zoom}px)`,
                          transform: `translateX(-50%) scale(${1.8 / zoom})`,
                          transformOrigin: "bottom center",
                        }}
                      >
                        <div className="bg-card/95 border-border/50 flex items-center gap-1 rounded-lg border px-2 py-1.5 shadow-2xl backdrop-blur-md">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-foreground/80 hover:text-foreground flex h-9 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors hover:bg-transparent"
                              >
                                <Sparkles className="text-primary h-4 w-4" />
                                Generate
                                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="center"
                              className="bg-card border-border text-foreground z-[100] w-56 rounded-xl p-1.5 shadow-2xl"
                            >
                              <DropdownMenuItem
                                onClick={() =>
                                  handleArtifactAction("more", artifact)
                                }
                                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium"
                              >
                                <Plus className="text-primary h-4 w-4" />
                                Create more pages
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleArtifactAction("regenerate", artifact)
                                }
                                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium"
                              >
                                <RotateCcw className="text-primary h-4 w-4" />
                                Regenerate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleArtifactAction("variations", artifact)
                                }
                                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium"
                              >
                                <Columns className="text-primary h-4 w-4" />
                                Variations
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (secondarySidebarMode === "properties") {
                                setSecondarySidebarMode("none");
                              } else {
                                setSecondarySidebarMode("properties");
                                setActiveTool("select");
                              }
                            }}
                            className={cn(
                              "text-foreground/80 hover:text-foreground flex h-9 w-9 items-center justify-center rounded-md transition-all hover:bg-transparent disabled:opacity-30",
                              secondarySidebarMode === "properties" &&
                                "bg-primary/20 text-primary shadow-primary/5 border-primary/30 border shadow-lg",
                            )}
                            title="Edit Mode"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (secondarySidebarMode === "theme") {
                                setSecondarySidebarMode("none");
                              } else {
                                setSecondarySidebarMode("theme");
                              }
                            }}
                            className={cn(
                              "text-foreground/80 hover:text-foreground flex h-9 w-9 items-center justify-center rounded-md transition-all hover:bg-transparent disabled:opacity-30",
                              secondarySidebarMode === "theme" &&
                                "bg-primary/20 text-primary shadow-primary/5 border-primary/30 border shadow-lg",
                            )}
                            title="Theme Settings"
                          >
                            <Palette className="h-4 w-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-foreground/80 hover:text-foreground flex h-9 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors hover:bg-transparent"
                              >
                                {(() => {
                                  const mode =
                                    artifactPreviewModes[artifact.title] ||
                                    artifact.type;
                                  if (mode === "app")
                                    return (
                                      <Smartphone className="h-4 w-4 opacity-70" />
                                    );
                                  if (mode === "tablet")
                                    return (
                                      <Tablet className="h-4 w-4 opacity-70" />
                                    );
                                  return (
                                    <Monitor className="h-4 w-4 opacity-70" />
                                  );
                                })()}
                                Preview
                                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="center"
                              className="bg-card border-border text-foreground z-[100] w-48 rounded-xl p-1.5 shadow-2xl"
                            >
                              <DropdownMenuItem
                                onClick={() => {
                                  const newModes = {
                                    ...artifactPreviewModes,
                                    [artifact.title]: "app" as const,
                                  };
                                  setArtifactPreviewModes(newModes);
                                  setThrottledArtifacts((prev) =>
                                    prev.map((a, i) =>
                                      i === index
                                        ? {
                                            ...a,
                                            width: undefined,
                                            height: undefined,
                                          }
                                        : a,
                                    ),
                                  );
                                  setArtifacts((prev) =>
                                    prev.map((a, i) =>
                                      i === index
                                        ? {
                                            ...a,
                                            width: undefined,
                                            height: undefined,
                                          }
                                        : a,
                                    ),
                                  );
                                }}
                                className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-[13px]"
                              >
                                <div className="flex items-center gap-2">
                                  <Smartphone className="h-4 w-4" /> App
                                </div>
                                <span className="text-muted-foreground text-[10px]">
                                  380px
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const newModes = {
                                    ...artifactPreviewModes,
                                    [artifact.title]: "web" as const,
                                  };
                                  setArtifactPreviewModes(newModes);
                                  setThrottledArtifacts((prev) =>
                                    prev.map((a, i) =>
                                      i === index
                                        ? {
                                            ...a,
                                            width: undefined,
                                            height: undefined,
                                          }
                                        : a,
                                    ),
                                  );
                                  setArtifacts((prev) =>
                                    prev.map((a, i) =>
                                      i === index
                                        ? {
                                            ...a,
                                            width: undefined,
                                            height: undefined,
                                          }
                                        : a,
                                    ),
                                  );
                                }}
                                className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-[13px]"
                              >
                                <div className="flex items-center gap-2">
                                  <Monitor className="h-4 w-4" /> Web
                                </div>
                                <span className="text-muted-foreground text-[10px]">
                                  1280px
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const newModes = {
                                    ...artifactPreviewModes,
                                    [artifact.title]: "tablet" as const,
                                  };
                                  setArtifactPreviewModes(newModes);
                                  setThrottledArtifacts((prev) =>
                                    prev.map((a, i) =>
                                      i === index
                                        ? {
                                            ...a,
                                            width: undefined,
                                            height: undefined,
                                          }
                                        : a,
                                    ),
                                  );
                                  setArtifacts((prev) =>
                                    prev.map((a, i) =>
                                      i === index
                                        ? {
                                            ...a,
                                            width: undefined,
                                            height: undefined,
                                          }
                                        : a,
                                    ),
                                  );
                                }}
                                className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-[13px]"
                              >
                                <div className="flex items-center gap-2">
                                  <Tablet className="h-4 w-4" /> Tablet
                                </div>
                                <span className="text-muted-foreground text-[10px]">
                                  768px
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  if (project?.shareToken && artifact.id) {
                                    window.open(
                                      `/preview/screen/${artifact.id}/${project.shareToken}`,
                                      "_blank",
                                    );
                                  } else {
                                    toast.error("Project must be shared first");
                                  }
                                }}
                                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-[13px]"
                              >
                                <ExternalLink className="h-4 w-4" /> New Tab
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (project?.shareToken && artifact.id) {
                                    setQrCodeUrl(
                                      `${window.location.origin}/preview/screen/${artifact.id}/${project.shareToken}`,
                                    );
                                    setIsQrDialogOpen(true);
                                  } else {
                                    toast.error("Project must be shared first");
                                  }
                                }}
                                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-[13px]"
                              >
                                <QrCode className="h-4 w-4" /> Show QR Code
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <div className="mx-1 h-4 w-[1px] bg-white/10" />

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-foreground/80 hover:text-foreground flex h-9 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors hover:bg-transparent"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-card border-border text-foreground z-[100] w-52 rounded-xl p-1.5 shadow-2xl"
                            >
                              <DropdownMenuItem
                                onClick={() => openCodeViewer(index)}
                                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-[13px]"
                              >
                                <Code className="text-muted-foreground h-4 w-4" />
                                View Code
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setExportArtifactIndex(index);
                                  setIsExportSheetOpen(true);
                                }}
                                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-[13px]"
                              >
                                <Share2 className="text-muted-foreground h-4 w-4" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleExportZip(index)}
                                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-[13px]"
                              >
                                <Download className="text-muted-foreground h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <div className="bg-border my-1 h-px" />
                              <DropdownMenuItem
                                onClick={() => deleteArtifact(index)}
                                className="hover:bg-destructive/20 text-destructive flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-[13px]"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Feedback Container */}
                        <div className="bg-card/95 border-border/50 flex items-center gap-0.5 rounded-lg border px-1.5 py-1.5 shadow-2xl backdrop-blur-md">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleFeedback(
                                index,
                                artifact.isLiked ? "none" : "like",
                              )
                            }
                            className={cn(
                              "h-9 w-9 rounded-md p-0 transition-all",
                              artifact.isLiked
                                ? "text-primary bg-primary/10"
                                : "text-foreground/80 hover:text-foreground hover:bg-transparent",
                            )}
                          >
                            <ThumbsUp
                              className={cn(
                                "h-4 w-4",
                                artifact.isLiked && "fill-current",
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleFeedback(
                                index,
                                artifact.isDisliked ? "none" : "dislike",
                              )
                            }
                            className={cn(
                              "h-9 w-9 rounded-md p-0 transition-all",
                              artifact.isDisliked
                                ? "bg-red-500/10 text-red-500"
                                : "text-foreground/80 hover:text-foreground hover:bg-transparent",
                            )}
                          >
                            <ThumbsDown
                              className={cn(
                                "h-4 w-4",
                                artifact.isDisliked && "fill-current",
                              )}
                            />
                          </Button>
                        </div>
                      </div>
                    )}

                  {/* Frame Info Overlay */}
                  {artifact.id &&
                    (selectedArtifactIds.has(artifact.id) ||
                      isDraggingFrame ||
                      artifact.isComplete) && (
                      <div className="pointer-events-none absolute -top-7 right-0 left-0 flex items-center justify-between px-1 select-none">
                        <span
                          className="text-[12px] font-bold"
                          style={{
                            color:
                              appliedTheme?.cssVars?.primary ||
                              "var(--primary)",
                          }}
                        >
                          {artifact.title || "Untitled Screen"}
                        </span>
                        <div className="flex items-center gap-2">
                          <Code
                            className="h-3.5 w-3.5"
                            style={{
                              color:
                                appliedTheme?.cssVars?.mutedForeground ||
                                "var(--muted-foreground)",
                            }}
                          />
                        </div>
                      </div>
                    )}

                  <div
                    className={cn(
                      "relative flex-shrink-0 overflow-hidden border shadow-[0_40px_100px_rgba(0,0,0,0.4)] transition-shadow duration-300 ease-in-out",
                      isDraggingFrame &&
                        artifact.id &&
                        selectedArtifactIds.has(artifact.id) &&
                        "shadow-[0_60px_120px_rgba(0,0,0,0.5)]",
                    )}
                    style={{
                      width: (() => {
                        const mode = artifactPreviewModes[artifact.title];
                        if (mode === "app") return "380px";
                        if (mode === "web") return "1280px";
                        if (mode === "tablet") return "768px";
                        return artifact.width
                          ? `${artifact.width}px`
                          : artifact.type === "app"
                            ? "380px"
                            : "1280px";
                      })(),
                      height: (() => {
                        // Manual resize takes absolute priority
                        if (artifact.height) return `${artifact.height}px`;

                        const dynamicHeight =
                          dynamicFrameHeights[artifact.title];
                        // Prefer dynamic height if detected and no manual height is set
                        if (dynamicHeight && dynamicHeight > 100)
                          return `${dynamicHeight}px`;

                        return artifact.type === "app" ? "800px" : "700px";
                      })(),
                      minHeight:
                        artifactPreviewModes[artifact.title] === "app" ||
                        (artifact.type === "app" &&
                          !artifactPreviewModes[artifact.title])
                          ? "800px"
                          : "400px",
                      transition: isResizing
                        ? "none"
                        : "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      backgroundColor:
                        appliedTheme?.cssVars?.background ||
                        "var(--background)",
                      borderColor:
                        artifact.id && selectedArtifactIds.has(artifact.id)
                          ? SELECTION_BLUE
                          : appliedTheme?.cssVars?.border || "var(--border)",
                      boxShadow:
                        artifact.id && selectedArtifactIds.has(artifact.id)
                          ? `0 0 0 2px ${SELECTION_BLUE}40, 0 40px 100px rgba(0,0,0,0.4)`
                          : undefined,
                    }}
                  >
                    {((!artifact.isComplete && !artifact.content) ||
                      (artifact.id &&
                        regeneratingArtifactIds.has(artifact.id))) && (
                      <ModernShimmer
                        type={artifact.type}
                        appliedTheme={appliedTheme}
                      />
                    )}

                    <div
                      className={cn(
                        "h-full w-full transition-opacity duration-500",
                        artifact.id && regeneratingArtifactIds.has(artifact.id)
                          ? "opacity-30"
                          : "opacity-100",
                      )}
                    >
                      <ArtifactFrame
                        artifact={artifact}
                        index={index}
                        isEditMode={isEditMode}
                        activeTool={activeTool}
                        isDraggingFrame={isDraggingFrame}
                        appliedTheme={appliedTheme}
                        onRef={(idx, el) => {
                          if (el)
                            (el as any).dataset.artifactTitle = artifact.title;
                          iframeRefs.current[artifact.title] = el;
                        }}
                      />
                    </div>
                  </div>

                  {artifact.id && selectedArtifactIds.has(artifact.id) && (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{ zIndex: 80 }}
                    >
                      {selectedArtifactIds.size === 1 && (
                        <>
                          {/* Edge Handles */}
                          <div
                            onMouseDown={(e) => startResizing(e, index, "left")}
                            className="pointer-events-auto absolute top-4 bottom-4 left-0 z-50 w-1.5 -translate-x-1/2 cursor-ew-resize"
                          />
                          <div
                            onMouseDown={(e) =>
                              startResizing(e, index, "right")
                            }
                            className="pointer-events-auto absolute top-4 right-0 bottom-4 z-50 w-1.5 translate-x-1/2 cursor-ew-resize"
                          />
                          <div
                            onMouseDown={(e) => startResizing(e, index, "top")}
                            className="pointer-events-auto absolute top-0 right-4 left-4 z-50 h-1.5 -translate-y-1/2 cursor-ns-resize"
                          />
                          <div
                            onMouseDown={(e) =>
                              startResizing(e, index, "bottom")
                            }
                            className="pointer-events-auto absolute right-4 bottom-0 left-4 z-50 h-1.5 translate-y-1/2 cursor-ns-resize"
                          />

                          {/* Corner Handles */}
                          <div
                            onMouseDown={(e) =>
                              startResizing(e, index, "top-left")
                            }
                            className="pointer-events-auto absolute top-0 left-0 z-50 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize rounded-full border-2 border-[#3b82f6] bg-white shadow-sm"
                          />
                          <div
                            onMouseDown={(e) =>
                              startResizing(e, index, "top-right")
                            }
                            className="pointer-events-auto absolute top-0 right-0 z-50 h-2.5 w-2.5 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize rounded-full border-2 border-[#3b82f6] bg-white shadow-sm"
                          />
                          <div
                            onMouseDown={(e) =>
                              startResizing(e, index, "bottom-left")
                            }
                            className="pointer-events-auto absolute bottom-0 left-0 z-50 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize rounded-full border-2 border-[#3b82f6] bg-white shadow-sm"
                          />
                          <div
                            onMouseDown={(e) =>
                              startResizing(e, index, "bottom-right")
                            }
                            className="pointer-events-auto absolute right-0 bottom-0 z-50 h-2.5 w-2.5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-full border-2 border-[#3b82f6] bg-white shadow-sm"
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center duration-1000">
            <div className="mb-8">
              <LogoIcon className="text-primary/10 h-32 w-32" />
            </div>
            <p className="text-muted-foreground/40 text-sm font-medium">
              Generate your first design to see it here
            </p>
          </div>
        )}
      </div>

      {/* Selection Box Overlay */}
      {selectionBox && (
        <div
          className="border-primary/60 bg-primary/10 pointer-events-none absolute z-[1000] rounded-sm border"
          style={{
            left: Math.min(selectionBox.x1, selectionBox.x2),
            top: Math.min(selectionBox.y1, selectionBox.y2),
            width: Math.abs(selectionBox.x2 - selectionBox.x1),
            height: Math.abs(selectionBox.y2 - selectionBox.y1),
          }}
        />
      )}

      {/* Bottom Toolbar */}
      <CanvasToolbar />

      {/* Bottom Right Controls */}
      <div className="bg-card/80 border-border/50 pointer-events-auto absolute right-6 bottom-6 z-50 flex items-center gap-1 rounded-2xl border p-1 shadow-2xl backdrop-blur-xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom((prev) => Math.max(0.1, prev - 0.1))}
          className="text-muted-foreground hover:text-foreground h-10 w-10 rounded-xl transition-all hover:bg-transparent"
          title="Zoom Out"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <div className="text-muted-foreground min-w-[40px] text-center text-[11px] font-bold">
          {Math.round(zoom * 100)}%
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom((prev) => Math.min(5, prev + 0.1))}
          className="text-muted-foreground hover:text-foreground h-10 w-10 rounded-xl transition-all hover:bg-transparent"
          title="Zoom In"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <div className="bg-border/50 mx-1 h-4 w-[1px]" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setZoom(1);
            setCanvasOffset({ x: 0, y: 0 });
            setFramePos({ x: 0, y: 0 });
          }}
          className="text-muted-foreground hover:text-foreground h-10 w-10 rounded-xl transition-all hover:bg-transparent"
          title="Reset View"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
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
              <QRCodeSVG value={qrCodeUrl} size={180} />
            </div>

            <div className="flex w-full flex-col gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 font-mono text-[11px] leading-relaxed break-all text-zinc-400">
                {qrCodeUrl}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(qrCodeUrl);
                  toast.success("Link copied to clipboard");
                }}
                className="h-11 w-full gap-2 rounded-xl border-zinc-800 bg-zinc-900 text-xs font-medium hover:bg-zinc-800 hover:text-white"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
