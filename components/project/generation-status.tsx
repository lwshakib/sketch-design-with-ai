"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MessageResponse } from "@/components/ai-elements/message";
import { useProjectStore } from "@/hooks/use-project-store";
import { Maximize2, EyeOff, AlertCircle } from "lucide-react";
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
  "Synthesizing design tokens",
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
  error?: string;
  isCreditError?: boolean;
}

export function GenerationStatus({
  status,
  isComplete,
  conclusionText,
  planScreens = [],
  projectArtifacts = [],
  currentScreenTitle,
  statusMessage,
  className,
  error,
  isCreditError,
}: GenerationStatusProps) {
  const [dummyStatus, setDummyStatus] = useState(DUMMY_STATUSES[0]);
  const [dots, setDots] = useState("...");

  const { focusArtifact } = useProjectStore();

  useEffect(() => {
    if (isComplete) return;

    const statusInterval = setInterval(() => {
      setDummyStatus((prev) => {
        const currentIndex = DUMMY_STATUSES.indexOf(prev);
        const nextIndex = (currentIndex + 1) % DUMMY_STATUSES.length;
        return DUMMY_STATUSES[nextIndex];
      });
    }, 4500);

    const dotsInterval = setInterval(() => {
      setDots((prev) => {
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

  const finalConclusionText =
    conclusionText || (status === "complete" ? statusMessage : null);

  const displayedPlanScreens =
    planScreens.length > 0
      ? planScreens
      : !isComplete
        ? [{ id: "placeholder-pulse", title: "Loading" }]
        : [];

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* First Row: Skeleton Squares with Previews */}
      <div className="flex flex-wrap gap-4">
        {displayedPlanScreens.map((planItem, idx) => {
          // Find the artifact that matches this plan item
          let artifact = null;
          if (planItem.id) {
            artifact = projectArtifacts.find((a) => a.id === planItem.id);
          }
          // Fallback to title if no ID match or planItem has no ID, but only if the artifact itself doesn't have an ID yet
          if (!artifact && planItem.title) {
            artifact = projectArtifacts.find(
              (a) => a.title === planItem.title && !a.id,
            );
          }
          // If still no artifact, try matching by title regardless of artifact ID (for existing artifacts)
          if (!artifact && planItem.title) {
            artifact = projectArtifacts.find((a) => a.title === planItem.title);
          }

          const hasContent = !!artifact?.content;
          const isPlaceholder = planItem.id === "placeholder-pulse";
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
                      "bg-muted/50 border-border group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border shadow-sm transition-all",
                      hasContent
                        ? "hover:border-primary/50 hover:bg-muted cursor-pointer hover:shadow-md"
                        : "cursor-default",
                      isPlaceholder && "animate-pulse",
                      isNotAvailable && "opacity-40 grayscale",
                    )}
                  >
                    {/* Preview Content (scaled iframe) */}
                    {hasContent ? (
                      <>
                        <div className="pointer-events-none absolute inset-0 h-[2000px] w-[1024px] origin-top-left translate-z-0 scale-[calc(64/1024)] opacity-90 transition-all group-hover:opacity-40">
                          <iframe
                            title={`mini-preview-${idx}`}
                            className="h-full w-full border-none"
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
                        <div className="bg-primary/10 absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                          <Maximize2 className="text-primary h-4 w-4" />
                        </div>
                      </>
                    ) : isNotAvailable ? (
                      <div className="bg-muted/30 absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                        <EyeOff className="text-muted-foreground/30 size-4" />
                        <span className="text-muted-foreground/30 px-1 text-center text-[7px] font-bold tracking-tighter uppercase">
                          Not Available
                        </span>
                      </div>
                    ) : (
                      <div className="via-primary/5 absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_linear] bg-gradient-to-r from-transparent to-transparent" />
                    )}
                  </div>
                </TooltipTrigger>
                {(hasContent || isNotAvailable) && (
                  <TooltipContent
                    side="top"
                    className={cn(
                      "border-border bg-popover text-popover-foreground animate-in zoom-in-95 rounded-lg border px-3 py-1.5 text-[11px] font-bold shadow-xl duration-200",
                      isNotAvailable && "opacity-80",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isNotAvailable ? (
                        <>
                          <EyeOff className="text-muted-foreground size-3" />
                          <span>Screen not available</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="text-primary size-3" />
                          <span>View full screen</span>
                        </>
                      )}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      <div className="min-w-0 flex-1">
        {error ? (
          <div className="border-destructive/20 bg-destructive/5 animate-in fade-in slide-in-from-top-2 flex flex-col gap-3 rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-destructive mt-0.5 size-5 shrink-0" />
              <div className="flex flex-col gap-1">
                <p className="text-destructive text-sm font-semibold">
                  {isCreditError ? "Credits Exhausted" : "Generation Error"}
                </p>
                <p className="text-destructive/80 text-[13px] leading-relaxed">
                  {error}
                </p>
              </div>
            </div>

            {isCreditError && (
              <div className="mt-1 flex flex-col gap-2">
                <button
                  onClick={() =>
                    window.open("https://sketch.com/pricing", "_blank")
                  }
                  className="bg-destructive hover:bg-destructive/90 shadow-destructive/20 w-full rounded-lg px-4 py-2 text-xs font-bold tracking-widest text-white uppercase shadow-lg transition-all"
                >
                  Upgrade to Pro
                </button>
                <p className="text-destructive/60 text-center text-[10px] italic">
                  Generate unlimited screens with a Pro subscription
                </p>
              </div>
            )}
          </div>
        ) : isComplete && finalConclusionText ? (
          <div className="animate-in fade-in slide-in-from-top-2 duration-1000">
            <MessageResponse className="text-foreground/90 text-[13px] leading-relaxed">
              {finalConclusionText}
            </MessageResponse>
          </div>
        ) : !isComplete ? (
          <p className="text-muted-foreground animate-pulse text-sm font-medium transition-all duration-500">
            {`${dummyStatus}${dots}`}
          </p>
        ) : null}
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
