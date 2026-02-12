"use client";

import React, { useState, useEffect } from "react";
import { type Artifact } from "@/lib/artifact-renderer";
import { cn } from "@/lib/utils";
import { 
  Smartphone,
  Tablet,
  Monitor,
  LayoutGrid,
  ExternalLink,
  QrCode,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Hand,
  MousePointer2,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArtifactFrame } from "@/components/project/canvas/artifact-frame";
import { Logo } from "@/components/logo";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ProjectShareViewProps {
  project: {
    title: string;
    shareToken: string;
    themes?: any[];
    appliedTheme?: any;
  };
  artifacts: Artifact[];
}

export function ProjectShareView({ project, artifacts }: ProjectShareViewProps) {
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [appliedTheme] = useState<any>(project.appliedTheme || project.themes?.[0] || null);
  const [dynamicHeights, setDynamicHeights] = useState<Record<string, number>>({});
  
  // Canvas State
  const [zoom, setZoom] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<'select' | 'hand'>('select');
  const [isPanning, setIsPanning] = useState(false);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);

  const previewRef = React.useRef<HTMLDivElement>(null);
  const dragStart = React.useRef({ x: 0, y: 0 });
  const zoomRef = React.useRef(zoom);
  const canvasOffsetRef = React.useRef(canvasOffset);

  // Calculate centering offset so the first artifact is centered at (0,0)
  const firstArtifact = artifacts[0];
  const firstWidth = firstArtifact ? (firstArtifact.width || (firstArtifact.type === 'app' ? 380 : 1280)) : 0;
  const centeringOffset = firstArtifact ? -(firstArtifact.x || 0) - (firstWidth / 2) : 0;

  useEffect(() => {
    zoomRef.current = zoom;
    canvasOffsetRef.current = canvasOffset;
  }, [zoom, canvasOffset]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'HEIGHT_UPDATE' && typeof event.data.height === 'number') {
        const sourceWindow = event.source as Window;
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          if (iframe.contentWindow === sourceWindow) {
            const artifactTitle = (iframe as any).dataset.artifactTitle;
            if (artifactTitle) {
              setDynamicHeights(prev => {
                const currentHeight = prev[artifactTitle] || 0;
                if (Math.abs(currentHeight - event.data.height) < 10) return prev;
                return {
                  ...prev,
                  [artifactTitle]: event.data.height
                };
              });
            }
          }
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Zoom and Pan Handlers
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
  };

  useEffect(() => {
    const element = previewRef.current;
    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const scaleFactor = Math.pow(1.2, -e.deltaY / 120);
        const rect = element.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        handleZoom(zoomRef.current * scaleFactor, mx, my);
      } else {
        setCanvasOffset(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && activeTool !== 'hand') setActiveTool('hand');
      if (e.key.toLowerCase() === 'v') setActiveTool('select');
      if (e.key.toLowerCase() === 'h') setActiveTool('hand');
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') setActiveTool('select');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTool]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'hand' || e.button === 1) {
      setIsPanning(true);
      dragStart.current = { x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const getWidth = (type: string) => {
    return type === 'app' ? 380 : 1280;
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-zinc-950 text-white font-sans">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Logo showBadge={false} textSize="1.2rem" iconSize={28} className="text-white" />
          <div className="h-4 w-[1px] bg-zinc-800" />
          <h1 className="text-lg font-bold text-white truncate max-w-[400px] tracking-tight">
            {project.title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
           <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-zinc-400 hover:text-white"
              onClick={() => setShowQrDialog(true)}
              title="Show QR Code"
            >
              <QrCode className="h-4 w-4" />
            </Button>
            <Button 
                onClick={handleCopyLink}
                className="bg-zinc-100 text-black hover:bg-white rounded-full px-6 h-9 text-xs font-semibold gap-2 transition-all shadow-lg"
            >
                {hasCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
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
          if (e.target === e.currentTarget) setSelectedArtifactId(null);
        }}
        className={cn(
          "flex-1 relative bg-[#09090b] overflow-hidden select-none",
          activeTool === 'hand' ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
        )}
      >
        {/* Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundAttachment: 'fixed',
            transform: `translate(${canvasOffset.x % (20 * zoom)}px, ${canvasOffset.y % (20 * zoom)}px)`
          }}
        />

        <div 
          className={cn(
            "absolute inset-0 flex items-start justify-center pt-36",
            !isPanning && "transition-transform duration-75 ease-out"
          )}
        >
          <div 
            className="relative"
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom * 0.5})`,
              transformOrigin: '0 0'
            }}
          >
            {artifacts.map((artifact, index) => (
                <div 
                  key={artifact.id || index} 
                  className="absolute top-0 left-0 group"
                  style={{
                    transform: `translate(${(artifact.x || 0) + centeringOffset}px, ${artifact.y || 0}px)`,
                  }}
                  onMouseDown={(e) => {
                    if (activeTool === 'select') {
                      e.stopPropagation();
                      setSelectedArtifactId(artifact.id || null);
                    }
                  }}
                >
                    <div 
                        className={cn(
                          "relative transition-all duration-300 ease-out shadow-[0_40px_100px_rgba(0,0,0,0.4)] border flex flex-col group overflow-hidden",
                          selectedArtifactId === artifact.id && "ring-2 ring-blue-500 ring-offset-4 ring-offset-zinc-950 shadow-[0_60px_120px_rgba(0,0,0,0.6)]"
                        )}
                        style={{ 
                            width: getWidth(artifact.type),
                            height: dynamicHeights[artifact.title] || 800,
                            borderColor: appliedTheme?.cssVars?.border || '#27272a',
                            borderRadius: 12,
                            backgroundColor: appliedTheme?.cssVars?.background || '#09090b',
                        }}
                    >
                        <ArtifactFrame
                            artifact={{...artifact, width: getWidth(artifact.type), height: undefined}}
                            index={index}
                            isEditMode={false}
                            activeTool={activeTool}
                            isDraggingFrame={false}
                            appliedTheme={appliedTheme}
                            onRef={(idx, el) => {
                                if (el) (el as any).dataset.artifactTitle = artifact.title;
                            }}
                        />
                    </div>
                </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-4">
        <div className="flex items-center gap-1 p-1 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveTool('select')}
            className={cn(
              "h-10 w-10 rounded-xl transition-all",
              activeTool === 'select' 
                ? "bg-white/10 text-white shadow-inner" 
                : "text-zinc-500 hover:text-white hover:bg-transparent"
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
                ? "bg-white/10 text-white shadow-inner" 
                : "text-zinc-500 hover:text-white hover:bg-transparent"
            )}
            title="Hand (H / Space)"
          >
            <Hand className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Right Controls */}
      <div className="absolute bottom-6 right-6 z-50 flex items-center gap-1 p-1 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl pointer-events-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))}
          className="h-10 w-10 rounded-xl text-zinc-500 hover:text-white hover:bg-transparent transition-all"
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
          onClick={() => setZoom(prev => Math.min(5, prev + 0.1))}
          className="h-10 w-10 rounded-xl text-zinc-500 hover:text-white hover:bg-transparent transition-all"
          title="Zoom In"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setZoom(1);
            setCanvasOffset({ x: 0, y: 0 });
          }}
          className="h-10 w-10 rounded-xl text-zinc-500 hover:text-white hover:bg-transparent transition-all"
          title="Reset View"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-sm p-0 overflow-hidden">
          <div className="flex flex-col items-center justify-center p-8 gap-8">
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Scan for mobile</h2>
              <p className="text-xs text-zinc-500">Open this preview on your device</p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-2xl">
               <QRCodeSVG value={typeof window !== 'undefined' ? window.location.href : ''} size={180} />
            </div>
            
            <div className="flex flex-col gap-3 w-full">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-[11px] text-zinc-400 font-mono break-all leading-relaxed">
                {typeof window !== 'undefined' ? window.location.href : ''}
              </div>
              <Button 
                variant="outline" 
                onClick={handleCopyLink}
                className="w-full border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-white rounded-xl h-11 text-xs font-medium gap-2"
              >
                {hasCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {hasCopied ? "Copied" : "Copy Link"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
