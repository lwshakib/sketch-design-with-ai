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

  const artifact = variationsArtifactIndex !== null ? throttledArtifacts[variationsArtifactIndex] : null;

  const ASPECTS = [
    { id: 'layout', label: 'Layout' },
    { id: 'color', label: 'Color scheme' },
    { id: 'images', label: 'Images' },
    { id: 'font', label: 'Text font' },
    { id: 'content', label: 'Text content' },
  ];

  const toggleAspect = (id: string) => {
    setVariationAspects((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  return (
    <Sheet open={isVariationsSheetOpen} onOpenChange={setIsVariationsSheetOpen}>
      <SheetContent side="right" className="w-[360px] bg-[#0A0A0A] border-l border-white/5 p-0 flex flex-col z-[1000]">
        <SheetHeader className="p-5 border-b border-white/5">
          <SheetTitle className="text-lg font-bold text-white tracking-tight">Generate variations</SheetTitle>
          <SheetDescription className="text-zinc-500 text-xs font-medium">
            Create different versions of this design.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-hide">
          {/* Number of options */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-zinc-400">Number of options</Label>
            <div className="flex items-center h-10 bg-[#111] border border-white/5 rounded-xl overflow-hidden p-1 gap-1 w-[120px]">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVariationOptions((v) => Math.max(1, v - 1))}
                className="h-full w-8 hover:bg-white/5 text-zinc-500 hover:text-white transition-all rounded-lg"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="flex-1 text-center font-bold text-sm text-white">
                {variationOptions}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVariationOptions((v) => Math.min(10, v + 1))}
                className="h-full w-8 hover:bg-white/5 text-zinc-500 hover:text-white transition-all rounded-lg"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Creative range */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-zinc-400">Creative range</Label>
            <ToggleGroup
              type="single"
              value={variationCreativeRange}
              onValueChange={(v) => v && setVariationCreativeRange(v as any)}
              className="grid grid-cols-3 bg-[#111] border border-white/5 rounded-xl p-1 gap-1"
            >
              <ToggleGroupItem 
                value="refine" 
                className="rounded-lg h-8 text-xs font-semibold data-[state=on]:bg-zinc-800 data-[state=on]:text-white text-zinc-500 transition-all border-none"
              >
                Refine
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="explore" 
                className="rounded-lg h-8 text-xs font-semibold data-[state=on]:bg-zinc-800 data-[state=on]:text-white text-zinc-500 transition-all border-none"
              >
                Explore
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="reimagine" 
                className="rounded-lg h-8 text-xs font-semibold data-[state=on]:bg-zinc-800 data-[state=on]:text-white text-zinc-500 transition-all border-none"
              >
                Reimagine
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Custom instructions */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-zinc-400">Custom instructions (optional)</Label>
            <Textarea
              placeholder="e.g., Use a dark glassmorphism theme..."
              value={variationCustomInstructions}
              onChange={(e) => setVariationCustomInstructions(e.target.value)}
              className="min-h-[120px] bg-[#111] border border-white/5 rounded-2xl p-4 resize-none text-sm focus:ring-1 focus:ring-white/10 transition-all placeholder:text-zinc-700 leading-relaxed font-medium shadow-inner"
            />
          </div>

          {/* Aspects to vary */}
          <div className="space-y-4">
            <Label className="text-xs font-bold text-zinc-400 px-1">Aspects to change</Label>
            <div className="grid grid-cols-1 gap-1.5">
              {ASPECTS.map((aspect) => (
                <div 
                  key={aspect.id} 
                  className={cn(
                    "flex items-center justify-between p-3 px-4 rounded-xl transition-all cursor-pointer group",
                    variationAspects.includes(aspect.id) ? "bg-white/5" : "hover:bg-white/[0.02]"
                  )}
                  onClick={() => toggleAspect(aspect.id)}
                >
                  <label 
                    htmlFor={aspect.id}
                    className="text-sm font-medium text-zinc-400 cursor-pointer transition-colors group-hover:text-zinc-200"
                  >
                    {aspect.label}
                  </label>
                  <Checkbox 
                    id={aspect.id} 
                    checked={variationAspects.includes(aspect.id)}
                    onCheckedChange={() => toggleAspect(aspect.id)}
                    className="h-5 w-5 rounded-md border-zinc-800 data-[state=checked]:bg-white data-[state=checked]:text-black transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-[#0A0A0A]">
          <Button
            onClick={handleGenerateVariations}
            disabled={isGenerating || (variationAspects.length === 0 && !variationCustomInstructions.trim())}
            className="w-full h-10 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm transition-all disabled:opacity-50 shadow-lg"
          >
            {isGenerating ? "Generating..." : "Generate variations"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
