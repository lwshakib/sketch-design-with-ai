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
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/user-menu";
import { type Artifact } from "@/lib/artifact-renderer";
import { ArtifactFrame } from "./artifact-frame";
import { ModernShimmer } from "./modern-shimmer";
import { Badge } from "@/components/ui/badge";
import { LogoIcon } from "@/components/logo";
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
  setExportArtifactIndex
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
    selectedArtifactIndex,
    setSelectedArtifactIndex,
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
    setIsSidebarVisible
  } = useProjectStore();

  const isEditMode = secondarySidebarMode === 'properties';
  const status = isGenerating ? 'streaming' : 'ready'; // Simplification for UI checks

  return (
    <main 
      ref={previewRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={(e) => {
        if (e.target === e.currentTarget) setSelectedArtifactIndex(null);
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
        
        <div className="flex items-center gap-4 pointer-events-auto">
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
          !isDraggingFrame && !isResizing && !isPanning && "transition-transform duration-75 ease-out"
        )}
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {throttledArtifacts.length > 0 ? (
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
                  setSelectedArtifactIndex(index);
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
                  transition: isDraggingFrame && selectedArtifactIndex === index ? 'none' : isResizing ? 'none' : 'transform 0.2s ease-out'
                }}
              >
                {/* Modern Floating Toolbar */}
                {activeTool === 'select' && (selectedArtifactIndex === index || (artifact.isComplete && selectedArtifactIndex === index)) && (
                  <div 
                    className={cn(
                      "absolute left-1/2 flex items-center gap-3 z-[70] animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto",
                      selectedArtifactIndex !== index && "opacity-0 group-hover:opacity-100"
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
                {(selectedArtifactIndex === index || isDraggingFrame || artifact.isComplete) && (
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
                    isDraggingFrame && selectedArtifactIndex === index && "shadow-[0_60px_120px_rgba(0,0,0,0.5)]"
                  )}
                  style={{
                    width: (() => {
                      const mode = artifactPreviewModes[artifact.title];
                      if (mode === 'app') return "380px";
                      if (mode === 'web') return "1280px";
                      return artifact.width ? `${artifact.width}px` : (artifact.type === 'app' ? "380px" : "1024px");
                    })(),
                    height: (() => {
                      const heightFallback = dynamicFrameHeights[artifact.title] || (artifact.type === 'app' ? 800 : 700);
                      return artifact.height ? `${artifact.height}px` : `${heightFallback}px`;
                    })(),
                    minHeight: (artifactPreviewModes[artifact.title] === 'app' || (artifact.type === 'app' && !artifactPreviewModes[artifact.title])) ? '800px' : '400px',
                    transition: isResizing ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: appliedTheme?.cssVars.background || 'var(--background)',
                    borderColor: selectedArtifactIndex === index ? SELECTION_BLUE : (appliedTheme?.cssVars.border || 'var(--border)'),
                    boxShadow: selectedArtifactIndex === index ? `0 0 0 2px ${SELECTION_BLUE}40, 0 40px 100px rgba(0,0,0,0.4)` : undefined
                  }}
                >
                  {(!artifact.isComplete && !artifact.content) && <ModernShimmer type={artifact.type} appliedTheme={appliedTheme} />}
                  
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

                {/* Selection Overlays & Handles */}
                {selectedArtifactIndex === index && (
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 80 }}>
                    <div 
                      onMouseDown={(e) => startResizing(e, index, 'top-left')}
                      className="absolute top-0 left-0 w-2 h-2 border border-white pointer-events-auto cursor-nwse-resize -translate-x-1/2 -translate-y-1/2" 
                      style={{ backgroundColor: SELECTION_BLUE }}
                    />
                    <div 
                      onMouseDown={(e) => startResizing(e, index, 'top-right')}
                      className="absolute top-0 right-0 w-2 h-2 border border-white pointer-events-auto cursor-nesw-resize translate-x-1/2 -translate-y-1/2" 
                      style={{ backgroundColor: SELECTION_BLUE }}
                    />
                    <div 
                      onMouseDown={(e) => startResizing(e, index, 'bottom-left')}
                      className="absolute bottom-0 left-0 w-2 h-2 border border-white pointer-events-auto cursor-nesw-resize -translate-x-1/2 translate-y-1/2" 
                      style={{ backgroundColor: SELECTION_BLUE }}
                    />
                    <div 
                      onMouseDown={(e) => startResizing(e, index, 'bottom-right')}
                      className="absolute bottom-0 right-0 w-2 h-2 border border-white pointer-events-auto cursor-nwse-resize translate-x-1/2 translate-y-1/2" 
                      style={{ backgroundColor: SELECTION_BLUE }}
                    />

                    <div 
                      onMouseDown={(e) => startResizing(e, index, 'top')}
                      className="absolute top-0 left-0 right-0 h-2 -translate-y-1/2 pointer-events-auto cursor-ns-resize hover:bg-blue-500/10"
                    />
                    <div 
                      onMouseDown={(e) => startResizing(e, index, 'bottom')}
                      className="absolute bottom-0 left-0 right-0 h-2 translate-y-1/2 pointer-events-auto cursor-ns-resize hover:bg-blue-500/10"
                    />
                    <div 
                      onMouseDown={(e) => startResizing(e, index, 'left')}
                      className="absolute top-0 bottom-0 w-2 -translate-x-1/2 pointer-events-auto cursor-ew-resize hover:bg-blue-500/10"
                    />
                    <div 
                      onMouseDown={(e) => startResizing(e, index, 'right')}
                      className="absolute top-0 bottom-0 w-2 translate-x-1/2 pointer-events-auto cursor-ew-resize hover:bg-blue-500/10"
                    />

                    <div 
                      onMouseDown={(e) => startResizing(e, index, 'top')}
                      className="absolute top-0 left-1/2 w-3 h-1.5 border border-white pointer-events-auto cursor-ns-resize -translate-x-1/2 -translate-y-1/2 rounded-[1px]" 
                      style={{ backgroundColor: SELECTION_BLUE }}
                    />
                    <div 
                      onMouseDown={(e) => startResizing(e, index, 'bottom')}
                      className="absolute bottom-0 left-1/2 w-3 h-1.5 border border-white pointer-events-auto cursor-ns-resize -translate-x-1/2 translate-y-1/2 rounded-[1px]" 
                      style={{ backgroundColor: SELECTION_BLUE }}
                    />
                    <div 
                      onMouseDown={(e) => startResizing(e, index, 'left')}
                      className="absolute left-0 top-1/2 w-1.5 h-3 border border-white pointer-events-auto cursor-ew-resize -translate-x-1/2 -translate-y-1/2 rounded-[1px]" 
                      style={{ backgroundColor: SELECTION_BLUE }}
                    />
                    <div 
                      onMouseDown={(e) => startResizing(e, index, 'right')}
                      className="absolute right-0 top-1/2 w-1.5 h-3 border border-white pointer-events-auto cursor-ew-resize translate-x-1/2 -translate-y-1/2 rounded-[1px]" 
                      style={{ backgroundColor: SELECTION_BLUE }}
                    />
                  </div>
                )}
              </div>
            ))}
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
    </main>
  );
}
