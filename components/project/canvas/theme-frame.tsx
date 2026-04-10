import React from "react";
import { type Artifact } from "@/lib/types";

interface ThemeFrameProps {
  artifact: Artifact;
  onRef?: (el: HTMLIFrameElement | null) => void;
}

export function ThemeFrame({ artifact, onRef }: ThemeFrameProps) {
  // Graceful fallback for empty/generating variables
  const variables = artifact.variables || {};
  const colors = variables.colors || {
    primary: "#6366f1",
    secondary: "#ec4899",
    tertiary: "#14b8a6",
    neutral: "#94a3b8",
    background: "#0f172a",
    foreground: "#f8fafc"
  };
  const typography = variables.typography || {
    headline: "Inter",
    body: "Inter",
    label: "Inter"
  };

  return (
    <div 
      className="w-full h-full flex flex-col font-sans p-10 select-none overflow-hidden"
      style={{
         backgroundColor: colors.background,
         color: colors.foreground
      }}
    >
      <div className="flex justify-between items-end mb-10 border-b pb-6" style={{ borderColor: `${colors.foreground}20` }}>
         <div>
           <h1 className="text-5xl font-black tracking-tight" style={{ fontFamily: typography.headline, color: colors.foreground }}>Horizon Ethos</h1>
           <p className="text-lg opacity-60 mt-2" style={{ fontFamily: typography.body }}>Unified Design System</p>
         </div>
      </div>

      <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-6">
          {/* Primary Color Block */}
          <div className="col-span-4 row-span-3 rounded-3xl p-6 flex flex-col justify-between" style={{ backgroundColor: colors.primary, color: "#fff" }}>
              <span className="font-medium text-sm mix-blend-overlay">Primary Palette</span>
              <div>
                  <div className="text-5xl font-black" style={{ fontFamily: typography.headline }}>Aa</div>
                  <div className="text-xl font-bold mt-2 font-mono mix-blend-overlay">{colors.primary.toUpperCase()}</div>
              </div>
          </div>

          {/* Typography Block */}
          <div className="col-span-8 row-span-2 rounded-3xl p-8 border" style={{ backgroundColor: `${colors.foreground}05`, borderColor: `${colors.foreground}10` }}>
             <span className="font-medium text-sm opacity-60 uppercase tracking-widest block mb-4" style={{ fontFamily: typography.label }}>Typography System</span>
             <div className="space-y-4">
                 <div className="flex items-baseline gap-4">
                     <span className="text-4xl font-bold w-1/4" style={{ fontFamily: typography.headline }}>Headline</span>
                     <span className="text-lg opacity-80" style={{ fontFamily: typography.body }}>{typography.headline} - Used for major section headers</span>
                 </div>
                 <div className="flex items-baseline gap-4">
                     <span className="text-xl w-1/4" style={{ fontFamily: typography.body }}>Body Text</span>
                     <span className="text-md opacity-80" style={{ fontFamily: typography.body }}>{typography.body} - Primary reading material</span>
                 </div>
             </div>
          </div>

          {/* Secondary Colors Bento Grid */}
          <div className="col-span-8 row-span-4 grid grid-cols-2 gap-6">
             <div className="rounded-3xl p-6 border flex flex-col justify-end" style={{ backgroundColor: `${colors.secondary}15`, borderColor: `${colors.secondary}30` }}>
                <span className="font-medium text-sm opacity-60 mb-2" style={{ color: colors.secondary }}>Secondary / Accent</span>
                <div className="text-3xl font-black font-mono tracking-tighter" style={{ color: colors.secondary }}>{colors.secondary.toUpperCase()}</div>
             </div>

             <div className="rounded-3xl p-6 border flex flex-col justify-end" style={{ backgroundColor: `${colors.tertiary}15`, borderColor: `${colors.tertiary}30` }}>
                <span className="font-medium text-sm opacity-60 mb-2" style={{ color: colors.tertiary }}>Tertiary / Highlight</span>
                <div className="text-3xl font-black font-mono tracking-tighter" style={{ color: colors.tertiary }}>{colors.tertiary.toUpperCase()}</div>
             </div>

             <div className="rounded-3xl p-6 border flex flex-col justify-end" style={{ backgroundColor: `${colors.neutral}15`, borderColor: `${colors.neutral}30` }}>
                <span className="font-medium text-sm opacity-60 mb-2" style={{ color: colors.neutral }}>Neutral / Muted</span>
                <div className="text-3xl font-black font-mono tracking-tighter" style={{ color: colors.neutral }}>{colors.neutral.toUpperCase()}</div>
             </div>

             <div className="rounded-3xl p-6 border flex flex-col justify-center items-center relative overflow-hidden" style={{ backgroundColor: `${colors.foreground}05`, borderColor: `${colors.foreground}10` }}>
                 <div className="absolute inset-0 opacity-10" 
                      style={{ backgroundImage: 'linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%, currentColor), linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%, currentColor)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }} />
                 <span className="text-lg font-medium relative z-10 p-2 rounded" style={{ backgroundColor: colors.background, color: colors.foreground }}>Base Components</span>
             </div>
          </div>

          {/* Bottom Left Utility */}
          <div className="col-span-4 row-span-3 rounded-3xl p-6 border flex flex-col" style={{ backgroundColor: `${colors.foreground}05`, borderColor: `${colors.foreground}10` }}>
             <span className="font-medium text-sm opacity-60 block mb-6">Interactive Elements</span>
             <div className="space-y-4 flex-1">
                 <button className="w-full py-4 rounded-xl font-medium text-lg transition-transform hover:scale-105 active:scale-95" style={{ backgroundColor: colors.primary, color: '#fff' }}>Primary Action</button>
                 <button className="w-full py-4 rounded-xl font-medium text-lg border-2 transition-transform hover:scale-105 active:scale-95" style={{ borderColor: colors.primary, color: colors.primary }}>Secondary Action</button>
             </div>
          </div>
      </div>
    </div>
  );
}
