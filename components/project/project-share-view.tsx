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
  Check
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
  };
  artifacts: Artifact[];
}

export function ProjectShareView({ project, artifacts }: ProjectShareViewProps) {
  const [viewportMode, setViewportMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [appliedTheme] = useState<any>(project.themes?.[0] || null);
  const [dynamicHeights, setDynamicHeights] = useState<Record<string, number>>({});

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
                // Avoid small fluctuations to prevent jitter and loops
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

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const getWidth = (type: string) => {
    if (viewportMode === 'mobile') return 380;
    if (viewportMode === 'tablet') return 768;
    return type === 'app' ? 380 : 1280;
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-zinc-950 text-white overflow-x-hidden font-sans">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Logo showBadge={false} textSize="1.2rem" iconSize={28} className="text-white" />
          <div className="h-4 w-[1px] bg-zinc-800" />
          <h1 className="text-sm font-medium text-zinc-400 truncate max-w-[200px]">
            {project.title}
          </h1>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
           <Button
             variant={viewportMode === 'mobile' ? "secondary" : "ghost"}
             size="icon"
             className="h-9 w-9 rounded-lg"
             onClick={() => setViewportMode('mobile')}
             title="Mobile View"
           >
             <Smartphone className="h-4 w-4" />
           </Button>
           <Button
             variant={viewportMode === 'tablet' ? "secondary" : "ghost"}
             size="icon"
             className="h-9 w-9 rounded-lg"
             onClick={() => setViewportMode('tablet')}
             title="Tablet View"
           >
             <Tablet className="h-4 w-4" />
           </Button>
           <Button
             variant={viewportMode === 'desktop' ? "secondary" : "ghost"}
             size="icon"
             className="h-9 w-9 rounded-lg"
             onClick={() => setViewportMode('desktop')}
             title="Desktop View"
           >
             <Monitor className="h-4 w-4" />
           </Button>
           <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
           <Button
             variant="ghost"
             size="icon"
             className="h-9 w-9 rounded-lg text-zinc-400 hover:text-white"
             onClick={() => window.open(window.location.href, '_blank')}
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

         <div className="flex items-center gap-3 w-[200px] justify-end">
            <Button 
                onClick={handleCopyLink}
                className="bg-white text-black hover:bg-zinc-200 rounded-full px-4 h-9 text-xs font-semibold gap-2"
            >
                {hasCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {hasCopied ? "Copied" : "Copy Link"}
            </Button>
         </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative bg-[#09090b] p-8 md:p-12 lg:p-16">
        {/* Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
            backgroundSize: `20px 20px`
          }}
        />

        <div className="max-w-[1600px] mx-auto flex flex-col gap-24 items-center">
            {artifacts.map((artifact, index) => (
                <div key={artifact.id || index} className="flex flex-col gap-6 w-full items-center">
                    <div className="flex flex-col items-center gap-2">
                        <h2 className="text-2xl font-bold tracking-tight">{artifact.title}</h2>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            {artifact.type} screen
                        </div>
                    </div>
                    
                    <div 
                        className="relative transition-all duration-500 ease-in-out shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex flex-col"
                        style={{ 
                            width: getWidth(artifact.type),
                            height: dynamicHeights[artifact.title] || (artifact.type === 'app' || viewportMode === 'mobile' ? 800 : 800),
                            maxHeight: 'none',
                            maxWidth: '100%',
                            border: `1px solid ${appliedTheme?.cssVars?.border || '#27272a'}`,
                            borderRadius: 12,
                            overflow: 'hidden',
                            backgroundColor: appliedTheme?.cssVars?.background || '#09090b',
                        }}
                    >
                        <ArtifactFrame
                            artifact={{...artifact, width: getWidth(artifact.type), height: undefined}}
                            index={index}
                            isEditMode={false}
                            activeTool="select"
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
      </main>

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
