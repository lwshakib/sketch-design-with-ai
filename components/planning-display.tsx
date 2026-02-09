"use client";

import React, { useState, useEffect } from "react";
import { 
  Layout, 
  CheckCircle2, 
  Circle, 
  Clock, 
  ChevronRight,
  ExternalLink,
  Boxes,
  Smartphone,
  Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

export function PlanningDisplay({ plan, isPlanning, onClick, className }: PlanningDisplayProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlanning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isPlanning]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isPlanning) {
    return (
      <div className={cn("flex flex-col gap-4 p-5 bg-card/40 border border-primary/20 rounded-[2rem] animate-pulse relative overflow-hidden", className)}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-ping" />
              <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center relative z-10">
                <Boxes className="size-5 text-primary" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-black uppercase tracking-[0.15em] text-primary">Architecting Vision</span>
              <span className="text-[10px] text-primary/60 font-black uppercase tracking-widest animate-pulse">Computing Manifest...</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <Clock className="size-3 text-primary" />
            <span className="text-[10px] font-mono font-bold text-primary">{formatTime(seconds)}</span>
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <div className="h-1.5 bg-primary/10 rounded-full w-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em] text-center">Developing screen manifests & style inheritance...</p>
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
        "group relative flex flex-col gap-4 p-5 bg-gradient-to-br from-card/80 to-card border border-border/50 rounded-[2rem] hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden backdrop-blur-xl",
        className
      )}
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-primary/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors" />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Boxes className="size-5 text-primary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-black uppercase tracking-[0.15em] text-foreground/90">Project Manifest</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{plan.screens.length} Screens Defined</span>
            </div>
          </div>
        </div>
        <div className="p-2 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
          <ChevronRight className="size-4 text-primary" />
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed font-medium">
          {plan.screens[0]?.description || "Detailed architecture and screen flow plan for this high-fidelity project."}
        </p>
      </div>

      <div className="relative z-10 pt-3 flex items-center gap-2">
        <div className="flex -space-x-2">
          {plan.screens.slice(0, 3).map((screen, i) => (
            <div key={i} className="size-6 rounded-lg bg-muted border-2 border-card flex items-center justify-center shadow-sm">
                {screen.type === 'web' ? <Monitor className="size-3 text-zinc-500" /> : <Smartphone className="size-3 text-zinc-500" />}
            </div>
          ))}
          {plan.screens.length > 3 && (
            <div className="size-6 rounded-lg bg-primary/10 border-2 border-card flex items-center justify-center text-[8px] font-black text-primary">
                +{plan.screens.length - 3}
            </div>
          )}
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Review Architecture</span>
      </div>
    </motion.div>
  );
}
