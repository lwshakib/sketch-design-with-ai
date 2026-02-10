/** @jsxImportSource react */
"use client";

import React from "react";
import { Check, Palette, Sparkles, Layout, Type, Box } from "lucide-react";
import { cn } from "@/lib/utils";

import { THEMES, ThemeKey, THEME_NAME_LIST } from "@/llm/prompts";

type Theme = {
  id: string;
  name: string;
  colors: string[];
  cssVars: any;
  description: string;
  isGenerated?: boolean;
};

const themes: Theme[] = (THEME_NAME_LIST as unknown as string[]).map((key) => {
    const value = THEMES[key as ThemeKey];
    return {
        id: key,
        name: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '),
        colors: [value.primary, value.secondary, value.accent, value.background],
        cssVars: {
            background: value.background,
            foreground: value.foreground,
            card: value.card,
            cardForeground: value.cardForeground,
            popover: value.popover,
            popoverForeground: value.popoverForeground,
            primary: value.primary,
            primaryForeground: value.primaryForeground,
            secondary: value.secondary,
            secondaryForeground: value.secondaryForeground,
            muted: value.muted,
            mutedForeground: value.mutedForeground,
            accent: value.accent,
            accentForeground: value.accentForeground,
            destructive: value.destructive,
            border: value.border,
            input: value.input,
            ring: value.ring,
            radius: value.radius,
        },
        description: `A beautiful ${key.toLowerCase().replace('_', ' ')} theme with ${value.primary} accents.`
    };
});

type Props = {
  activeThemeId: string | null;
  onApplyTheme: (theme: Theme) => void;
  appliedTheme?: Theme | null;
};

export function ThemeSettings({ activeThemeId, onApplyTheme, appliedTheme }: Props) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [themePrompt, setThemePrompt] = React.useState("");
  const [showInput, setShowInput] = React.useState(false);

  // If no theme is active, the first theme (generated one) is the default
  const defaultThemeId = themes[0].id;
  const activeTheme = themes.find(t => t.id === (activeThemeId || defaultThemeId));

  const handleGenerateTheme = async () => {
    if (!themePrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: themePrompt }),
      });
      
      if (!res.ok) throw new Error("Failed to generate theme");
      
      const themeData = await res.json();
      
      // Create a temporary theme object to apply
      const generatedTheme: Theme = {
        id: `ai-gen-${Date.now()}`,
        name: themeData.name,
        description: themeData.description,
        colors: [
            themeData.cssVars.primary, 
            themeData.cssVars.secondary, 
            themeData.cssVars.accent, 
            themeData.cssVars.background
        ],
        cssVars: themeData.cssVars,
        isGenerated: true
      };
      
      onApplyTheme(generatedTheme);
      setThemePrompt("");
      setShowInput(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
        <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Customization</span>
            <span className="text-[13px] font-bold text-zinc-100">Theme Library</span>
        </div>
        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Palette className="size-4 text-indigo-500" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-8">
        {/* Active Theme Display */}
        {appliedTheme && (
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Currently Applied</span>
                    <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                </div>
                <div className="p-4 bg-indigo-600/10 border border-indigo-500/30 rounded-2xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3 relative z-10">
                        <span className="text-sm font-bold text-white tracking-tight">{appliedTheme.name}</span>
                        <div className="flex gap-1.5">
                            {(appliedTheme.colors || []).map((color, i) => (
                                <div 
                                    key={i} 
                                    className="size-3.5 rounded-full border border-white/20 shadow-sm" 
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-indigo-200/70 leading-relaxed relative z-10">
                        {appliedTheme.description}
                    </p>
                    <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
                        <Check className="size-16 -mr-4 -mt-4" />
                    </div>
                </div>
            </div>
        )}

        {/* Global Presets */}
        <div className="space-y-4">
            <div className="space-y-1 px-1">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Explore Presets</p>
                <p className="text-[10px] text-zinc-600">Switch between different visual styles instantly.</p>
            </div>

            <div className="grid gap-3">
                {themes.map((theme) => {
                    const isActive = activeTheme?.id === theme.id;
                    return (
                        <button
                            key={theme.id}
                            onClick={() => onApplyTheme(theme)}
                            className={cn(
                                "group relative flex flex-col items-start p-4 border rounded-2xl transition-all text-left overflow-hidden active:scale-[0.98]",
                                isActive 
                                    ? "bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                                    : "bg-zinc-900/40 border-white/5 hover:bg-zinc-900/80 hover:border-indigo-500/30"
                            )}
                        >
                            <div className="flex items-center justify-between w-full mb-3">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-[13px] font-bold transition-colors",
                                        isActive ? "text-white" : "text-zinc-200 group-hover:text-white"
                                    )}>
                                        {theme.name}
                                    </span>
                                    {isActive && (
                                        <div className="size-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
                                    )}
                                </div>
                                <div className="flex gap-1.5 transform group-hover:scale-110 transition-transform">
                                    {theme.colors.map((color, i) => (
                                        <div 
                                            key={i} 
                                            className="size-3 rounded-full border border-white/10 shadow-sm" 
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            
                            <p className={cn(
                                "text-[11px] transition-colors leading-relaxed",
                                isActive ? "text-indigo-200/60" : "text-zinc-500 group-hover:text-zinc-400"
                            )}>
                                {theme.description}
                            </p>

                            {/* Hover Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    );
                })}
            </div>
        </div>

        {/* AI Theme Suggestion */}
        <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 space-y-4">
            <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-100 uppercase tracking-wide">AI Designer</span>
            </div>
            
            {!showInput ? (
                <>
                    <p className="text-[11px] text-zinc-300 leading-relaxed italic">
                        "Describe a mood or brand identity and Sketch will generate a custom color palette and typography system for you."
                    </p>
                    <button 
                        onClick={() => setShowInput(true)}
                        className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                        LAUNCH THEME GENERATOR
                    </button>
                </>
            ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <textarea 
                        value={themePrompt}
                        onChange={(e) => setThemePrompt(e.target.value)}
                        placeholder="e.g. 'Cyberpunk financial dashboard with neon highlights' or 'Minimalist organic skincare brand'..."
                        className="w-full bg-zinc-950/50 border border-white/10 rounded-xl p-3 text-[11px] text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 min-h-[80px] resize-none"
                    />
                    <div className="flex gap-2">
                        <button 
                            disabled={isGenerating}
                            onClick={() => setShowInput(false)}
                            className="flex-1 h-8 bg-zinc-900 text-zinc-400 text-[10px] font-bold rounded-lg hover:text-white transition-colors"
                        >
                            CANCEL
                        </button>
                        <button 
                            disabled={isGenerating || !themePrompt.trim()}
                            onClick={handleGenerateTheme}
                            className="flex-[2] h-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            {isGenerating ? "GENERATING..." : "BUILD THEME"}
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Global Tokens Section (Placeholder) */}
        <div className="pt-4 space-y-4">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Global Tokens</span>
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-900/40 border border-white/5 rounded-xl flex items-center gap-3">
                    <Type className="size-3.5 text-zinc-500" />
                    <span className="text-[11px] font-bold text-zinc-400">Typography</span>
                </div>
                <div className="p-3 bg-zinc-900/40 border border-white/5 rounded-xl flex items-center gap-3">
                    <Box className="size-3.5 text-zinc-500" />
                    <span className="text-[11px] font-bold text-zinc-400">Radius</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
