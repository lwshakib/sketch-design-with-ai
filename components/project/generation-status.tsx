"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MessageResponse } from "@/components/ai-elements/message";
import { useProjectStore } from "@/hooks/use-project-store";
import { Maximize2, EyeOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DUMMY_STATUSES = [
  "Setting up workspace",
  "Bringing your vision to life",
  "Choosing typography",
  "Adjusting spacing",
  "Rendering the view",
  "Iterating on your design",
  "Imagining",
  "Refining color palettes",
  "Balancing layout structures",
  "Polishing interface details",
  "Crafting user experiences",
  "Finalizing design manifest",
  "Calibrating visual rhythm",
  "Optimizing for all screens",
  "Synthesizing design tokens"
];

interface GenerationStatusProps {
  status?: string;
  isComplete?: boolean;
  conclusionText?: string;
  planScreens?: any[];
  projectArtifacts?: any[];
  currentScreenTitle?: string;
  statusMessage?: string;
  className?: string;
}

export function GenerationStatus({ 
  status, 
  isComplete, 
  conclusionText,
  planScreens = [],
  projectArtifacts = [],
  currentScreenTitle,
  statusMessage,
  className 
}: GenerationStatusProps) {
  const [dummyStatus, setDummyStatus] = useState(DUMMY_STATUSES[0]);
  const [dots, setDots] = useState("...");
  
  const { 
    focusArtifact
  } = useProjectStore();

  useEffect(() => {
    if (isComplete) return;

    const statusInterval = setInterval(() => {
      setDummyStatus(prev => {
        const currentIndex = DUMMY_STATUSES.indexOf(prev);
        const nextIndex = (currentIndex + 1) % DUMMY_STATUSES.length;
        return DUMMY_STATUSES[nextIndex];
      });
    }, 4500);

    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 6) return "...";
        return prev + ".";
      });
    }, 800);

    return () => {
      clearInterval(statusInterval);
      clearInterval(dotsInterval);
    };
  }, [isComplete]);

  const handleFocusScreen = (artifactTitle: string) => {
    focusArtifact(artifactTitle);
  };

  const finalConclusionText = conclusionText || (status === 'complete' ? statusMessage : null);

  const displayedPlanScreens = planScreens.length > 0 ? planScreens : (!isComplete ? [{ id: 'placeholder-pulse', title: 'Loading' }] : []);

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* First Row: Skeleton Squares with Previews */}
      <div className="flex flex-wrap gap-4">
        {displayedPlanScreens.map((planItem, idx) => {
          // Find the artifact that matches this plan item
          let artifact = null;
          if (planItem.id) {
            artifact = projectArtifacts.find(a => a.id === planItem.id);
          }
          // Fallback to title if no ID match or planItem has no ID, but only if the artifact itself doesn't have an ID yet
          if (!artifact && planItem.title) {
            artifact = projectArtifacts.find(a => a.title === planItem.title && !a.id);
          }
          // If still no artifact, try matching by title regardless of artifact ID (for existing artifacts)
          if (!artifact && planItem.title) {
            artifact = projectArtifacts.find(a => a.title === planItem.title);
          }

          const hasContent = !!artifact?.content;
          const isPlaceholder = planItem.id === 'placeholder-pulse';
          // A screen is considered not available if we are complete but the matching artifact is missing from the global state
          const isNotAvailable = isComplete && !isPlaceholder && !artifact;

          return (
            <TooltipProvider key={idx}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => {
                      if (hasContent) handleFocusScreen(artifact!.title);
                    }}
                    className={cn(
                      "h-16 w-16 rounded-lg bg-zinc-900 border border-white/5 overflow-hidden relative shrink-0 shadow-lg group transition-all",
                      hasContent ? "cursor-pointer hover:border-primary/50 hover:shadow-primary/10" : "cursor-default",
                      isPlaceholder && "animate-pulse",
                      isNotAvailable && "opacity-40 grayscale"
                    )}
                  >
                    {/* Preview Content (scaled iframe) */}
                    {hasContent ? (
                      <>
                        <div className="absolute inset-0 scale-[calc(64/1024)] origin-top-left w-[1024px] h-[2000px] pointer-events-none opacity-80 group-hover:opacity-40 transition-all translate-z-0">
                          <iframe
                            title={`mini-preview-${idx}`}
                            className="w-full h-full border-none"
                            srcDoc={`
                                 <!DOCTYPE html>
                                 <html>
                                   <head>
                                     <script src="https://cdn.tailwindcss.com"></script>
                                     <style>
                                       body { margin: 0; padding: 0; overflow: hidden; background: transparent; height: auto; }
                                       ::-webkit-scrollbar { display: none; }
                                     </style>
                                   </head>
                                   <body>${artifact?.content}</body>
                                 </html>
                               `}
                          />
                        </div>
                        {/* Hover Overlay Icon */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5">
                          <Maximize2 className="h-4 w-4 text-primary" />
                        </div>
                      </>
                    ) : isNotAvailable ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-zinc-900/50">
                        <EyeOff className="size-4 text-muted-foreground/30" />
                        <span className="text-[7px] font-bold text-muted-foreground/30 uppercase tracking-tighter text-center px-1">Not Available</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite_linear]" />
                    )}
                  </div>
                </TooltipTrigger>
                { (hasContent || isNotAvailable) && (
                  <TooltipContent side="bottom" className={cn("text-[10px] py-1 px-2 border-primary/20 bg-zinc-950 text-foreground font-medium", isNotAvailable && "border-white/10 text-muted-foreground/60")}>
                    {isNotAvailable ? "Screen not available" : "Go to screen"}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      <div className="flex-1 min-w-0">
        {isComplete && finalConclusionText ? (
          <div className="animate-in fade-in slide-in-from-top-2 duration-1000">
            <MessageResponse className="text-foreground/90 text-[13px] leading-relaxed">
              {finalConclusionText}
            </MessageResponse>
          </div>
        ) : !isComplete ? (
          <p className="text-sm font-medium text-muted-foreground animate-pulse transition-all duration-500">
            {`${dummyStatus}${dots}`}
          </p>
        ) : null}
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
