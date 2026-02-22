"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";
import { useProjectStore } from "@/hooks/use-project-store";
import { cn } from "@/lib/utils";

interface VariationsSheetProps {
  handleGenerateVariations: () => void;
}

export function VariationsSheet({
  handleGenerateVariations,
}: VariationsSheetProps) {
  const {
    isVariationsSheetOpen,
    setIsVariationsSheetOpen,
    variationsArtifactIndex,
    throttledArtifacts,
    variationOptions,
    setVariationOptions,
    variationCreativeRange,
    setVariationCreativeRange,
    variationCustomInstructions,
    setVariationCustomInstructions,
    variationAspects,
    setVariationAspects,
    isGenerating,
  } = useProjectStore();

  const _artifact =
    variationsArtifactIndex !== null
      ? throttledArtifacts[variationsArtifactIndex]
      : null;

  const ASPECTS = [
    { id: "layout", label: "Layout" },
    { id: "color", label: "Color scheme" },
    { id: "images", label: "Images" },
    { id: "font", label: "Text font" },
    { id: "content", label: "Text content" },
  ];

  const toggleAspect = (id: string) => {
    setVariationAspects((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  return (
    <Sheet open={isVariationsSheetOpen} onOpenChange={setIsVariationsSheetOpen}>
      <SheetContent
        side="right"
        className="z-[1000] flex w-[360px] flex-col border-l border-white/5 bg-[#0A0A0A] p-0"
      >
        <SheetHeader className="border-b border-white/5 p-5">
          <SheetTitle className="text-lg font-bold tracking-tight text-white">
            Generate variations
          </SheetTitle>
          <SheetDescription className="text-xs font-medium text-zinc-500">
            Create different versions of this design.
          </SheetDescription>
        </SheetHeader>

        <div className="scrollbar-hide flex-1 space-y-8 overflow-y-auto p-5">
          {/* Number of options */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-zinc-400">
              Number of options
            </Label>
            <div className="flex h-10 w-[120px] items-center gap-1 overflow-hidden rounded-xl border border-white/5 bg-[#111] p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVariationOptions((v) => Math.max(1, v - 1))}
                className="h-full w-8 rounded-lg text-zinc-500 transition-all hover:bg-white/5 hover:text-white"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="flex-1 text-center text-sm font-bold text-white">
                {variationOptions}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVariationOptions((v) => Math.min(10, v + 1))}
                className="h-full w-8 rounded-lg text-zinc-500 transition-all hover:bg-white/5 hover:text-white"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Creative range */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-zinc-400">
              Creative range
            </Label>
            <ToggleGroup
              type="single"
              value={variationCreativeRange}
              onValueChange={(v) => v && setVariationCreativeRange(v as any)}
              className="grid grid-cols-3 gap-1 rounded-xl border border-white/5 bg-[#111] p-1"
            >
              <ToggleGroupItem
                value="refine"
                className="h-8 rounded-lg border-none text-xs font-semibold text-zinc-500 transition-all data-[state=on]:bg-zinc-800 data-[state=on]:text-white"
              >
                Refine
              </ToggleGroupItem>
              <ToggleGroupItem
                value="explore"
                className="h-8 rounded-lg border-none text-xs font-semibold text-zinc-500 transition-all data-[state=on]:bg-zinc-800 data-[state=on]:text-white"
              >
                Explore
              </ToggleGroupItem>
              <ToggleGroupItem
                value="reimagine"
                className="h-8 rounded-lg border-none text-xs font-semibold text-zinc-500 transition-all data-[state=on]:bg-zinc-800 data-[state=on]:text-white"
              >
                Reimagine
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Custom instructions */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-zinc-400">
              Custom instructions (optional)
            </Label>
            <Textarea
              placeholder="e.g., Use a dark glassmorphism theme..."
              value={variationCustomInstructions}
              onChange={(e) => setVariationCustomInstructions(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerateVariations();
                }
              }}
              className="min-h-[120px] resize-none rounded-2xl border border-white/5 bg-[#111] p-4 text-sm leading-relaxed font-medium shadow-inner transition-all placeholder:text-zinc-700 focus:ring-1 focus:ring-white/10"
            />
          </div>

          {/* Aspects to vary */}
          <div className="space-y-4">
            <Label className="px-1 text-xs font-bold text-zinc-400">
              Aspects to change
            </Label>
            <div className="grid grid-cols-1 gap-1.5">
              {ASPECTS.map((aspect) => (
                <div
                  key={aspect.id}
                  className={cn(
                    "group flex cursor-pointer items-center justify-between rounded-xl p-3 px-4 transition-all",
                    variationAspects.includes(aspect.id)
                      ? "bg-white/5"
                      : "hover:bg-white/[0.02]",
                  )}
                  onClick={() => toggleAspect(aspect.id)}
                >
                  <label
                    htmlFor={aspect.id}
                    className="cursor-pointer text-sm font-medium text-zinc-400 transition-colors group-hover:text-zinc-200"
                  >
                    {aspect.label}
                  </label>
                  <Checkbox
                    id={aspect.id}
                    checked={variationAspects.includes(aspect.id)}
                    onCheckedChange={() => toggleAspect(aspect.id)}
                    className="h-5 w-5 rounded-md border-zinc-800 transition-all data-[state=checked]:bg-white data-[state=checked]:text-black"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 bg-[#0A0A0A] p-6">
          <Button
            onClick={handleGenerateVariations}
            disabled={
              isGenerating ||
              (variationAspects.length === 0 &&
                !variationCustomInstructions.trim())
            }
            className="h-10 w-full rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-950 shadow-lg transition-all hover:bg-white disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate variations"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
