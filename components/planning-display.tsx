"use client";

import React, { useState, useEffect } from "react";
import { Clock, ChevronRight, Boxes, Smartphone, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Screen {
  title: string;
  type: string;
  description: string;
}

interface PlanningDisplayProps {
  plan: { screens: Screen[] };
  isPlanning?: boolean;
  onClick?: () => void;
  className?: string;
}

export function PlanningDisplay({
  plan,
  isPlanning,
  onClick,
  className,
}: PlanningDisplayProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlanning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      setTimeout(() => setSeconds(0), 0);
    }
    return () => clearInterval(interval);
  }, [isPlanning]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isPlanning) {
    return (
      <div
        className={cn(
          "bg-card/40 border-primary/20 relative flex animate-pulse flex-col gap-4 overflow-hidden rounded-[2rem] border p-5",
          className,
        )}
      >
        <div className="from-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-primary/20 absolute inset-0 animate-ping rounded-full blur-md" />
              <div className="bg-primary/10 border-primary/20 relative z-10 flex size-10 items-center justify-center rounded-2xl border">
                <Boxes className="text-primary size-5" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-primary text-[12px] font-black tracking-[0.15em] uppercase">
                Architecting Vision
              </span>
              <span className="text-primary/60 animate-pulse text-[10px] font-black tracking-widest uppercase">
                Computing Manifest...
              </span>
            </div>
          </div>
          <div className="bg-primary/10 border-primary/20 flex items-center gap-1.5 rounded-full border px-3 py-1">
            <Clock className="text-primary size-3" />
            <span className="text-primary font-mono text-[10px] font-bold">
              {formatTime(seconds)}
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-3">
          <div className="bg-primary/10 h-1.5 w-full overflow-hidden rounded-full">
            <motion.div
              className="bg-primary h-full"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </div>
          <p className="text-muted-foreground text-center text-[10px] font-bold tracking-[0.1em] uppercase">
            Developing screen manifests & style inheritance...
          </p>
        </div>
      </div>
    );
  }

  if (!plan || !plan.screens || plan.screens.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "group from-card/80 to-card border-border/50 hover:border-primary/40 hover:shadow-primary/5 relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-[2rem] border bg-gradient-to-br p-5 backdrop-blur-xl transition-all hover:shadow-2xl",
        className,
      )}
    >
      {/* Background Glow */}
      <div className="bg-primary/5 group-hover:bg-primary/10 pointer-events-none absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px] transition-colors" />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 border-primary/20 flex size-10 items-center justify-center rounded-2xl border transition-transform group-hover:scale-110">
            <Boxes className="text-primary size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground/90 text-[12px] font-black tracking-[0.15em] uppercase">
              Project Manifest
            </span>
            <div className="flex items-center gap-2">
              <span className="text-primary text-[10px] font-bold tracking-wider uppercase">
                {plan.screens.length} Screens Defined
              </span>
            </div>
          </div>
        </div>
        <div className="translate-x-1 p-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
          <ChevronRight className="text-primary size-4" />
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-muted-foreground line-clamp-2 text-[13px] leading-relaxed font-medium">
          {plan.screens[0]?.description ||
            "Detailed architecture and screen flow plan for this high-fidelity project."}
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-2 pt-3">
        <div className="flex -space-x-2">
          {plan.screens.slice(0, 3).map((screen, i) => (
            <div
              key={i}
              className="bg-muted border-card flex size-6 items-center justify-center rounded-lg border-2 shadow-sm"
            >
              {screen.type === "web" ? (
                <Monitor className="size-3 text-zinc-500" />
              ) : (
                <Smartphone className="size-3 text-zinc-500" />
              )}
            </div>
          ))}
          {plan.screens.length > 3 && (
            <div className="bg-primary/10 border-card text-primary flex size-6 items-center justify-center rounded-lg border-2 text-[8px] font-black">
              +{plan.screens.length - 3}
            </div>
          )}
        </div>
        <span className="text-muted-foreground pl-1 text-[10px] font-bold tracking-widest uppercase">
          Review Architecture
        </span>
      </div>
    </motion.div>
  );
}
