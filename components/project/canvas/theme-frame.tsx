import React from "react";
import { type Artifact } from "@/lib/types";
import { 
  Search, 
  Home, 
  User, 
  Settings, 
  Plus, 
  ArrowRight, 
  PenBox,
  Tag,
  Trash2,
  Box
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeFrameProps {
  artifact: Artifact;
  onRef?: (el: HTMLIFrameElement | null) => void;
}

/**
 * Helper to generate 10 steps of color shades based on a hex code.
 * We'll use CSS HSL manipulation for simplicity and high fidelity.
 */
function ColorRamp({ color, label, hex }: { color: string; label: string; hex: string }) {
  return (
    <div className="bg-[#111] border border-white/5 p-4 rounded-3xl flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-mono text-zinc-400 uppercase">{hex}</span>
      </div>
      
      <div 
        className="w-full h-24 rounded-2xl shadow-inner" 
        style={{ backgroundColor: hex }}
      />
      
      <div className="grid grid-cols-10 gap-1.5 h-6">
        {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((opacity) => (
          <div 
            key={opacity}
            className="rounded-md h-full w-full"
            style={{ backgroundColor: hex, opacity: opacity / 100 }}
          />
        ))}
      </div>
    </div>
  );
}

export function ThemeFrame({ artifact }: ThemeFrameProps) {
  const variables = artifact.variables || {};
  const colors = variables.colors || {
    primary: "#6366f1",
    secondary: "#ec4899",
    tertiary: "#14b8a6",
    neutral: "#94a3b8",
    background: "#080808",
    foreground: "#ffffff"
  };
  const typography = variables.typography || {
    headline: "Inter",
    body: "Inter",
    label: "Inter"
  };
  const brandName = variables.brandName || artifact.title || "Design System";

  return (
    <div 
      className="w-full h-full flex flex-col font-sans select-none overflow-hidden relative"
      style={{
         backgroundColor: colors.background,
         color: colors.foreground
      }}
    >
      {/* Dot Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Header */}
      <div className="relative z-10 p-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 shadow-sm">
           <div className="w-4 h-4 rounded-full border-2 border-current opacity-80" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">{brandName}</h1>
      </div>

      {/* Bento Grid */}
      <div className="flex-1 px-8 pb-8 grid grid-cols-4 gap-4 overflow-hidden">
        
        {/* Column 1: Palette */}
        <div className="space-y-4 overflow-y-auto hide-scrollbar">
           <ColorRamp color="primary" label="Primary" hex={colors.primary} />
           <ColorRamp color="secondary" label="Secondary" hex={colors.secondary} />
           <ColorRamp color="tertiary" label="Tertiary" hex={colors.tertiary} />
           <ColorRamp color="neutral" label="Neutral" hex={colors.neutral} />
        </div>

        {/* Column 2: Typography & Structure */}
        <div className="space-y-4">
           {/* Headline Card */}
           <div className="bg-[#111] border border-white/5 p-6 rounded-3xl flex flex-col justify-between h-[30%]">
              <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Headline</span>
                  <span className="text-[10px] text-zinc-400">{typography.headline}</span>
              </div>
              <div className="text-8xl font-black text-center py-4" style={{ fontFamily: typography.headline }}>Aa</div>
           </div>

           {/* Body Text Card */}
           <div className="bg-[#111] border border-white/5 p-6 rounded-3xl flex flex-col justify-between h-[30%]">
              <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Body</span>
                  <span className="text-[10px] text-zinc-400">{typography.body}</span>
              </div>
              <div className="text-7xl font-normal text-center py-4 opacity-80" style={{ fontFamily: typography.body }}>Aa</div>
           </div>

           {/* Label Card */}
           <div className="bg-[#111] border border-white/5 p-6 rounded-3xl flex flex-col justify-between h-[30%]">
              <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Label</span>
                  <span className="text-[10px] text-zinc-400">{typography.label}</span>
              </div>
              <div className="text-6xl font-medium text-center py-4 opacity-60" style={{ fontFamily: typography.label }}>Aa</div>
           </div>
        </div>

        {/* Column 3: Components & UI Details */}
        <div className="space-y-4">
           {/* Buttons Component */}
           <div className="bg-[#111] border border-white/5 p-6 rounded-3xl flex flex-wrap gap-3 items-center justify-center min-h-[140px]">
              <div className="px-5 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: colors.primary, color: colors.background }}>Primary</div>
              <div className="px-5 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/60">Secondary</div>
              <div className="px-5 py-2 rounded-xl text-xs font-bold bg-white text-black">Inverted</div>
              <div className="px-5 py-2 rounded-xl text-xs font-bold border border-white/20 text-white/40">Outlined</div>
           </div>

           {/* Skeleton Content */}
           <div className="bg-[#111] border border-white/5 p-8 rounded-3xl space-y-3">
              <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: colors.primary, opacity: 0.6 }} />
              <div className="h-1.5 w-[85%] rounded-full" style={{ backgroundColor: colors.primary, opacity: 0.4 }} />
              <div className="h-1.5 w-[70%] rounded-full" style={{ backgroundColor: colors.secondary, opacity: 0.3 }} />
           </div>

           <div className="grid grid-cols-2 gap-4 h-[200px]">
              <div className="bg-[#111] border border-white/5 rounded-3xl flex items-center justify-center">
                 <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${colors.tertiary}20`, color: colors.tertiary }}>
                    <PenBox size={18} />
                 </div>
              </div>
              <div className="bg-[#111] border border-white/5 rounded-3xl flex items-center justify-center">
                 <div className="px-4 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2" style={{ backgroundColor: colors.primary, color: colors.background }}>
                    <Plus size={12} /> Label
                 </div>
              </div>
           </div>
        </div>

        {/* Column 4: Architecture */}
        <div className="space-y-4">
           {/* Search Architecture */}
           <div className="bg-[#111] border border-white/5 p-6 rounded-3xl">
              <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3">
                 <Search size={14} className="text-zinc-500" />
                 <span className="text-xs text-zinc-600 font-medium">Search</span>
              </div>
           </div>

           {/* Navigation Pill */}
           <div className="bg-[#111] border border-white/5 p-6 rounded-3xl flex items-center justify-center">
              <div className="bg-white/5 border border-white/10 rounded-full h-12 flex items-center px-4 gap-6">
                 <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary, color: colors.background }}>
                    <Home size={14} />
                 </div>
                 <Search size={14} className="text-zinc-600" />
                 <User size={14} className="text-zinc-600" />
              </div>
           </div>

           {/* Icon Sets */}
           <div className="bg-[#111] border border-white/5 p-6 rounded-3xl grow flex items-end justify-center">
              <div className="flex gap-3">
                 <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#222]" style={{ color: colors.primary }}>
                    <Plus size={16} />
                 </div>
                 <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#222]" style={{ color: colors.tertiary }}>
                    <Box size={16} />
                 </div>
                 <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#222]" style={{ color: colors.neutral }}>
                    <Tag size={16} />
                 </div>
                 <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#222]" style={{ color: "#ef4444" }}>
                    <Trash2 size={16} />
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
