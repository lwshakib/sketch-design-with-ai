"use client";

import React, { useMemo, useState } from "react";
import { Code, Copy, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { CustomModal } from "./custom-modal";
import { cn } from "@/lib/utils";

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  title: string;
}

export function CodeViewerModal({
  isOpen,
  onClose,
  code,
  title: _title,
}: CodeViewerModalProps) {
  const { resolvedTheme } = useTheme();
  const [hasCopied, setHasCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setHasCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <CustomModal 
      isOpen={isOpen} 
      onClose={onClose} 
      className={cn(
        "w-[98vw] h-[95vh] flex flex-col items-stretch shadow-2xl relative group transition-all duration-300",
        resolvedTheme === "light" ? "border-border border" : "border-none"
      )}
    >
      {/* Floating Controls - Top Right, Minimal */}
      <div className="absolute top-4 right-4 z-[100] flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
             "size-9 rounded-xl transition-all active:scale-90",
             hasCopied ? "text-emerald-500 bg-emerald-500/10" : "text-foreground/70 hover:text-foreground hover:bg-muted/20"
          )}
          onClick={handleCopy}
          title="Copy Code"
        >
          {hasCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-9 rounded-xl text-muted-foreground hover:text-destructive transition-all hover:bg-destructive/10 active:scale-90"
          onClick={onClose}
          title="Close"
        >
          <X className="size-6" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 bg-[#1e1e1e] scrollbar-none relative overflow-hidden rounded-2xl">
        <CodeMirror
          value={code}
          height="100%"
          theme={vscodeDark}
          extensions={[html()]}
          readOnly={true}
          editable={false}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: false,
          }}
          className="text-[14px] h-full"
        />
      </div>
    </CustomModal>
  );
}
