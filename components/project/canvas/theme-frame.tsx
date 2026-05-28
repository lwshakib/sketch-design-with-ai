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
  Shapes,
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

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
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
  if (!bg || typeof bg !== "string") return true; // Default dark
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
function ColorRamp({
  label,
  hex,
  isDark,
}: {
  label: string;
  hex: string;
  isDark: boolean;
}) {
  const contrastColor = getContrastColor(hex);
  const { h, s } = hexToHsl(hex);

  // 10 steps of lightness to form the shade ramp
  const steps = [10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90];
  const cardBgClass = isDark
    ? "bg-[#141414] border-white/5 text-white"
    : "bg-white border-zinc-200/80 text-zinc-900 shadow-[0_6px_24px_rgba(0,0,0,0.02)]";

  return (
    <div
      className={`flex h-[74px] flex-col justify-between gap-1 rounded-[12px] border p-2 shadow-sm ${cardBgClass}`}
    >
      <div
        className="flex h-7 items-center justify-between rounded-md p-1.5 shadow-inner"
        style={{ backgroundColor: hex, color: contrastColor }}
      >
        <span className="text-[9px] font-bold tracking-wider uppercase">
          {label}
        </span>
        <span className="font-mono text-[7.5px] font-semibold uppercase opacity-80">
          {hex}
        </span>
      </div>

      <div
        className={`flex h-2.5 overflow-hidden rounded-sm border ${isDark ? "border-white/5" : "border-zinc-200/40"}`}
      >
        {steps.map((lightness, idx) => (
          <div
            key={idx}
            className="h-full flex-1"
            style={{ backgroundColor: `hsl(${h}, ${s}%, ${lightness}%)` }}
          />
        ))}
      </div>
    </div>
  );
}

export function ThemeFrame({ artifact }: ThemeFrameProps) {
  const variables = artifact.variables || {};
  const colors = {
    primary: variables?.colors?.primary || "#6366f1",
    secondary: variables?.colors?.secondary || "#ec4899",
    tertiary: variables?.colors?.tertiary || "#14b8a6",
    neutral: variables?.colors?.neutral || "#94a3b8",
    background: variables?.colors?.background || "#080808",
    foreground: variables?.colors?.foreground || "#ffffff",
  };
  const typography = variables.typography || {
    headline: "Inter",
    body: "Inter",
    label: "Inter",
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
      className="relative flex h-full w-full flex-col overflow-hidden font-sans select-none"
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
      }}
    >
      {/* Dot Grid Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Bento Grid */}
      <div className="grid h-full flex-1 grid-cols-4 gap-2.5 overflow-hidden p-4">
        {/* Column 1: Palette */}
        <div className="flex flex-col gap-2.5">
          <ColorRamp label="Primary" hex={colors.primary} isDark={isDark} />
          <ColorRamp label="Secondary" hex={colors.secondary} isDark={isDark} />
          <ColorRamp label="Tertiary" hex={colors.tertiary} isDark={isDark} />
          <ColorRamp label="Neutral" hex={colors.neutral} isDark={isDark} />
        </div>

        {/* Column 2: Typography & Structure */}
        <div className="flex flex-col gap-2.5">
          {/* Headline Card */}
          <div
            className={`flex h-[102px] flex-col justify-between rounded-[12px] border p-2.5 shadow-sm ${cardBgClass}`}
          >
            <div className="flex items-start justify-between">
              <span
                className={`text-[7.5px] font-bold tracking-widest uppercase ${textMutedClass}`}
              >
                Headline
              </span>
              <span
                className={`text-[9.5px] font-semibold ${textMutedLightClass}`}
              >
                {typography.headline}
              </span>
            </div>
            <div
              className="text-center text-4xl font-normal select-none"
              style={{ fontFamily: typography.headline }}
            >
              Aa
            </div>
          </div>

          {/* Body Text Card */}
          <div
            className={`flex h-[102px] flex-col justify-between rounded-[12px] border p-2.5 shadow-sm ${cardBgClass}`}
          >
            <div className="flex items-start justify-between">
              <span
                className={`text-[7.5px] font-bold tracking-widest uppercase ${textMutedClass}`}
              >
                Body
              </span>
              <span
                className={`text-[9.5px] font-semibold ${textMutedLightClass}`}
              >
                {typography.body}
              </span>
            </div>
            <div
              className="text-center text-4xl font-normal opacity-85 select-none"
              style={{ fontFamily: typography.body }}
            >
              Aa
            </div>
          </div>

          {/* Label Card */}
          <div
            className={`flex h-[102px] flex-col justify-between rounded-[12px] border p-2.5 shadow-sm ${cardBgClass}`}
          >
            <div className="flex items-start justify-between">
              <span
                className={`text-[7.5px] font-bold tracking-widest uppercase ${textMutedClass}`}
              >
                Label
              </span>
              <span
                className={`text-[9.5px] font-semibold ${textMutedLightClass}`}
              >
                {typography.label}
              </span>
            </div>
            <div
              className="text-center text-4xl font-normal opacity-70 select-none"
              style={{ fontFamily: typography.label }}
            >
              Aa
            </div>
          </div>
        </div>

        {/* Column 3: Components & UI Details */}
        <div className="flex flex-col gap-2.5">
          {/* Buttons Component */}
          <div
            className={`flex h-[102px] flex-col justify-center gap-2.5 rounded-[12px] border p-2.5 shadow-sm ${cardBgClass}`}
          >
            <div className="grid grid-cols-2 gap-1.5">
              <button
                className="flex w-full cursor-default items-center justify-center rounded-md py-1 text-[9px] font-bold shadow-sm transition-all"
                style={{
                  backgroundColor: colors.primary,
                  color: getContrastColor(colors.primary),
                }}
              >
                Primary
              </button>
              <button
                className={`flex w-full cursor-default items-center justify-center rounded-md py-1 text-[9px] font-bold ${isDark ? "bg-[#222] text-white" : "border border-zinc-200 bg-zinc-100 text-zinc-800"}`}
              >
                Secondary
              </button>
              <button
                className={`flex w-full cursor-default items-center justify-center rounded-md py-1 text-[9px] font-bold ${isDark ? "bg-white text-black" : "bg-black text-white"}`}
              >
                Inverted
              </button>
              <button
                className={`flex w-full cursor-default items-center justify-center rounded-md border py-1 text-[9px] font-bold ${isDark ? "border-white/20 text-white/80" : "border-zinc-300 text-zinc-700"}`}
              >
                Outlined
              </button>
            </div>
          </div>

          {/* Skeleton Content */}
          <div
            className={`flex h-[80px] flex-col justify-center gap-1.5 rounded-[12px] border p-2.5 shadow-sm ${cardBgClass}`}
          >
            <div className="space-y-1.5">
              <div
                className="h-1 w-full animate-pulse rounded-full"
                style={{ backgroundColor: colors.primary }}
              />
              <div
                className="h-1 w-[85%] animate-pulse rounded-full"
                style={{ backgroundColor: colors.secondary }}
              />
              <div
                className="h-1 w-[55%] animate-pulse rounded-full"
                style={{ backgroundColor: colors.tertiary }}
              />
            </div>
          </div>

          {/* Sub-components Grid */}
          <div className="grid h-[124px] grid-cols-2 gap-2.5">
            <div
              className={`flex items-center justify-center rounded-[12px] border p-2.5 shadow-sm ${cardBgClass}`}
            >
              <div
                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg shadow-md"
                style={{
                  backgroundColor: `${colors.tertiary}22`,
                  color: colors.tertiary,
                  border: `1px solid ${colors.tertiary}33`,
                }}
              >
                <Pencil size={14} />
              </div>
            </div>
            <div
              className={`flex items-center justify-center rounded-[12px] border p-2.5 shadow-sm ${cardBgClass}`}
            >
              <button
                className="flex cursor-default items-center gap-0.5 rounded-md px-2 py-1 text-[9px] font-bold shadow-md"
                style={{
                  backgroundColor: colors.primary,
                  color: getContrastColor(colors.primary),
                }}
              >
                <Pencil size={9} />
                <span>Label</span>
              </button>
            </div>
          </div>
        </div>

        {/* Column 4: Architecture */}
        <div className="flex flex-col gap-2.5">
          {/* Search Architecture */}
          <div
            className={`flex h-[80px] items-center justify-center rounded-[12px] border p-2.5 shadow-sm ${cardBgClass}`}
          >
            <div
              className={`flex w-full items-center gap-1.5 rounded-lg border px-2 py-1.5 ${subBgClass}`}
            >
              <Search
                size={11}
                className={`${isDark ? "text-zinc-500" : "text-zinc-400"}`}
              />
              <span
                className={`text-[9px] font-medium ${isDark ? "text-zinc-500" : "text-zinc-500"}`}
              >
                Search
              </span>
            </div>
          </div>

          {/* Navigation Pill */}
          <div
            className={`flex h-[102px] items-center justify-center rounded-[12px] border p-2.5 shadow-sm ${cardBgClass}`}
          >
            <div
              className={`flex h-8 items-center gap-3 rounded-full border px-2 shadow-inner ${subBgClass}`}
            >
              <div
                className="flex h-5.5 w-5.5 items-center justify-center rounded-full shadow-sm"
                style={{
                  backgroundColor: colors.primary,
                  color: getContrastColor(colors.primary),
                }}
              >
                <Home size={10} />
              </div>
              <Search
                size={10}
                className={`${isDark ? "text-zinc-500" : "text-zinc-400"}`}
              />
              <User
                size={10}
                className={`${isDark ? "text-zinc-500" : "text-zinc-400"}`}
              />
            </div>
          </div>

          {/* Icon Sets */}
          <div
            className={`flex h-[124px] items-center justify-center rounded-[12px] border p-2.5 shadow-sm ${cardBgClass}`}
          >
            <div className="flex gap-1">
              <div
                className="flex h-7 w-7 animate-bounce items-center justify-center rounded-full shadow-md"
                style={{
                  backgroundColor: `${colors.primary}22`,
                  color: colors.primary,
                  border: `1px solid ${colors.primary}33`,
                }}
              >
                <Sparkles size={12} />
              </div>
              <div
                className="flex h-7 w-7 animate-pulse items-center justify-center rounded-full shadow-md"
                style={{
                  backgroundColor: `${colors.secondary}22`,
                  color: colors.secondary,
                  border: `1px solid ${colors.secondary}33`,
                }}
              >
                <Shapes size={12} />
              </div>
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full shadow-md"
                style={{
                  backgroundColor: `${colors.tertiary}22`,
                  color: colors.tertiary,
                  border: `1px solid ${colors.tertiary}33`,
                }}
              >
                <Tag size={12} />
              </div>
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full shadow-md"
                style={{
                  backgroundColor: "#ef444422",
                  color: "#ef4444",
                  border: "1px solid #ef444433",
                }}
              >
                <Trash2 size={12} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
