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
  className?: string;
}

export function GenerationStatus({ 
  status, 
  isComplete, 
  conclusionText,
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
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Second Row: Small square skeleton UI */}
      <div className="h-20 w-20 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden relative shrink-0">
        {!isComplete && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite_linear]" />
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
