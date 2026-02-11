"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-white relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#050505_70%)] pointer-events-none" />
      
      {/* Animated Shapes */}
      <div className="absolute top-[20%] right-[15%] w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full animate-pulse" />
      <div className="absolute bottom-[20%] left-[10%] w-48 h-48 bg-purple-500/10 blur-3xl rounded-full animate-bounce duration-[5000ms]" />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg">
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full group-hover:bg-primary/50 transition-all duration-500 scale-75 group-hover:scale-110" />
          <div className="relative h-24 w-24 rounded-3xl bg-[#0F0F0F] border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden backdrop-blur-xl">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
             <LogoIcon className="h-12 w-12 text-primary" />
          </div>
        </div>

        <h1 className="text-8xl font-black tracking-tighter mb-4 select-none">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">404</span>
        </h1>
        
        <h2 className="text-2xl font-bold tracking-tight mb-4 text-white/90">
          Page not found
        </h2>
        
        <p className="text-zinc-500 text-sm leading-relaxed mb-10 max-w-[320px]">
          The screen you're looking for was either moved or never existed. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button 
            asChild
            variant="outline"
            className="h-12 px-8 rounded-full border-white/5 bg-white/5 hover:bg-white/10 text-white transition-all duration-300 group"
          >
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Link>
          </Button>

          <Button 
            asChild
            className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all duration-300 group"
          >
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Return Home
            </Link>
          </Button>
        </div>

        {/* Subtle Footer Suggestion */}
        <div className="mt-16 flex items-center gap-2 text-zinc-600">
           <Sparkles className="w-3.5 h-3.5" />
           <span className="text-[10px] font-bold uppercase tracking-widest">Sketch AI Design System</span>
        </div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: `40px 40px`,
        }}
      />
    </div>
  );
}
