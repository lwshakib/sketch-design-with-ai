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
  RotateCw,
  Loader2,
  Cloud,
  Check,
  Sparkles,
  MousePointer2,
  Hand,
  ZoomIn,
  ZoomOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Settings,
  Command,
  Search,
  LayoutGrid,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  ArrowUpRight,
  Files,
  ExternalLink,
  QrCode
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import NumberFlow from "@number-flow/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuShortcut
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/user-menu";
import { type Artifact } from "@/lib/artifact-renderer";
import { ArtifactFrame } from "./artifact-frame";
import { ModernShimmer } from "./modern-shimmer";
import { LogoIcon } from "@/components/logo";
import { toast } from "sonner";
import { useProjectStore } from "@/hooks/use-project-store";

const SELECTION_BLUE = '#3b82f6';

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
  handleArtifactAction: (action: 'more' | 'regenerate' | 'variations', artifact: Artifact) => void;
  handleFeedback: (index: number, action: 'like' | 'dislike' | 'none') => void;
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
  handleDownloadFullProject,
  handleDuplicateProject,
  handleDeleteProject
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
    artifacts,
    setArtifacts,
    selectedArtifactIds,
    setSelectedArtifactIds,
    selectionBox,
    isDraggingFrame,
    isResizing,
    isGenerating,
    realtimeStatus,
    designPlan,
    artifactPreviewModes,
    setArtifactPreviewModes,
    dynamicFrameHeights,
    isSaving,
    hasUnsavedChanges,
    leftSidebarMode,
    setLeftSidebarMode,
    isPanning,
    secondarySidebarMode,
    setSecondarySidebarMode,
    activeTool,
    setActiveTool,
    appliedTheme,
    isSidebarVisible,
    setIsSidebarVisible,
    regeneratingArtifactIds,
    setIsCommandMenuOpen,
    setIsSettingsDialogOpen,
    setIsShareDialogOpen,
    project
  } = useProjectStore();

  const { credits } = useWorkspaceStore();

  const isEditMode = secondarySidebarMode === 'properties';
  const status = isGenerating ? 'streaming' : 'ready'; // Simplification for UI checks
  
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
        "flex-1 flex flex-col bg-muted relative overflow-hidden",
        activeTool === 'hand' ? (isPanning ? "cursor-grabbing" : "cursor-grab") : 
        activeTool === 'select' ? "cursor-default" : "cursor-crosshair"
      )}
    >
      {/* Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          transform: `translate(${canvasOffset.x % (20 * zoom)}px, ${canvasOffset.y % (20 * zoom)}px)`
        }}
      />

      {/* Preview Header */}
      <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-30 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            className="h-10 w-10 rounded-xl bg-background/80 backdrop-blur-md border shadow-sm text-muted-foreground hover:text-foreground transition-all"
            title={isSidebarVisible ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarVisible ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
          </Button>
        </div>
        
        <div className="flex items-center gap-6 pointer-events-auto">
          <div className="flex items-center pointer-events-none">
             <span className="text-[11px] font-medium text-muted-foreground/60 transition-colors hover:text-muted-foreground flex items-center">
                <NumberFlow 
                  value={(credits || 0) >= 1000 ? (credits || 0) / 1000 : (credits || 0)} 
                  format={(credits || 0) >= 1000 ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : {}}
                />
                <span className="ml-px">{(credits || 0) >= 1000 ? "k" : ""}</span>
                <span className="ml-1">credits remaining</span>
             </span>
          </div>

          <div className="flex items-center justify-center w-8 h-8">
            {isSaving ? (
              <Loader2 className="h-4 w-4 text-foreground/40 animate-spin" />
            ) : hasUnsavedChanges ? (
              <div title="Unsaved"><Cloud className="h-4 w-4 text-foreground/40" /></div>
            ) : (
              <div className="relative opacity-20" title="Saved">
                <Cloud className="h-4 w-4 text-foreground" />
                <Check className="absolute -bottom-0.5 -right-0.5 h-2 w-2 text-foreground stroke-[4px]" />
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
          throttledArtifacts.length === 0 ? "items-center justify-center pb-20" : "items-start justify-center pt-36",
        )}
      >
        {throttledArtifacts.length > 0 ? (
          <div 
            className={cn(
              "relative",
              !isDraggingFrame && !isResizing && !isPanning && "transition-transform duration-75 ease-out"
            )}
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom * 0.5})`,
              transformOrigin: '0 0'
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
                  if (activeTool === 'select') {
                    startDraggingFrame(e, index);
                  }
                }}
                className={cn(
                  "group absolute top-0 left-0 select-none",
                  activeTool === 'hand' ? (isPanning ? "cursor-grabbing" : "cursor-grab") : (isDraggingFrame ? "cursor-grabbing" : "cursor-default")
                )}
                style={{
                  transform: `translate(${artifact.x || 0}px, ${artifact.y || 0}px)`,
                  transition: isDraggingFrame && artifact.id && selectedArtifactIds.has(artifact.id) ? 'none' : isResizing ? 'none' : 'transform 0.2s ease-out'
                }}
              >
                {/* Modern Floating Toolbar */}
                {activeTool === 'select' && artifact.id && selectedArtifactIds.has(artifact.id) && selectedArtifactIds.size === 1 && (
                  <div 
                    className={cn(
                      "absolute left-1/2 flex items-center gap-3 z-[70] animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto",
                      (!artifact.id || !selectedArtifactIds.has(artifact.id)) && "opacity-0 group-hover:opacity-100"
                    )} 
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      bottom: `calc(100% + ${28 + 20 / zoom}px)`,
                      transform: `translateX(-50%) scale(${1 / zoom})`,
                      transformOrigin: 'bottom center'
                    }}
                  >
                    <div className="flex items-center gap-1 px-2 py-1.5 bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={status !== 'ready'}
                            className="h-9 px-3 text-foreground/80 hover:text-foreground hover:bg-transparent rounded-lg flex items-center gap-2 text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {status !== 'ready' ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-primary" />
                            )}
                            Generate
                            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-56 bg-card border-border text-foreground rounded-xl shadow-2xl p-1.5 z-[100]">
                          <DropdownMenuItem 
                            onClick={() => handleArtifactAction('more', artifact)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px] font-medium"
                          >
                            <Plus className="h-4 w-4 text-primary" />
                            Create more pages
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleArtifactAction('regenerate', artifact)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px] font-medium"
                          >
                            <RotateCcw className="h-4 w-4 text-primary" />
                            Regenerate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleArtifactAction('variations', artifact)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px] font-medium"
                          >
                            <Columns className="h-4 w-4 text-primary" />
                            Variations
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={status !== 'ready'}
                        onClick={() => {
                          if (secondarySidebarMode === 'properties') {
                            setSecondarySidebarMode('none');
                          } else {
                            setSecondarySidebarMode('properties');
                            setActiveTool('select');
                          }
                        }}
                        className={cn(
                          "h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-transparent rounded-lg flex items-center justify-center transition-all disabled:opacity-30",
                          secondarySidebarMode === 'properties' && "bg-primary/20 text-primary shadow-lg shadow-primary/5 border border-primary/30"
                        )}
                        title="Edit Mode"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={status !== 'ready'}
                        onClick={() => {
                          if (secondarySidebarMode === 'theme') {
                            setSecondarySidebarMode('none');
                          } else {
                            setSecondarySidebarMode('theme');
                          }
                        }}
                        className={cn(
                          "h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-transparent rounded-lg flex items-center justify-center transition-all disabled:opacity-30",
                          secondarySidebarMode === 'theme' && "bg-primary/20 text-primary shadow-lg shadow-primary/5 border border-primary/30"
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
                            className="h-9 px-3 text-foreground/80 hover:text-foreground hover:bg-transparent rounded-lg flex items-center gap-2 text-[13px] font-medium transition-colors"
                          >
                            {(() => {
                              const mode = artifactPreviewModes[artifact.title] || artifact.type;
                              if (mode === 'app') return <Smartphone className="h-4 w-4 opacity-70" />;
                              if (mode === 'tablet') return <Tablet className="h-4 w-4 opacity-70" />;
                              return <Monitor className="h-4 w-4 opacity-70" />;
                            })()}
                            Preview
                            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-48 bg-card border-border text-foreground rounded-xl shadow-2xl p-1.5 z-[100]">
                          <DropdownMenuItem 
                            onClick={() => {
                              const newModes = { ...artifactPreviewModes, [artifact.title]: 'app' as const };
                              setArtifactPreviewModes(newModes);
                              setThrottledArtifacts(prev => prev.map((a, i) => i === index ? { ...a, width: undefined, height: undefined } : a));
                              setArtifacts(prev => prev.map((a, i) => i === index ? { ...a, width: undefined, height: undefined } : a));
                            }}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px]"
                          >
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" /> App
                            </div>
                            <span className="text-[10px] text-muted-foreground">380px</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              const newModes = { ...artifactPreviewModes, [artifact.title]: 'web' as const };
                              setArtifactPreviewModes(newModes);
                              setThrottledArtifacts(prev => prev.map((a, i) => i === index ? { ...a, width: undefined, height: undefined } : a));
                              setArtifacts(prev => prev.map((a, i) => i === index ? { ...a, width: undefined, height: undefined } : a));
                            }}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px]"
                          >
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4" /> Web
                            </div>
                            <span className="text-[10px] text-muted-foreground">1280px</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              const newModes = { ...artifactPreviewModes, [artifact.title]: 'tablet' as const };
                              setArtifactPreviewModes(newModes);
                              setThrottledArtifacts(prev => prev.map((a, i) => i === index ? { ...a, width: undefined, height: undefined } : a));
                              setArtifacts(prev => prev.map((a, i) => i === index ? { ...a, width: undefined, height: undefined } : a));
                            }}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px]"
                          >
                            <div className="flex items-center gap-2">
                              <Tablet className="h-4 w-4" /> Tablet
                            </div>
                            <span className="text-[10px] text-muted-foreground">768px</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                             onClick={() => {
                                if (project?.shareToken && artifact.id) {
                                   window.open(`/preview/screen/${artifact.id}/${project.shareToken}`, '_blank');
                                } else {
                                   toast.error("Project must be shared first");
                                }
                             }}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px]"
                          >
                            <ExternalLink className="h-4 w-4" /> New Tab
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                                if (project?.shareToken && artifact.id) {
                                   setQrCodeUrl(`${window.location.origin}/preview/screen/${artifact.id}/${project.shareToken}`);
                                   setIsQrDialogOpen(true);
                               } else {
                                  toast.error("Project must be shared first");
                               }
                            }}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px]"
                          >
                            <QrCode className="h-4 w-4" /> Show QR Code
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <div className="w-[1px] h-4 bg-white/10 mx-1" />
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 p-0 text-foreground/80 hover:text-foreground hover:bg-transparent rounded-lg flex items-center justify-center font-medium transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 bg-card border-border text-foreground rounded-xl shadow-2xl p-1.5 z-[100]">
                          <DropdownMenuItem 
                            onClick={() => openCodeViewer(index)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px]"
                          >
                            <Code className="h-4 w-4 text-muted-foreground" />
                            View Code
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setExportArtifactIndex(index);
                              setIsExportSheetOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px]"
                          >
                            <Share2 className="h-4 w-4 text-muted-foreground" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleExportZip(index)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px]"
                          >
                            <Download className="h-4 w-4 text-muted-foreground" />
                            Download
                          </DropdownMenuItem>
                          <div className="h-px bg-border my-1" />
                          <DropdownMenuItem 
                            onClick={() => deleteArtifact(index)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-destructive/20 text-destructive cursor-pointer text-[13px]"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Feedback Container */}
                    <div className="flex items-center gap-0.5 px-1.5 py-1.5 bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleFeedback(index, artifact.isLiked ? 'none' : 'like')}
                        className={cn(
                          "h-9 w-9 p-0 rounded-lg transition-all",
                          artifact.isLiked ? "text-primary bg-primary/10" : "text-foreground/80 hover:text-foreground hover:bg-transparent"
                        )}
                      >
                        <ThumbsUp className={cn("h-4 w-4", artifact.isLiked && "fill-current")} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleFeedback(index, artifact.isDisliked ? 'none' : 'dislike')}
                        className={cn(
                          "h-9 w-9 p-0 rounded-lg transition-all",
                          artifact.isDisliked ? "text-red-500 bg-red-500/10" : "text-foreground/80 hover:text-foreground hover:bg-transparent"
                        )}
                      >
                        <ThumbsDown className={cn("h-4 w-4", artifact.isDisliked && "fill-current")} />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Frame Info Overlay */}
                {(artifact.id && (selectedArtifactIds.has(artifact.id) || isDraggingFrame || artifact.isComplete)) && (
                  <div className="absolute -top-7 left-0 right-0 flex items-center justify-between px-1 pointer-events-none select-none">
                     <span 
                       className="text-[12px] font-bold"
                       style={{ color: appliedTheme?.cssVars.primary || 'var(--primary)' }}
                     >
                       {artifact.title || "Untitled Screen"}
                     </span>
                    <div className="flex items-center gap-2">
                       <Code 
                         className="h-3.5 w-3.5" 
                         style={{ color: appliedTheme?.cssVars.mutedForeground || 'var(--muted-foreground)' }}
                       />
                    </div>
                  </div>
                )}

                <div 
                  className={cn(
                    "transition-shadow duration-300 ease-in-out shadow-[0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden border relative flex-shrink-0",
                    isDraggingFrame && artifact.id && selectedArtifactIds.has(artifact.id) && "shadow-[0_60px_120px_rgba(0,0,0,0.5)]"
                  )}
                  style={{
                    width: (() => {
                      const mode = artifactPreviewModes[artifact.title];
                      if (mode === 'app') return "380px";
                      if (mode === 'web') return "1280px";
                      if (mode === 'tablet') return "768px";
                      return artifact.width ? `${artifact.width}px` : (artifact.type === 'app' ? "380px" : "1280px");
                    })(),
                    height: (() => {
                      // Manual resize takes absolute priority
                      if (artifact.height) return `${artifact.height}px`;
                      
                      const dynamicHeight = dynamicFrameHeights[artifact.title];
                      // Prefer dynamic height if detected and no manual height is set
                      if (dynamicHeight && dynamicHeight > 100) return `${dynamicHeight}px`;
                      
                      return artifact.type === 'app' ? "800px" : "700px";
                    })(),
                    minHeight: (artifactPreviewModes[artifact.title] === 'app' || (artifact.type === 'app' && !artifactPreviewModes[artifact.title])) ? '800px' : '400px',
                    transition: isResizing ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: appliedTheme?.cssVars.background || 'var(--background)',
                    borderColor: artifact.id && selectedArtifactIds.has(artifact.id) ? SELECTION_BLUE : (appliedTheme?.cssVars.border || 'var(--border)'),
                    boxShadow: artifact.id && selectedArtifactIds.has(artifact.id) ? `0 0 0 2px ${SELECTION_BLUE}40, 0 40px 100px rgba(0,0,0,0.4)` : undefined
                  }}
                >
                  {((!artifact.isComplete && !artifact.content) || (artifact.id && regeneratingArtifactIds.has(artifact.id))) && (
                    <ModernShimmer type={artifact.type} appliedTheme={appliedTheme} />
                  )}
                  
                  <div className={cn(
                    "w-full h-full transition-opacity duration-500",
                    artifact.id && regeneratingArtifactIds.has(artifact.id) ? "opacity-30" : "opacity-100"
                  )}>
                    <ArtifactFrame 
                      artifact={artifact}
                      index={index}
                      isEditMode={isEditMode}
                      activeTool={activeTool}
                      isDraggingFrame={isDraggingFrame}
                      appliedTheme={appliedTheme}
                      onRef={(idx, el) => { 
                        if (el) (el as any).dataset.artifactTitle = artifact.title;
                        iframeRefs.current[artifact.title] = el; 
                      }}
                    />
                  </div>
                </div>

                {artifact.id && selectedArtifactIds.has(artifact.id) && (
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 80 }}>
                    {selectedArtifactIds.size === 1 && (
                      <>
                        {/* Edge Handles */}
                        <div 
                          onMouseDown={(e) => startResizing(e, index, 'left')}
                          className="absolute top-4 bottom-4 left-0 w-1.5 cursor-ew-resize -translate-x-1/2 pointer-events-auto z-50"
                        />
                        <div 
                          onMouseDown={(e) => startResizing(e, index, 'right')}
                          className="absolute top-4 bottom-4 right-0 w-1.5 cursor-ew-resize translate-x-1/2 pointer-events-auto z-50"
                        />
                        <div 
                          onMouseDown={(e) => startResizing(e, index, 'top')}
                          className="absolute top-0 left-4 right-4 h-1.5 cursor-ns-resize -translate-y-1/2 pointer-events-auto z-50"
                        />
                        <div 
                          onMouseDown={(e) => startResizing(e, index, 'bottom')}
                          className="absolute bottom-0 left-4 right-4 h-1.5 cursor-ns-resize translate-y-1/2 pointer-events-auto z-50"
                        />

                        {/* Corner Handles */}
                        <div 
                          onMouseDown={(e) => startResizing(e, index, 'top-left')}
                          className="absolute top-0 left-0 w-2.5 h-2.5 bg-white border-2 border-[#3b82f6] rounded-full pointer-events-auto cursor-nwse-resize -translate-x-1/2 -translate-y-1/2 z-50 shadow-sm" 
                        />
                        <div 
                          onMouseDown={(e) => startResizing(e, index, 'top-right')}
                          className="absolute top-0 right-0 w-2.5 h-2.5 bg-white border-2 border-[#3b82f6] rounded-full pointer-events-auto cursor-nesw-resize translate-x-1/2 -translate-y-1/2 z-50 shadow-sm" 
                        />
                        <div 
                          onMouseDown={(e) => startResizing(e, index, 'bottom-left')}
                          className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-white border-2 border-[#3b82f6] rounded-full pointer-events-auto cursor-nesw-resize -translate-x-1/2 translate-y-1/2 z-50 shadow-sm" 
                        />
                        <div 
                          onMouseDown={(e) => startResizing(e, index, 'bottom-right')}
                          className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-white border-2 border-[#3b82f6] rounded-full pointer-events-auto cursor-nwse-resize translate-x-1/2 translate-y-1/2 z-50 shadow-sm" 
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
          <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000">
            <div className="mb-8">
              <LogoIcon className="h-32 w-32 text-primary/10" />
            </div>
            <p className="text-sm font-medium text-muted-foreground/40">
              Generate your first design to see it here
            </p>
          </div>
        )}
      </div>

      {/* Selection Box Overlay */}
      {selectionBox && (
        <div 
          className="absolute border border-primary/60 bg-primary/10 pointer-events-none z-[1000] rounded-sm"
          style={{
            left: Math.min(selectionBox.x1, selectionBox.x2),
            top: Math.min(selectionBox.y1, selectionBox.y2),
            width: Math.abs(selectionBox.x2 - selectionBox.x1),
            height: Math.abs(selectionBox.y2 - selectionBox.y1)
          }}
        />
      )}

      {/* Bottom Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div className="flex items-center gap-1 p-1 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveTool('select')}
            className={cn(
              "h-10 w-10 rounded-xl transition-all",
              activeTool === 'select' 
                ? "bg-primary/10 text-primary shadow-inner hover:bg-primary/10" 
                : "text-muted-foreground hover:text-foreground hover:bg-transparent"
            )}
            title="Select (V)"
          >
            <MousePointer2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveTool('hand')}
            className={cn(
              "h-10 w-10 rounded-xl transition-all",
              activeTool === 'hand' 
                ? "bg-primary/10 text-primary shadow-inner hover:bg-primary/10" 
                : "text-muted-foreground hover:text-foreground hover:bg-transparent"
            )}
            title="Hand (H / Space)"
          >
            <Hand className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Right Controls */}
      <div className="absolute bottom-6 right-6 z-50 flex items-center gap-1 p-1 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl pointer-events-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))}
          className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-transparent transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <div className="min-w-[40px] text-center text-[11px] font-bold text-muted-foreground">
          {Math.round(zoom * 100)}%
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom(prev => Math.min(5, prev + 0.1))}
          className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-transparent transition-all"
          title="Zoom In"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <div className="w-[1px] h-4 bg-border/50 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setZoom(1);
            setCanvasOffset({ x: 0, y: 0 });
            setFramePos({ x: 0, y: 0 });
          }}
          className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-transparent transition-all"
          title="Reset View"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-sm p-0 overflow-hidden">
          <div className="flex flex-col items-center justify-center p-8 gap-8">
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Scan for mobile</h2>
              <p className="text-xs text-zinc-500">Open this screen on your device</p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-2xl">
               <QRCodeSVG value={qrCodeUrl} size={180} />
            </div>
            
            <div className="flex flex-col gap-3 w-full">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-[11px] text-zinc-400 font-mono break-all leading-relaxed">
                {qrCodeUrl}
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(qrCodeUrl);
                  toast.success("Link copied to clipboard");
                }} 
                className="w-full border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-white rounded-xl h-11 text-xs font-medium gap-2"
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
