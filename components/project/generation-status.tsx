"use client";

import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
  className?: string;
}

export function GenerationStatus({ 
  status, 
  isComplete, 
  conclusionText,
  planScreens = [],
  projectArtifacts = [],
  currentScreenTitle,
  className 
}: GenerationStatusProps) {
  const [dummyStatus, setDummyStatus] = useState(DUMMY_STATUSES[0]);
  const [dots, setDots] = useState("...");

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

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Second Row: Skeleton Squares with Previews */}
      <div className="flex flex-wrap gap-4">
        {planScreens.map((screen, idx) => {
          const artifact = projectArtifacts.find(a => a.title === screen.title);
          const isCurrentlyGenerating = currentScreenTitle === screen.title;
          const hasContent = !!artifact?.content;

          return (
            <div 
              key={idx}
              className="h-16 w-16 rounded-lg bg-zinc-900 border border-white/5 overflow-hidden relative shrink-0 shadow-lg group"
            >
              {/* Preview Content (scaled iframe) */}
              {hasContent ? (
                <div className="absolute inset-0 scale-[calc(64/1024)] origin-top-left w-[1024px] h-[2000px] pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity translate-z-0">
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
                         <body>${artifact.content}</body>
                       </html>
                     `}
                   />
                </div>
              ) : isCurrentlyGenerating ? (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite_linear]" />
              ) : (
                <div className="absolute inset-0 bg-white/[0.02]" />
              )}
            </div>
          );
        })}
        
        {planScreens.length === 0 && (
           <div className="h-16 w-16 rounded-lg bg-zinc-900 border border-white/5 overflow-hidden relative shrink-0 shadow-lg animate-pulse" />
        )}
      </div>

      {/* Third Row: Status text with animated dots */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium transition-all duration-500",
          isComplete ? "text-foreground" : "text-muted-foreground animate-pulse"
        )}>
          {isComplete 
            ? (conclusionText || "") 
            : `${dummyStatus}${dots}`
          }
        </p>
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
