"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#050505] font-sans text-white">
      {/* Background Decorative Elements */}
      <div className="bg-primary/20 pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[120px]" />
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_center,transparent_0%,#050505_70%)]" />

      {/* Animated Shapes */}
      <div className="absolute top-[20%] right-[15%] h-32 w-32 animate-pulse rounded-full bg-indigo-500/10 blur-2xl" />
      <div className="absolute bottom-[20%] left-[10%] h-48 w-48 animate-bounce rounded-full bg-purple-500/10 blur-3xl duration-[5000ms]" />

      <div className="relative z-10 flex max-w-lg flex-col items-center px-4 text-center">
        <div className="group relative mb-8">
          <div className="bg-primary/30 group-hover:bg-primary/50 absolute inset-0 scale-75 rounded-full blur-2xl transition-all duration-500 group-hover:scale-110" />
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#0F0F0F] shadow-2xl backdrop-blur-xl">
            <div className="from-primary/10 absolute inset-0 bg-gradient-to-br to-transparent" />
            <LogoIcon className="text-primary h-12 w-12" />
          </div>
        </div>

        <h1 className="mb-4 text-8xl font-black tracking-tighter select-none">
          <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            404
          </span>
        </h1>

        <h2 className="mb-4 text-2xl font-bold tracking-tight text-white/90">
          Page not found
        </h2>

        <p className="mb-10 max-w-[320px] text-sm leading-relaxed text-zinc-500">
          The screen you&apos;re looking for was either moved or never existed.
          Let&apos;s get you back on track.
        </p>

        <div className="flex w-full flex-col justify-center gap-4 sm:flex-row">
          <Button
            asChild
            variant="outline"
            className="group h-12 rounded-full border-white/5 bg-white/5 px-8 text-white transition-all duration-300 hover:bg-white/10"
          >
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Go Back
            </Link>
          </Button>

          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground group h-12 rounded-full px-8 shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(var(--primary),0.5)]"
          >
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4 transition-transform group-hover:scale-110" />
              Return Home
            </Link>
          </Button>
        </div>

        {/* Subtle Footer Suggestion */}
        <div className="mt-16 flex items-center gap-2 text-zinc-600">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            Sketch AI Design System
          </span>
        </div>
      </div>

      {/* Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: `40px 40px`,
        }}
      />
    </div>
  );
}
