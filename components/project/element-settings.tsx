/** @jsxImportSource react */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, RotateCcw, Copy, Check, Type, Move, Palette, Box, AlignLeft, AlignCenter, AlignRight, Layout, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  selectedEl: HTMLElement | null;
  setSelectedEl: (el: HTMLElement | null) => void;
  clearSelection: () => void;
  onUpdate: () => void;
};

type Align = "left" | "center" | "right";

const fontSizes = Array.from({ length: 12 }, (_, i) => 12 + i * 4); // 12..56
const fontWeights = ["100", "200", "300", "400", "500", "600", "700", "800", "900"];
const lineHeights = ["normal", "1", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.8", "2"];

export function ElementSettings({ selectedEl, setSelectedEl, clearSelection, onUpdate }: Props) {
  const [classes, setClasses] = useState<string[]>([]);
  const [newClass, setNewClass] = useState<string>("");
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
  const [borderWidth, setBorderWidth] = useState<string>("");
  const [borderColor, setBorderColor] = useState<string>("#e2e8f0");
  const [borderStyle, setBorderStyle] = useState<string>("none");
  const [display, setDisplay] = useState<string>("block");
  const [flexDirection, setFlexDirection] = useState<string>("row");
  const [justifyContent, setJustifyContent] = useState<string>("flex-start");
  const [alignItems, setAlignItems] = useState<string>("stretch");
  const [gap, setGap] = useState<string>("");
  const [zIndex, setZIndex] = useState<string>("");
  const [textContent, setTextContent] = useState<string>("");
  const [opacity, setOpacity] = useState<string>("1");
  const [boxShadow, setBoxShadow] = useState<string>("");
  const [initialInlineStyle, setInitialInlineStyle] = useState<string>("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const label = useMemo(() => {
    if (!selectedEl) return "";
    return selectedEl.tagName.toLowerCase();
  }, [selectedEl]);

  const debouncedUpdate = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        onUpdate();
      }, 300);
    };
  }, [onUpdate]);

  const applyStyle = (property: string, value: string) => {
    if (!selectedEl) return;
    if (value === "") {
      selectedEl.style.removeProperty(property);
    } else {
      selectedEl.style[property as any] = value;
    }
    debouncedUpdate();
  };

  const syncFromElement = (el: HTMLElement) => {
    const computed = getComputedStyle(el);
    setAlign((el.style.textAlign as Align) || (computed.textAlign as Align) || "left");
    setFontSize(el.style.fontSize || computed.fontSize || "16px");
    setFontWeight(el.style.fontWeight || computed.fontWeight || "400");
    setLineHeight(el.style.lineHeight || computed.lineHeight || "1.4");
    
    const toHex = (rgb: string) => {
        if (!rgb || rgb === "transparent") return "#000000";
        const res = rgb.match(/\d+/g);
        if (!res || res.length < 3) return "#000000";
        return "#" + res.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    };

    setColor(toHex(el.style.color || computed.color));
    setBackground(toHex(el.style.backgroundColor || computed.backgroundColor));
    setBorderRadius(el.style.borderRadius || (computed.borderRadius !== '0px' ? computed.borderRadius : ""));
    setPadding(el.style.padding || "");
    setMargin(el.style.margin || "");
    setWidth(el.style.width || "");
    setHeight(el.style.height || "");
    setBorderWidth(el.style.borderWidth || (computed.borderWidth !== '0px' ? computed.borderWidth : ""));
    setBorderStyle(el.style.borderStyle || computed.borderStyle || "none");
    setBorderColor(toHex(el.style.borderColor || computed.borderColor));
    setDisplay(el.style.display || computed.display || "block");
    setFlexDirection(el.style.flexDirection || computed.flexDirection || "row");
    setJustifyContent(el.style.justifyContent || computed.justifyContent || "flex-start");
    setAlignItems(el.style.alignItems || computed.alignItems || "stretch");
    setGap(el.style.gap || "");
    setZIndex(el.style.zIndex || computed.zIndex || "");
    setOpacity(el.style.opacity || computed.opacity || "1");
    setBoxShadow(el.style.boxShadow || (computed.boxShadow !== 'none' ? computed.boxShadow : ""));
    setTextContent(el.textContent || "");
    setInitialInlineStyle(el.getAttribute("style") || "");
  };

  useEffect(() => {
    if (!selectedEl) return;
    syncFromElement(selectedEl);
  }, [selectedEl]);

  useEffect(() => {
    if (!selectedEl) return;
    const observer = new MutationObserver(() => {
      const classNameStr = typeof selectedEl.className === 'string' ? selectedEl.className : (selectedEl.className as any)?.baseVal || '';
      setClasses(classNameStr.split(" ").filter(Boolean));
    });
    observer.observe(selectedEl, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [selectedEl]);

  const selectParent = () => {
    if (selectedEl?.parentElement && selectedEl.parentElement !== selectedEl.ownerDocument.body) {
        const parent = selectedEl.parentElement;
        selectedEl.classList.remove('edit-selected-highlight');
        parent.classList.add('edit-selected-highlight');
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
        clone.classList.remove('edit-selected-highlight');
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

  if (!selectedEl) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4 text-zinc-500">
        <div className="size-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Move className="size-6 opacity-20" />
        </div>
        <div className="space-y-1">
            <p className="text-sm font-bold text-zinc-300">No element selected</p>
            <p className="text-[11px] leading-relaxed">Click any component in the preview to adjust its properties.</p>
        </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-zinc-950 animate-in fade-in duration-300">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
        <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Properties</span>
            <span className="text-[13px] font-bold text-zinc-100 truncate max-w-[180px]">{label}</span>
        </div>
        <Button onClick={clearSelection} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5">
            <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-6">
        <div className="flex gap-2 p-2 bg-zinc-900/30 rounded-xl border border-white/5">
            <button onClick={selectParent} className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all">
                <Move className="size-3.5" />
                <span className="text-[9px] font-bold uppercase">Parent</span>
            </button>
            <button onClick={duplicateElement} className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all">
                <Copy className="size-3.5" />
                <span className="text-[9px] font-bold uppercase">Clone</span>
            </button>
            <button onClick={deleteElement} className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-red-900/20 text-zinc-500 hover:text-red-400 transition-all">
                <Trash2 className="size-3.5" />
                <span className="text-[9px] font-bold uppercase">Delete</span>
            </button>
            <button onClick={resetInlineStyles} className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all">
                <RotateCcw className="size-3.5" />
                <span className="text-[9px] font-bold uppercase">Reset</span>
            </button>
        </div>

        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Type className="size-3.5 text-zinc-500" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Typography</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Size</label>
                    <select
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200"
                        value={fontSize}
                        onChange={(e) => { setFontSize(e.target.value); applyStyle("fontSize", e.target.value); }}
                    >
                        {fontSizes.map((size) => <option key={size} value={`${size}px`}>{size}px</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Weight</label>
                    <select
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200"
                        value={fontWeight}
                        onChange={(e) => { setFontWeight(e.target.value); applyStyle("fontWeight", e.target.value); }}
                    >
                        {fontWeights.map((weight) => <option key={weight} value={weight}>{weight}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Line Height</label>
                    <select
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200"
                        value={lineHeight}
                        onChange={(e) => { setLineHeight(e.target.value); applyStyle("lineHeight", e.target.value); }}
                    >
                        {lineHeights.map((lh) => <option key={lh} value={lh}>{lh}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Alignment</label>
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
                        {(["left", "center", "right"] as Align[]).map((dir) => (
                            <button
                                key={dir}
                                onClick={() => { setAlign(dir); applyStyle("textAlign", dir); }}
                                className={cn("flex-1 flex items-center justify-center rounded-lg p-1.5 transition-all", align === dir ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}
                            >
                                {dir === "left" ? <AlignLeft className="size-3.5" /> : dir === "center" ? <AlignCenter className="size-3.5" /> : <AlignRight className="size-3.5" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Palette className="size-3.5 text-zinc-500" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Colors</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Text</label>
                    <div className="relative">
                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={color} onInput={(e) => { const val = (e.target as HTMLInputElement).value; setColor(val); applyStyle("color", val); }} />
                        <div className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center px-3 gap-2">
                            <div className="size-4 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                            <span className="text-[10px] font-mono text-zinc-400 uppercase">{color}</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Background</label>
                    <div className="relative">
                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={background} onInput={(e) => { const val = (e.target as HTMLInputElement).value; setBackground(val); applyStyle("backgroundColor", val); }} />
                        <div className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center px-3 gap-2">
                            <div className="size-4 rounded-full border border-white/10" style={{ backgroundColor: background }} />
                            <span className="text-[10px] font-mono text-zinc-400 uppercase">{background}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Layout className="size-3.5 text-zinc-500" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Layout</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Width</label>
                    <input type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200" value={width} onChange={(e) => { setWidth(e.target.value); applyStyle("width", e.target.value); }} placeholder="auto" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Height</label>
                    <input type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200" value={height} onChange={(e) => { setHeight(e.target.value); applyStyle("height", e.target.value); }} placeholder="auto" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Padding</label>
                    <input type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200" value={padding} onChange={(e) => { setPadding(e.target.value); applyStyle("padding", e.target.value); }} placeholder="0px" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Margin</label>
                    <input type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200" value={margin} onChange={(e) => { setMargin(e.target.value); applyStyle("margin", e.target.value); }} placeholder="0px" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Display</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200" value={display} onChange={(e) => { setDisplay(e.target.value); applyStyle("display", e.target.value); }}>
                        <option value="block">Block</option>
                        <option value="flex">Flex</option>
                        <option value="inline-block">Inline-Block</option>
                        <option value="grid">Grid</option>
                        <option value="none">Hidden</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Z-Index</label>
                    <input type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200" value={zIndex} onChange={(e) => { setZIndex(e.target.value); applyStyle("zIndex", e.target.value); }} placeholder="auto" />
                </div>
            </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2">
                <Box className="size-3.5 text-zinc-500" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Borders & Effects</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Radius</label>
                    <input type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200" value={borderRadius} onChange={(e) => { setBorderRadius(e.target.value); applyStyle("borderRadius", e.target.value); }} placeholder="0px" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Opacity</label>
                    <input type="range" min="0" max="1" step="0.1" className="w-full accent-indigo-500 mt-2" value={opacity} onChange={(e) => { setOpacity(e.target.value); applyStyle("opacity", e.target.value); }} />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 ml-1">Shadow</label>
                <input type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200" value={boxShadow} onChange={(e) => { setBoxShadow(e.target.value); applyStyle("boxShadow", e.target.value); }} placeholder="none" />
            </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2">
                <Type className="size-3.5 text-zinc-500" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Content</span>
            </div>
            <div className="space-y-1.5">
                <textarea
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
                    value={textContent}
                    onChange={(e) => {
                        setTextContent(e.target.value);
                        if (selectedEl) {
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
