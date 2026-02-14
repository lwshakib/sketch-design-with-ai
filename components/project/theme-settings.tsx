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
    id: t.id || `project-theme-${i}`,
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
                    ? "bg-primary/5 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]" 
                    : "bg-muted/40 border-border hover:bg-muted/80 hover:border-primary/30"
            )}
        >
            <div className="flex items-center justify-between w-full mb-3">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-[13px] font-bold transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                        {theme.name}
                    </span>
                    {isActive && (
                        <div className="size-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary),0.5)]" />
                    )}
                </div>
                <div className="flex gap-1.5 transform group-hover:scale-110 transition-transform">
                    {theme.colors.map((color, i) => (
                        <div 
                            key={i} 
                            className="size-3 rounded-full border border-border shadow-sm" 
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>
            
            <p className={cn(
                "text-[11px] transition-colors leading-relaxed",
                isActive ? "text-primary/80" : "text-muted-foreground group-hover:text-foreground/80"
            )}>
                {theme.description}
            </p>

            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
  };

  const [activeTab, setActiveTab] = React.useState("presets");
  
  // Auto-switch to AI tab if an AI theme is active
  React.useEffect(() => {
    const isProjectTheme = activeThemeId?.startsWith('project-theme-') || activeThemeId?.startsWith('ai-gen-') || appliedTheme?.isGenerated;
    if (isProjectTheme) {
      setActiveTab("ai");
    }
  }, [activeThemeId, appliedTheme]);

  return (
    <div className="h-full flex flex-col bg-sidebar animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-sidebar/50">
        <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Customization</span>
            <span className="text-[13px] font-bold text-foreground">Theme Library</span>
        </div>
      </div>
 
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
            <div className="px-4 pt-4 flex-shrink-0">
                <TabsList className="w-full bg-muted/50 border border-border p-1 rounded-xl h-10">
                    <TabsTrigger 
                        value="presets" 
                        className="flex-1 rounded-lg text-[11px] font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                    >
                        PRESETS
                    </TabsTrigger>
                    <TabsTrigger 
                        value="ai" 
                        className="flex-1 rounded-lg text-[11px] font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
                    >
                        AI DESIGNER
                        {projectThemes.length > 0 && (
                            <span className="bg-background/20 px-1.5 py-0.5 rounded-md text-[9px]">{projectThemes.length}</span>
                        )}
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="presets" className="flex-1 overflow-y-auto mt-0 p-4 min-h-0">
                <div className="space-y-4">
                    <div className="space-y-1 px-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Presets</p>
                        <p className="text-[10px] text-muted-foreground/80">Hand-crafted industrial design systems.</p>
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
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Architected Themes</p>
                                <p className="text-[10px] text-muted-foreground">Generated specifically for this project.</p>
                            </div>
                            <Zap className="size-3 text-primary animate-pulse" />
                        </div>
                        <div className="grid gap-3">
                            {projectThemes.map(renderThemeCard)}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-border rounded-2xl bg-muted/20">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                            <Sparkles className="size-5 text-primary" />
                        </div>
                        <p className="text-[11px] font-bold text-foreground mb-1">No AI themes yet</p>
                        <p className="text-[10px] text-muted-foreground max-w-[180px]">Describe your brand below to generate custom tokens.</p>
                    </div>
                )}

                {/* Theme Generator Section */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/20 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-primary" />
                        <span className="text-xs font-bold text-foreground uppercase tracking-wide">Custom Token Engine</span>
                    </div>
                    
                    {!showInput ? (
                        <>
                            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                                "Describe a mood or brand identity and Sketch will generate a custom color palette for you."
                            </p>
                            <button 
                                onClick={() => setShowInput(true)}
                                className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
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
                                className="w-full bg-background/50 border border-border rounded-xl p-3 text-[11px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 min-h-[80px] resize-none"
                            />
                            <div className="flex gap-2">
                                <button 
                                    disabled={isGenerating}
                                    onClick={() => setShowInput(false)}
                                    className="flex-1 h-8 bg-muted text-muted-foreground text-[10px] font-bold rounded-lg hover:text-foreground transition-colors"
                                >
                                    CANCEL
                                </button>
                                <button 
                                    disabled={isGenerating || !themePrompt.trim()}
                                    onClick={handleGenerateTheme}
                                    className="flex-[2] h-8 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2"
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
      <div className="p-4 border-t border-border bg-sidebar/30">
        <div className="grid grid-cols-2 gap-3">
            <Popover>
                <PopoverTrigger asChild>
                    <button className="p-3 bg-muted/40 border border-border rounded-xl flex items-center gap-3 hover:bg-muted transition-colors group">
                        <Type className="size-3.5 text-primary group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col items-start translate-y-[1px]">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Font</span>
                            <span className="text-[11px] font-bold text-foreground leading-none">{appliedTheme?.cssVars?.fontSans?.split(',')[0] || "Inter"}</span>
                        </div>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-popover border-border p-1 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="p-2 border-b border-border bg-muted/40">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Select Font</span>
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
                                appliedTheme?.cssVars?.fontSans === font.value 
                                    ? "bg-primary text-primary-foreground font-bold" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {font.name}
                        </button>
                    ))}
                </PopoverContent>
            </Popover>

            <Popover>
                <PopoverTrigger asChild>
                    <button className="p-3 bg-muted/40 border border-border rounded-xl flex items-center gap-3 hover:bg-muted transition-colors group">
                        <Box className="size-3.5 text-primary group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col items-start translate-y-[1px]">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Radius</span>
                            <span className="text-[11px] font-bold text-foreground leading-none">{appliedTheme?.cssVars?.radius || "0.5rem"}</span>
                        </div>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-popover border-border p-1 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="p-2 border-b border-border bg-muted/40">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Select Radius</span>
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
                                appliedTheme?.cssVars?.radius === rad.value 
                                    ? "bg-primary text-primary-foreground font-bold" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
