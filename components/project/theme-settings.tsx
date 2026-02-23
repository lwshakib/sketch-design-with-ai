"use client";

/**
 * @file theme-settings.tsx
 * @description Manages the project's visual identity.
 * Supports switching between hand-crafted brand presets and AI-designed theme systems.
 * Provides granular control over global design tokens like color palettes,
 * typography families, and border-radius (pixel-rounding) across all screens.
 */

import React from "react";
import { Sparkles, Type, Box, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

const defaultThemes: Theme[] = (THEME_NAME_LIST as unknown as string[]).map(
  (key) => {
    const value = THEMES[key as ThemeKey];
    return {
      id: key,
      name: key
        .split("_")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" "),
      colors: [value.primary, value.secondary, value.accent, value.background],
      cssVars: { ...value },
      description: `A professional ${key.toLowerCase().replace("_", " ")} design system.`,
    };
  },
);

/**
 * Props for the ThemeSettings component.
 */
type Props = {
  /** The unique identifier of the currently active theme */
  activeThemeId: string | null;
  /** Callback triggered when a user selects a new hand-crafted or AI theme */
  onApplyTheme: (theme: Theme) => void;
  /** The theme object that is currently applied to the project workspace */
  appliedTheme?: Theme | null;
};

export function ThemeSettings({
  activeThemeId,
  onApplyTheme,
  appliedTheme,
}: Props) {
  const { project } = useProjectStore();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [themePrompt, setThemePrompt] = React.useState("");
  const [showInput, setShowInput] = React.useState(false);

  // Normalize project themes
  const projectThemes: Theme[] = (project?.themes || []).map(
    (t: any, i: number) => ({
      id: t.id || `project-theme-${i}`,
      name: t.name,
      description: "AI-generated design system tailored for this project.",
      colors: [
        t.colors.primary,
        t.colors.secondary,
        t.colors.accent,
        t.colors.background,
      ],
      cssVars: t.colors,
      isGenerated: true,
    }),
  );

  const _combinedThemes = [...defaultThemes, ...projectThemes];

  /**
   * Calls the AI Designer API to generate a completely new design system (color tokens)
   * based on a natural language brand description.
   */
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
          themeData.cssVars.background,
        ],
        cssVars: themeData.cssVars,
        isGenerated: true,
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
    const isActive =
      activeThemeId === theme.id || appliedTheme?.name === theme.name;
    return (
      <button
        key={theme.id}
        onClick={() => onApplyTheme(theme)}
        className={cn(
          "group relative flex flex-col items-start overflow-hidden rounded-2xl border p-4 text-left transition-all active:scale-[0.98]",
          isActive
            ? "bg-primary/5 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
            : "bg-muted/40 border-border hover:bg-muted/80 hover:border-primary/30",
        )}
      >
        <div className="mb-3 flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[13px] font-bold transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            >
              {theme.name}
            </span>
            {isActive && (
              <div className="bg-primary size-1.5 rounded-full shadow-[0_0_5px_rgba(var(--primary),0.5)]" />
            )}
          </div>
          <div className="flex transform gap-1.5 transition-transform group-hover:scale-110">
            {theme.colors.map((color, i) => (
              <div
                key={i}
                className="border-border size-3 rounded-full border shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <p
          className={cn(
            "text-[11px] leading-relaxed transition-colors",
            isActive
              ? "text-primary/80"
              : "text-muted-foreground group-hover:text-foreground/80",
          )}
        >
          {theme.description}
        </p>

        {/* Hover Gradient Overlay */}
        <div className="from-primary/0 to-primary/5 absolute inset-0 bg-gradient-to-br via-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  };

  const [activeTab, setActiveTab] = React.useState("presets");

  // Auto-switch to AI tab if an AI theme is active
  React.useEffect(() => {
    const isProjectTheme =
      activeThemeId?.startsWith("project-theme-") ||
      activeThemeId?.startsWith("ai-gen-") ||
      appliedTheme?.isGenerated;
    if (isProjectTheme) {
      setActiveTab("ai");
    }
  }, [activeThemeId, appliedTheme]);

  return (
    <div className="bg-sidebar animate-in fade-in flex h-full flex-col duration-300">
      {/* Header */}
      <div className="border-border bg-sidebar/50 flex items-center justify-between border-b p-4">
        <div className="flex flex-col">
          <span className="text-primary mb-0.5 text-[10px] font-black tracking-widest uppercase">
            Customization
          </span>
          <span className="text-foreground text-[13px] font-bold">
            Theme Library
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-shrink-0 px-4 pt-4">
            <TabsList className="bg-muted/50 border-border h-10 w-full rounded-xl border p-1">
              <TabsTrigger
                value="presets"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 rounded-lg text-[11px] font-bold transition-all"
              >
                PRESETS
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex flex-1 items-center gap-2 rounded-lg text-[11px] font-bold transition-all"
              >
                AI DESIGNER
                {projectThemes.length > 0 && (
                  <span className="bg-background/20 rounded-md px-1.5 py-0.5 text-[9px]">
                    {projectThemes.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="presets"
            className="mt-0 min-h-0 flex-1 overflow-y-auto p-4"
          >
            <div className="space-y-4">
              <div className="space-y-1 px-1">
                <p className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                  Global Presets
                </p>
                <p className="text-muted-foreground/80 text-[10px]">
                  Hand-crafted industrial design systems.
                </p>
              </div>
              <div className="grid gap-3">
                {defaultThemes.map(renderThemeCard)}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="ai"
            className="mt-0 min-h-0 flex-1 space-y-8 overflow-y-auto p-4"
          >
            {projectThemes.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between space-y-1 px-1">
                  <div>
                    <p className="text-primary text-[10px] font-black tracking-widest uppercase">
                      Architected Themes
                    </p>
                    <p className="text-muted-foreground text-[10px]">
                      Generated specifically for this project.
                    </p>
                  </div>
                  <Zap className="text-primary size-3 animate-pulse" />
                </div>
                <div className="grid gap-3">
                  {projectThemes.map(renderThemeCard)}
                </div>
              </div>
            ) : (
              <div className="border-border bg-muted/20 flex flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center">
                <div className="bg-primary/10 mb-3 flex h-10 w-10 items-center justify-center rounded-full">
                  <Sparkles className="text-primary size-5" />
                </div>
                <p className="text-foreground mb-1 text-[11px] font-bold">
                  No AI themes yet
                </p>
                <p className="text-muted-foreground max-w-[180px] text-[10px]">
                  Describe your brand below to generate custom tokens.
                </p>
              </div>
            )}

            {/* Theme Generator Section */}
            <div className="from-primary/10 border-primary/20 space-y-4 rounded-2xl border bg-gradient-to-br to-purple-600/10 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary size-4" />
                <span className="text-foreground text-xs font-bold tracking-wide uppercase">
                  Custom Token Engine
                </span>
              </div>

              {!showInput ? (
                <>
                  <p className="text-muted-foreground text-[11px] leading-relaxed italic">
                    "Describe a mood or brand identity and Sketch will generate
                    a custom color palette for you."
                  </p>
                  <button
                    onClick={() => setShowInput(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 flex h-9 w-full items-center justify-center gap-2 rounded-xl text-[10px] font-bold shadow-md transition-all"
                  >
                    GENERATE NEW SYSTEM
                  </button>
                </>
              ) : (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-3 duration-300">
                  <textarea
                    value={themePrompt}
                    onChange={(e) => setThemePrompt(e.target.value)}
                    placeholder="e.g. 'Cyberpunk financial dashboard' or 'Minimalist organic skincare'..."
                    className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 min-h-[80px] w-full resize-none rounded-xl border p-3 text-[11px] outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={isGenerating}
                      onClick={() => setShowInput(false)}
                      className="bg-muted text-muted-foreground hover:text-foreground h-8 flex-1 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      CANCEL
                    </button>
                    <button
                      disabled={isGenerating || !themePrompt.trim()}
                      onClick={handleGenerateTheme}
                      className="bg-primary hover:bg-primary/90 flex h-8 flex-[2] items-center justify-center gap-2 rounded-lg text-[10px] font-bold text-white transition-all disabled:opacity-50"
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
      <div className="border-border bg-sidebar/30 border-t p-4">
        <div className="grid grid-cols-2 gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <button className="bg-muted/40 border-border hover:bg-muted group flex items-center gap-3 rounded-xl border p-3 transition-colors">
                <Type className="text-primary size-3.5 transition-transform group-hover:scale-110" />
                <div className="flex translate-y-[1px] flex-col items-start">
                  <span className="text-muted-foreground text-[9px] font-black tracking-tighter uppercase">
                    Font
                  </span>
                  <span className="text-foreground text-[11px] leading-none font-bold">
                    {appliedTheme?.cssVars?.fontSans?.split(",")[0] || "Inter"}
                  </span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="bg-popover border-border z-50 w-48 overflow-hidden rounded-xl p-1 shadow-lg">
              <div className="border-border bg-muted/40 border-b p-2">
                <span className="text-primary text-[10px] font-black tracking-widest uppercase">
                  Select Font
                </span>
              </div>
              {[
                { name: "Inter", value: "'Inter', sans-serif" },
                { name: "Outfit", value: "'Outfit', sans-serif" },
                {
                  name: "Plus Jakarta",
                  value: "'Plus Jakarta Sans', sans-serif",
                },
                {
                  name: "JetBrains Mono",
                  value: "'JetBrains Mono', monospace",
                },
              ].map((font) => (
                <button
                  key={font.name}
                  onClick={() => {
                    if (appliedTheme) {
                      onApplyTheme({
                        ...appliedTheme,
                        cssVars: {
                          ...appliedTheme.cssVars,
                          fontSans: font.value,
                        },
                      });
                    }
                  }}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-[11px] transition-all",
                    appliedTheme?.cssVars?.fontSans === font.value
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {font.name}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <button className="bg-muted/40 border-border hover:bg-muted group flex items-center gap-3 rounded-xl border p-3 transition-colors">
                <Box className="text-primary size-3.5 transition-transform group-hover:scale-110" />
                <div className="flex translate-y-[1px] flex-col items-start">
                  <span className="text-muted-foreground text-[9px] font-black tracking-tighter uppercase">
                    Radius
                  </span>
                  <span className="text-foreground text-[11px] leading-none font-bold">
                    {appliedTheme?.cssVars?.radius || "0.5rem"}
                  </span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="bg-popover border-border z-50 w-48 overflow-hidden rounded-xl p-1 shadow-lg">
              <div className="border-border bg-muted/40 border-b p-2">
                <span className="text-primary text-[10px] font-black tracking-widest uppercase">
                  Select Radius
                </span>
              </div>
              {[
                { name: "None", value: "0rem" },
                { name: "Sharp", value: "0.25rem" },
                { name: "Modern", value: "0.5rem" },
                { name: "Curvy", value: "0.9rem" },
                { name: "Round", value: "1.5rem" },
              ].map((rad) => (
                <button
                  key={rad.name}
                  onClick={() => {
                    if (appliedTheme) {
                      onApplyTheme({
                        ...appliedTheme,
                        cssVars: { ...appliedTheme.cssVars, radius: rad.value },
                      });
                    }
                  }}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-[11px] transition-all",
                    appliedTheme?.cssVars?.radius === rad.value
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
