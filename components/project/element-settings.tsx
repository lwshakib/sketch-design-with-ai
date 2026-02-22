/** @jsxImportSource react */
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  RotateCcw,
  Copy,
  Type,
  Move,
  Palette,
  Box,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layout,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  selectedEl: HTMLElement | null;
  setSelectedEl: (el: HTMLElement | null) => void;
  onUpdate: () => void;
};

type Align = "left" | "center" | "right";

const fontSizes = Array.from({ length: 12 }, (_, i) => 12 + i * 4); // 12..56
const fontWeights = [
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
];
const lineHeights = [
  "normal",
  "1",
  "1.1",
  "1.2",
  "1.3",
  "1.4",
  "1.5",
  "1.6",
  "1.8",
  "2",
];

export function ElementSettings({
  selectedEl,
  setSelectedEl,
  onUpdate,
}: Props) {
  const [_classes, setClasses] = useState<string[]>([]);
  const [_newClass, _setNewClass] = useState<string>("");
  const [align, setAlign] = useState<Align>("left");
  const [fontSize, setFontSize] = useState<string>("16px");
  const [fontWeight, setFontWeight] = useState<string>("400");
  const [lineHeight, setLineHeight] = useState<string>("1.4");
  const [color, setColor] = useState<string>("#ffffff");
  const [background, setBackground] = useState<string>("#000000");
  const [borderRadius, setBorderRadius] = useState<string>("");
  const [padding, setPadding] = useState<string>("");
  const [margin, setMargin] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [_borderWidth, setBorderWidth] = useState<string>("");
  const [_borderColor, setBorderColor] = useState<string>("#e2e8f0");
  const [_borderStyle, setBorderStyle] = useState<string>("none");
  const [display, setDisplay] = useState<string>("block");
  const [_flexDirection, setFlexDirection] = useState<string>("row");
  const [_justifyContent, setJustifyContent] = useState<string>("flex-start");
  const [_alignItems, setAlignItems] = useState<string>("stretch");
  const [_gap, setGap] = useState<string>("");
  const [zIndex, setZIndex] = useState<string>("");
  const [textContent, setTextContent] = useState<string>("");
  const [opacity, setOpacity] = useState<string>("1");
  const [boxShadow, setBoxShadow] = useState<string>("");
  const [initialInlineStyle, setInitialInlineStyle] = useState<string>("");
  const [_copyState, _setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  const label = useMemo(() => {
    if (!selectedEl) return "";
    return selectedEl.tagName.toLowerCase();
  }, [selectedEl]);

  const timeoutRef = React.useRef<NodeJS.Timeout>(null);
  const debouncedUpdate = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onUpdate();
    }, 300);
  }, [onUpdate]);

  const applyStyle = (property: string, value: string) => {
    const el = selectedEl;
    if (!el) return;
    const style = el.style;
    if (value === "") {
      style.removeProperty(property);
    } else {
      // eslint-disable-next-line react-hooks/immutability
      (style as any)[property] = value;
    }
    debouncedUpdate();
  };

  const syncFromElement = useCallback((el: HTMLElement) => {
    const computed = getComputedStyle(el);
    setAlign(
      (el.style.textAlign as Align) || (computed.textAlign as Align) || "left",
    );
    setFontSize(el.style.fontSize || computed.fontSize || "16px");
    setFontWeight(el.style.fontWeight || computed.fontWeight || "400");
    setLineHeight(el.style.lineHeight || computed.lineHeight || "1.4");

    const toHex = (rgb: string) => {
      if (!rgb || rgb === "transparent") return "#000000";
      const res = rgb.match(/\d+/g);
      if (!res || res.length < 3) return "#000000";
      return (
        "#" +
        res
          .slice(0, 3)
          .map((x) => parseInt(x).toString(16).padStart(2, "0"))
          .join("")
      );
    };

    setColor(toHex(el.style.color || computed.color));
    setBackground(toHex(el.style.backgroundColor || computed.backgroundColor));
    setBorderRadius(
      el.style.borderRadius ||
        (computed.borderRadius !== "0px" ? computed.borderRadius : ""),
    );
    setPadding(el.style.padding || "");
    setMargin(el.style.margin || "");
    setWidth(el.style.width || "");
    setHeight(el.style.height || "");
    setBorderWidth(
      el.style.borderWidth ||
        (computed.borderWidth !== "0px" ? computed.borderWidth : ""),
    );
    setBorderStyle(el.style.borderStyle || computed.borderStyle || "none");
    setBorderColor(toHex(el.style.borderColor || computed.borderColor));
    setDisplay(el.style.display || computed.display || "block");
    setFlexDirection(el.style.flexDirection || computed.flexDirection || "row");
    setJustifyContent(
      el.style.justifyContent || computed.justifyContent || "flex-start",
    );
    setAlignItems(el.style.alignItems || computed.alignItems || "stretch");
    setGap(el.style.gap || "");
    setZIndex(el.style.zIndex || computed.zIndex || "");
    setOpacity(el.style.opacity || computed.opacity || "1");
    setBoxShadow(
      el.style.boxShadow ||
        (computed.boxShadow !== "none" ? computed.boxShadow : ""),
    );
    setTextContent(el.textContent || "");
    setInitialInlineStyle(el.getAttribute("style") || "");
  }, []);

  useEffect(() => {
    if (!selectedEl) return;
    syncFromElement(selectedEl);
  }, [selectedEl, syncFromElement]);

  useEffect(() => {
    if (!selectedEl) return;
    const observer = new MutationObserver(() => {
      const classNameStr =
        typeof selectedEl.className === "string"
          ? selectedEl.className
          : (selectedEl.className as any)?.baseVal || "";
      setClasses(classNameStr.split(" ").filter(Boolean));
    });
    observer.observe(selectedEl, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [selectedEl]);

  const selectParent = () => {
    if (
      selectedEl?.parentElement &&
      selectedEl.parentElement !== selectedEl.ownerDocument.body
    ) {
      const parent = selectedEl.parentElement;
      selectedEl.classList.remove("edit-selected-highlight");
      parent.classList.add("edit-selected-highlight");
      setSelectedEl(parent);
    }
  };

  const deleteElement = () => {
    if (selectedEl) {
      selectedEl.remove();
      setSelectedEl(null);
      onUpdate();
    }
  };

  const duplicateElement = () => {
    if (selectedEl) {
      const clone = selectedEl.cloneNode(true) as HTMLElement;
      clone.classList.remove("edit-selected-highlight");
      selectedEl.after(clone);
      onUpdate();
    }
  };

  const resetInlineStyles = () => {
    if (!selectedEl) return;
    selectedEl.setAttribute("style", initialInlineStyle);
    syncFromElement(selectedEl);
    onUpdate();
  };

  if (!selectedEl)
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="bg-muted border-border flex size-16 items-center justify-center rounded-full border">
          <Move className="size-6 opacity-20" />
        </div>
        <div className="space-y-1">
          <p className="text-foreground text-sm font-bold">
            No element selected
          </p>
          <p className="text-[11px] leading-relaxed">
            Click any component in the preview to adjust its properties.
          </p>
        </div>
      </div>
    );

  return (
    <div className="bg-sidebar animate-in fade-in flex h-full flex-col duration-300">
      <div className="border-border bg-sidebar/50 flex items-center justify-between border-b p-4">
        <div className="flex flex-col">
          <span className="text-primary mb-0.5 text-[10px] font-black tracking-widest uppercase">
            Properties
          </span>
          <span className="text-foreground max-w-[180px] truncate text-[13px] font-bold">
            {label}
          </span>
        </div>
      </div>

      <div className="scrollbar-hide flex-1 space-y-6 overflow-y-auto p-4">
        <div className="bg-muted/30 border-border flex gap-2 rounded-xl border p-2">
          <button
            onClick={selectParent}
            className="hover:bg-muted text-muted-foreground hover:text-foreground flex flex-1 flex-col items-center gap-1.5 rounded-lg p-2 transition-all"
          >
            <Move className="size-3.5" />
            <span className="text-[9px] font-bold uppercase">Parent</span>
          </button>
          <button
            onClick={duplicateElement}
            className="hover:bg-muted text-muted-foreground hover:text-foreground flex flex-1 flex-col items-center gap-1.5 rounded-lg p-2 transition-all"
          >
            <Copy className="size-3.5" />
            <span className="text-[9px] font-bold uppercase">Clone</span>
          </button>
          <button
            onClick={deleteElement}
            className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex flex-1 flex-col items-center gap-1.5 rounded-lg p-2 transition-all"
          >
            <Trash2 className="size-3.5" />
            <span className="text-[9px] font-bold uppercase">Delete</span>
          </button>
          <button
            onClick={resetInlineStyles}
            className="hover:bg-muted text-muted-foreground hover:text-foreground flex flex-1 flex-col items-center gap-1.5 rounded-lg p-2 transition-all"
          >
            <RotateCcw className="size-3.5" />
            <span className="text-[9px] font-bold uppercase">Reset</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="mb-2 flex items-center gap-2">
            <Type className="text-muted-foreground size-3.5" />
            <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              Typography
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-muted-foreground ml-1 text-[11px] font-bold">
                Size
              </label>
              <select
                className="bg-muted/50 border-input text-foreground focus:ring-primary/20 w-full rounded-xl border p-2 text-xs focus:ring-1 focus:outline-none"
                value={fontSize}
                onChange={(e) => {
                  setFontSize(e.target.value);
                  applyStyle("fontSize", e.target.value);
                }}
              >
                {fontSizes.map((size) => (
                  <option key={size} value={`${size}px`}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground ml-1 text-[11px] font-bold">
                Weight
              </label>
              <select
                className="bg-muted/50 border-input text-foreground focus:ring-primary/20 w-full rounded-xl border p-2 text-xs focus:ring-1 focus:outline-none"
                value={fontWeight}
                onChange={(e) => {
                  setFontWeight(e.target.value);
                  applyStyle("fontWeight", e.target.value);
                }}
              >
                {fontWeights.map((weight) => (
                  <option key={weight} value={weight}>
                    {weight}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-muted-foreground ml-1 text-[11px] font-bold">
                Line Height
              </label>
              <select
                className="bg-muted/50 border-input text-foreground focus:ring-primary/20 w-full rounded-xl border p-2 text-xs focus:ring-1 focus:outline-none"
                value={lineHeight}
                onChange={(e) => {
                  setLineHeight(e.target.value);
                  applyStyle("lineHeight", e.target.value);
                }}
              >
                {lineHeights.map((lh) => (
                  <option key={lh} value={lh}>
                    {lh}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground ml-1 text-[11px] font-bold">
                Alignment
              </label>
              <div className="bg-muted/50 border-input flex gap-1 rounded-xl border p-1">
                {(["left", "center", "right"] as Align[]).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => {
                      setAlign(dir);
                      applyStyle("textAlign", dir);
                    }}
                    className={cn(
                      "text-muted-foreground hover:text-foreground flex flex-1 items-center justify-center rounded-lg p-1.5 transition-all",
                      align === dir
                        ? "bg-background text-foreground font-medium shadow-sm"
                        : "hover:bg-background/50",
                    )}
                  >
                    {dir === "left" ? (
                      <AlignLeft className="size-3.5" />
                    ) : dir === "center" ? (
                      <AlignCenter className="size-3.5" />
                    ) : (
                      <AlignRight className="size-3.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="mb-2 flex items-center gap-2">
            <Palette className="text-muted-foreground size-3.5" />
            <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              Colors
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-muted-foreground ml-1 text-[11px] font-bold">
                Text
              </label>
              <div className="relative">
                <input
                  type="color"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  value={color}
                  onInput={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    setColor(val);
                    applyStyle("color", val);
                  }}
                />
                <div className="bg-muted/50 border-input flex h-9 w-full items-center gap-2 rounded-xl border px-3">
                  <div
                    className="border-border size-4 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-muted-foreground font-mono text-[10px] uppercase">
                    {color}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground ml-1 text-[11px] font-bold">
                Background
              </label>
              <div className="relative">
                <input
                  type="color"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  value={background}
                  onInput={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    setBackground(val);
                    applyStyle("backgroundColor", val);
                  }}
                />
                <div className="bg-muted/50 border-input flex h-9 w-full items-center gap-2 rounded-xl border px-3">
                  <div
                    className="border-border size-4 rounded-full border"
                    style={{ backgroundColor: background }}
                  />
                  <span className="text-muted-foreground font-mono text-[10px] uppercase">
                    {background}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="mb-2 flex items-center gap-2">
            <Layout className="text-muted-foreground size-3.5" />
            <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              Layout
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-muted-foreground ml-1 text-[11px] font-bold">
                Width
              </label>
              <input
                type="text"
                className="bg-muted/50 border-input text-foreground focus:ring-primary/20 w-full rounded-xl border p-2 text-xs focus:ring-1 focus:outline-none"
                value={width}
                onChange={(e) => {
                  setWidth(e.target.value);
                  applyStyle("width", e.target.value);
                }}
                placeholder="auto"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground ml-1 text-[11px] font-bold">
                Height
              </label>
              <input
                type="text"
                className="bg-muted/50 border-input text-foreground focus:ring-primary/20 w-full rounded-xl border p-2 text-xs focus:ring-1 focus:outline-none"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  applyStyle("height", e.target.value);
                }}
                placeholder="auto"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-muted-foreground ml-1 text-[11px] font-bold">
                Padding
              </label>
              <input
                type="text"
                className="bg-muted/50 border-input text-foreground focus:ring-primary/20 w-full rounded-xl border p-2 text-xs focus:ring-1 focus:outline-none"
                value={padding}
                onChange={(e) => {
                  setPadding(e.target.value);
                  applyStyle("padding", e.target.value);
                }}
                placeholder="0px"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground ml-1 text-[11px] font-bold">
                Margin
              </label>
              <input
                type="text"
                className="bg-muted/50 border-input text-foreground focus:ring-primary/20 w-full rounded-xl border p-2 text-xs focus:ring-1 focus:outline-none"
                value={margin}
                onChange={(e) => {
                  setMargin(e.target.value);
                  applyStyle("margin", e.target.value);
                }}
                placeholder="0px"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-muted-foreground ml-1 text-[11px] font-bold">
                Display
              </label>
              <select
                className="bg-muted/50 border-input text-foreground focus:ring-primary/20 w-full rounded-xl border p-2 text-xs focus:ring-1 focus:outline-none"
                value={display}
                onChange={(e) => {
                  setDisplay(e.target.value);
                  applyStyle("display", e.target.value);
                }}
              >
                <option value="block">Block</option>
                <option value="flex">Flex</option>
                <option value="inline-block">Inline-Block</option>
                <option value="grid">Grid</option>
                <option value="none">Hidden</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground ml-1 text-[11px] font-bold">
                Z-Index
              </label>
              <input
                type="text"
                className="bg-muted/50 border-input text-foreground focus:ring-primary/20 w-full rounded-xl border p-2 text-xs focus:ring-1 focus:outline-none"
                value={zIndex}
                onChange={(e) => {
                  setZIndex(e.target.value);
                  applyStyle("zIndex", e.target.value);
                }}
                placeholder="auto"
              />
            </div>
          </div>
        </div>

        <div className="border-border space-y-4 border-t pt-2">
          <div className="mb-2 flex items-center gap-2">
            <Box className="text-muted-foreground size-3.5" />
            <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              Borders & Effects
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-muted-foreground ml-1 text-[11px] font-bold">
                Radius
              </label>
              <input
                type="text"
                className="bg-muted/50 border-input text-foreground focus:ring-primary/20 w-full rounded-xl border p-2 text-xs focus:ring-1 focus:outline-none"
                value={borderRadius}
                onChange={(e) => {
                  setBorderRadius(e.target.value);
                  applyStyle("borderRadius", e.target.value);
                }}
                placeholder="0px"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground ml-1 text-[11px] font-bold">
                Opacity
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                className="accent-primary mt-2 w-full"
                value={opacity}
                onChange={(e) => {
                  setOpacity(e.target.value);
                  applyStyle("opacity", e.target.value);
                }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-muted-foreground ml-1 text-[11px] font-bold">
              Shadow
            </label>
            <input
              type="text"
              className="bg-muted/50 border-input text-foreground focus:ring-primary/20 w-full rounded-xl border p-2 text-xs focus:ring-1 focus:outline-none"
              value={boxShadow}
              onChange={(e) => {
                setBoxShadow(e.target.value);
                applyStyle("boxShadow", e.target.value);
              }}
              placeholder="none"
            />
          </div>
        </div>

        <div className="border-border space-y-4 border-t pt-2">
          <div className="mb-2 flex items-center gap-2">
            <Type className="text-muted-foreground size-3.5" />
            <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              Content
            </span>
          </div>
          <div className="space-y-1.5">
            <textarea
              rows={3}
              className="bg-muted/50 border-input text-foreground focus:ring-primary/20 w-full resize-none rounded-xl border p-3 text-xs focus:ring-1 focus:outline-none"
              value={textContent}
              onChange={(e) => {
                if (selectedEl) {
                  setTextContent(e.target.value);
                  // eslint-disable-next-line react-hooks/immutability
                  selectedEl.textContent = e.target.value;
                  debouncedUpdate();
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
