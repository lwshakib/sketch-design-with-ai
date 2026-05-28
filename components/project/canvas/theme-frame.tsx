import React from "react";
import { type Artifact } from "@/lib/types";
import { 
  Search, 
  Home, 
  User, 
  Plus, 
  Pencil,
  Tag,
  Trash2,
  Sparkles,
  Shapes
} from "lucide-react";

interface ThemeFrameProps {
  artifact: Artifact;
  onRef?: (el: HTMLIFrameElement | null) => void;
}

/**
 * Helper to convert a hex color string to HSL.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, "");
  if (hex.length > 6) {
    hex = hex.substring(0, 6);
  }
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Helper to get a high contrast text color (black or white) for a hex background.
 */
function getContrastColor(hex: string): string {
  hex = hex.replace(/^#/, "");
  if (hex.length > 6) {
    hex = hex.substring(0, 6);
  }
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

/**
 * Helper to check if a theme color is dark.
 */
function isThemeDark(bg: string): boolean {
  bg = bg.replace(/^#/, "");
  if (bg.length > 6) bg = bg.substring(0, 6);
  if (bg.length === 3) bg = bg[0] + bg[0] + bg[1] + bg[1] + bg[2] + bg[2];
  if (bg.length !== 6) return true; // Default dark
  const r = parseInt(bg.substring(0, 2), 16);
  const g = parseInt(bg.substring(2, 4), 16);
  const b = parseInt(bg.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 128;
}

/**
 * Custom ColorRamp component matching the requested design layout.
 */
function ColorRamp({ label, hex, isDark }: { label: string; hex: string; isDark: boolean }) {
  const contrastColor = getContrastColor(hex);
  const { h, s } = hexToHsl(hex);
  
  // 10 steps of lightness to form the shade ramp
  const steps = [10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90];
  const cardBgClass = isDark 
    ? "bg-[#141414] border-white/5 text-white" 
    : "bg-white border-zinc-200/80 text-zinc-900 shadow-[0_6px_24px_rgba(0,0,0,0.02)]";

  return (
    <div className={`border p-3 rounded-[20px] flex flex-col gap-2 h-[110px] justify-between shadow-sm ${cardBgClass}`}>
      <div 
        className="rounded-xl p-2.5 flex justify-between items-center h-11 shadow-inner"
        style={{ backgroundColor: hex, color: contrastColor }}
      >
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
        <span className="text-[9px] font-mono opacity-80 uppercase font-semibold">{hex}</span>
      </div>
      
      <div className={`flex h-3.5 rounded-md overflow-hidden border ${isDark ? "border-white/5" : "border-zinc-200/40"}`}>
        {steps.map((lightness, idx) => (
          <div 
            key={idx}
            className="flex-1 h-full"
            style={{ backgroundColor: `hsl(${h}, ${s}%, ${lightness}%)` }}
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

  const isDark = isThemeDark(colors.background);
  const cardBgClass = isDark 
    ? "bg-[#141414] border-white/5 text-white" 
    : "bg-white border-zinc-200/80 text-zinc-900 shadow-[0_6px_24px_rgba(0,0,0,0.02)]";
  const subBgClass = isDark 
    ? "bg-[#1b1b1b] border-white/5 text-zinc-300" 
    : "bg-zinc-100 border-zinc-200/80 text-zinc-800";
  const textMutedClass = isDark ? "text-zinc-500" : "text-zinc-400";
  const textMutedLightClass = isDark ? "text-zinc-400" : "text-zinc-500";

  return (
    <div 
      className="w-full h-full flex flex-col font-sans select-none overflow-hidden relative"
      style={{
         backgroundColor: colors.background,
         color: colors.foreground
      }}
    >
      {/* Dot Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', 
          backgroundSize: '24px 24px' 
        }} 
      />

      {/* Bento Grid */}
      <div className="flex-1 p-6 grid grid-cols-4 gap-3 overflow-hidden h-full">
        
        {/* Column 1: Palette */}
        <div className="flex flex-col gap-3">
           <ColorRamp label="Primary" hex={colors.primary} isDark={isDark} />
           <ColorRamp label="Secondary" hex={colors.secondary} isDark={isDark} />
           <ColorRamp label="Tertiary" hex={colors.tertiary} isDark={isDark} />
           <ColorRamp label="Neutral" hex={colors.neutral} isDark={isDark} />
        </div>

        {/* Column 2: Typography & Structure */}
        <div className="flex flex-col gap-3">
           {/* Headline Card */}
           <div className={`border p-4 rounded-[20px] flex flex-col justify-between h-[150px] shadow-sm ${cardBgClass}`}>
              <div className="flex justify-between items-start">
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${textMutedClass}`}>Headline</span>
                  <span className={`text-[11px] font-semibold ${textMutedLightClass}`}>{typography.headline}</span>
              </div>
              <div className="text-6xl font-normal text-center select-none" style={{ fontFamily: typography.headline }}>Aa</div>
           </div>

           {/* Body Text Card */}
           <div className={`border p-4 rounded-[20px] flex flex-col justify-between h-[150px] shadow-sm ${cardBgClass}`}>
              <div className="flex justify-between items-start">
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${textMutedClass}`}>Body</span>
                  <span className={`text-[11px] font-semibold ${textMutedLightClass}`}>{typography.body}</span>
              </div>
              <div className="text-6xl font-normal text-center select-none opacity-85" style={{ fontFamily: typography.body }}>Aa</div>
           </div>

           {/* Label Card */}
           <div className={`border p-4 rounded-[20px] flex flex-col justify-between h-[150px] shadow-sm ${cardBgClass}`}>
              <div className="flex justify-between items-start">
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${textMutedClass}`}>Label</span>
                  <span className={`text-[11px] font-semibold ${textMutedLightClass}`}>{typography.label}</span>
              </div>
              <div className="text-6xl font-normal text-center select-none opacity-70" style={{ fontFamily: typography.label }}>Aa</div>
           </div>
        </div>

        {/* Column 3: Components & UI Details */}
        <div className="flex flex-col gap-3">
           {/* Buttons Component */}
           <div className={`border p-4 rounded-[20px] flex flex-col justify-center gap-3.5 h-[150px] shadow-sm ${cardBgClass}`}>
              <div className="grid grid-cols-2 gap-2.5">
                 <button 
                   className="w-full py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm flex items-center justify-center cursor-default" 
                   style={{ backgroundColor: colors.primary, color: getContrastColor(colors.primary) }}
                 >
                   Primary
                 </button>
                 <button className={`w-full py-2 rounded-xl text-[11px] font-bold flex items-center justify-center cursor-default ${isDark ? "bg-[#222] text-white" : "bg-zinc-100 border border-zinc-200 text-zinc-800"}`}>
                   Secondary
                 </button>
                 <button className={`w-full py-2 rounded-xl text-[11px] font-bold flex items-center justify-center cursor-default ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>
                   Inverted
                 </button>
                 <button className={`w-full py-2 rounded-xl text-[11px] font-bold border flex items-center justify-center cursor-default ${isDark ? "border-white/20 text-white/80" : "border-zinc-300 text-zinc-700"}`}>
                   Outlined
                 </button>
              </div>
           </div>

           {/* Skeleton Content */}
           <div className={`border p-4 rounded-[20px] flex flex-col justify-center gap-3 h-[120px] shadow-sm ${cardBgClass}`}>
              <div className="space-y-2.5">
                 <div className="h-1.5 w-full rounded-full animate-pulse" style={{ backgroundColor: colors.primary }} />
                 <div className="h-1.5 w-[85%] rounded-full animate-pulse" style={{ backgroundColor: colors.secondary }} />
                 <div className="h-1.5 w-[55%] rounded-full animate-pulse" style={{ backgroundColor: colors.tertiary }} />
              </div>
           </div>

           {/* Sub-components Grid */}
           <div className="grid grid-cols-2 gap-3 h-[182px]">
              <div className={`border rounded-[20px] flex items-center justify-center p-4 shadow-sm ${cardBgClass}`}>
                 <div 
                   className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                   style={{ 
                     backgroundColor: `${colors.tertiary}22`, 
                     color: colors.tertiary,
                     border: `1px solid ${colors.tertiary}33`
                   }}
                 >
                    <Pencil size={18} />
                 </div>
              </div>
              <div className={`border rounded-[20px] flex items-center justify-center p-4 shadow-sm ${cardBgClass}`}>
                 <button 
                   className="px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-md cursor-default"
                   style={{ 
                     backgroundColor: colors.primary, 
                     color: getContrastColor(colors.primary) 
                   }}
                 >
                    <Pencil size={12} />
                    <span>Label</span>
                 </button>
              </div>
           </div>
        </div>

        {/* Column 4: Architecture */}
        <div className="flex flex-col gap-3">
           {/* Search Architecture */}
           <div className={`border p-4 rounded-[20px] flex items-center justify-center h-[110px] shadow-sm ${cardBgClass}`}>
              <div className={`w-full border rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 ${subBgClass}`}>
                 <Search size={14} className={`${isDark ? "text-zinc-500" : "text-zinc-400"}`} />
                 <span className={`text-[11px] font-medium ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>Search</span>
              </div>
           </div>

           {/* Navigation Pill */}
           <div className={`border p-4 rounded-[20px] flex items-center justify-center h-[150px] shadow-sm ${cardBgClass}`}>
              <div className={`border rounded-full h-12 flex items-center px-3 gap-5 shadow-inner ${subBgClass}`}>
                 <div 
                   className="w-7.5 h-7.5 rounded-full flex items-center justify-center shadow-sm"
                   style={{ 
                     backgroundColor: colors.primary, 
                     color: getContrastColor(colors.primary) 
                   }}
                 >
                    <Home size={14} />
                 </div>
                 <Search size={14} className={`${isDark ? "text-zinc-500" : "text-zinc-400"}`} />
                 <User size={14} className={`${isDark ? "text-zinc-500" : "text-zinc-400"}`} />
              </div>
           </div>

           {/* Icon Sets */}
           <div className={`border p-4 rounded-[20px] flex items-center justify-center h-[192px] shadow-sm ${cardBgClass}`}>
              <div className="flex gap-2">
                 <div 
                   className="w-9 h-9 rounded-full flex items-center justify-center shadow-md animate-bounce"
                   style={{ 
                     backgroundColor: `${colors.primary}22`, 
                     color: colors.primary,
                     border: `1px solid ${colors.primary}33`
                   }}
                 >
                    <Sparkles size={16} />
                 </div>
                 <div 
                   className="w-9 h-9 rounded-full flex items-center justify-center shadow-md animate-pulse"
                   style={{ 
                     backgroundColor: `${colors.secondary}22`, 
                     color: colors.secondary,
                     border: `1px solid ${colors.secondary}33`
                   }}
                 >
                    <Shapes size={16} />
                 </div>
                 <div 
                   className="w-9 h-9 rounded-full flex items-center justify-center shadow-md"
                   style={{ 
                     backgroundColor: `${colors.tertiary}22`, 
                     color: colors.tertiary,
                     border: `1px solid ${colors.tertiary}33`
                   }}
                 >
                    <Tag size={16} />
                 </div>
                 <div 
                   className="w-9 h-9 rounded-full flex items-center justify-center shadow-md"
                   style={{ 
                     backgroundColor: "#ef444422", 
                     color: "#ef4444",
                     border: "1px solid #ef444433"
                   }}
                 >
                    <Trash2 size={16} />
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
