/** @jsxImportSource react */
"use client";

import React from "react";
import { Check, Palette, Sparkles, Layout, Type, Box, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { THEMES, ThemeKey, THEME_NAME_LIST } from "@/llm/prompts";
import { useProjectStore } from "@/hooks/use-project-store";

type Theme = {
  id: string;
  name: string;
  colors: string[];
  cssVars: any;
  description: string;
  isGenerated?: boolean;
};

const defaultThemes: Theme[] = (THEME_NAME_LIST as unknown as string[]).map((key) => {
    const value = THEMES[key as ThemeKey];
    return {
        id: key,
        name: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '),
        colors: [value.primary, value.secondary, value.accent, value.background],
        cssVars: { ...value },
        description: `A professional ${key.toLowerCase().replace('_', ' ')} design system.`
    };
});

type Props = {
  activeThemeId: string | null;
  onApplyTheme: (theme: Theme) => void;
  appliedTheme?: Theme | null;
};

export function ThemeSettings({ activeThemeId, onApplyTheme, appliedTheme }: Props) {
  const { project } = useProjectStore();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [themePrompt, setThemePrompt] = React.useState("");
  const [showInput, setShowInput] = React.useState(false);

  // Normalize project themes
  const projectThemes: Theme[] = (project?.themes || []).map((t: any, i: number) => ({
    id: `project-theme-${i}`,
    name: t.name,
    description: "AI-generated design system tailored for this project.",
    colors: [t.colors.primary, t.colors.secondary, t.colors.accent, t.colors.background],
    cssVars: t.colors,
    isGenerated: true
  }));

  const combinedThemes = [...defaultThemes, ...projectThemes];

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

  const renderThemeCard = (theme: Theme) => {
    const isActive = activeThemeId === theme.id || appliedTheme?.name === theme.name;
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
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
        <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Customization</span>
            <span className="text-[13px] font-bold text-zinc-100">Theme Library</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <Tabs defaultValue="presets" className="flex-1 min-h-0 flex flex-col">
            <div className="px-4 pt-4 flex-shrink-0">
                <TabsList className="w-full bg-zinc-900/50 border border-white/5 p-1 rounded-xl h-10">
                    <TabsTrigger 
                        value="presets" 
                        className="flex-1 rounded-lg text-[11px] font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                    >
                        PRESETS
                    </TabsTrigger>
                    <TabsTrigger 
                        value="ai" 
                        className="flex-1 rounded-lg text-[11px] font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all flex items-center gap-2"
                    >
                        AI DESIGNER
                        {projectThemes.length > 0 && (
                            <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[9px]">{projectThemes.length}</span>
                        )}
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="presets" className="flex-1 overflow-y-auto mt-0 p-4 min-h-0">
                <div className="space-y-4">
                    <div className="space-y-1 px-1">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global Presets</p>
                        <p className="text-[10px] text-zinc-600">Hand-crafted industrial design systems.</p>
                    </div>
                    <div className="grid gap-3">
                        {defaultThemes.map(renderThemeCard)}
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="ai" className="flex-1 overflow-y-auto mt-0 p-4 min-h-0 space-y-8">
                {projectThemes.length > 0 ? (
                    <div className="space-y-4">
                        <div className="space-y-1 px-1 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Architected Themes</p>
                                <p className="text-[10px] text-zinc-600">Generated specifically for this project.</p>
                            </div>
                            <Zap className="size-3 text-indigo-500 animate-pulse" />
                        </div>
                        <div className="grid gap-3">
                            {projectThemes.map(renderThemeCard)}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                        <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3">
                            <Sparkles className="size-5 text-indigo-400" />
                        </div>
                        <p className="text-[11px] font-bold text-zinc-300 mb-1">No AI themes yet</p>
                        <p className="text-[10px] text-zinc-500 max-w-[180px]">Describe your brand below to generate custom tokens.</p>
                    </div>
                )}

                {/* Theme Generator Section */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 space-y-4 shadow-xl">
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-100 uppercase tracking-wide">Custom Token Engine</span>
                    </div>
                    
                    {!showInput ? (
                        <>
                            <p className="text-[11px] text-zinc-300 leading-relaxed italic">
                                "Describe a mood or brand identity and Sketch will generate a custom color palette for you."
                            </p>
                            <button 
                                onClick={() => setShowInput(true)}
                                className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                GENERATE NEW SYSTEM
                            </button>
                        </>
                    ) : (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <textarea 
                                value={themePrompt}
                                onChange={(e) => setThemePrompt(e.target.value)}
                                placeholder="e.g. 'Cyberpunk financial dashboard' or 'Minimalist organic skincare'..."
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
                                    {isGenerating ? "GENERATING..." : "BUILD SYSTEM"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
      </div>

      {/* Global Tokens Section (Bottom Sticky) */}
      <div className="p-4 border-t border-white/5 bg-zinc-900/30">
        <div className="grid grid-cols-2 gap-3">
            <Popover>
                <PopoverTrigger asChild>
                    <button className="p-3 bg-zinc-900/40 border border-white/5 rounded-xl flex items-center gap-3 hover:bg-zinc-900 transition-colors group">
                        <Type className="size-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col items-start translate-y-[1px]">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">Font</span>
                            <span className="text-[11px] font-bold text-zinc-300 leading-none">{appliedTheme?.cssVars.fontSans?.split(',')[0] || "Inter"}</span>
                        </div>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-zinc-950 border-white/10 p-1 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-white/5 bg-zinc-900/40">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Select Font</span>
                    </div>
                    {[
                        { name: "Inter", value: "'Inter', sans-serif" },
                        { name: "Outfit", value: "'Outfit', sans-serif" },
                        { name: "Plus Jakarta", value: "'Plus Jakarta Sans', sans-serif" },
                        { name: "JetBrains Mono", value: "'JetBrains Mono', monospace" }
                    ].map((font) => (
                        <button
                            key={font.name}
                            onClick={() => {
                                if (appliedTheme) {
                                    onApplyTheme({
                                        ...appliedTheme,
                                        cssVars: { ...appliedTheme.cssVars, fontSans: font.value }
                                    });
                                }
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 text-[11px] rounded-lg transition-all",
                                appliedTheme?.cssVars.fontSans === font.value 
                                    ? "bg-indigo-600 text-white font-bold" 
                                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            {font.name}
                        </button>
                    ))}
                </PopoverContent>
            </Popover>

            <Popover>
                <PopoverTrigger asChild>
                    <button className="p-3 bg-zinc-900/40 border border-white/5 rounded-xl flex items-center gap-3 hover:bg-zinc-900 transition-colors group">
                        <Box className="size-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col items-start translate-y-[1px]">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">Radius</span>
                            <span className="text-[11px] font-bold text-zinc-300 leading-none">{appliedTheme?.cssVars.radius || "0.5rem"}</span>
                        </div>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-zinc-950 border-white/10 p-1 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-white/5 bg-zinc-900/40">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Select Radius</span>
                    </div>
                    {[
                        { name: "None", value: "0rem" },
                        { name: "Sharp", value: "0.25rem" },
                        { name: "Modern", value: "0.5rem" },
                        { name: "Curvy", value: "0.9rem" },
                        { name: "Round", value: "1.5rem" }
                    ].map((rad) => (
                        <button
                            key={rad.name}
                            onClick={() => {
                                if (appliedTheme) {
                                    onApplyTheme({
                                        ...appliedTheme,
                                        cssVars: { ...appliedTheme.cssVars, radius: rad.value }
                                    });
                                }
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 text-[11px] rounded-lg transition-all",
                                appliedTheme?.cssVars.radius === rad.value 
                                    ? "bg-indigo-600 text-white font-bold" 
                                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            {rad.name}
                        </button>
                    ))}
                </PopoverContent>
            </Popover>
        </div>
      </div>
    </div>
  );
}
