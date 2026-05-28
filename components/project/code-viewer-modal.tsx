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
        "group relative flex h-[95vh] w-[98vw] flex-col items-stretch shadow-2xl transition-all duration-300",
        resolvedTheme === "light" ? "border-border border" : "border-none",
      )}
    >
      {/* Floating Controls - Top Right, Minimal */}
      <div className="absolute top-4 right-4 z-[100] flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-9 rounded-xl transition-all active:scale-90",
            hasCopied
              ? "bg-emerald-500/10 text-emerald-500"
              : "text-foreground/70 hover:text-foreground hover:bg-muted/20",
          )}
          onClick={handleCopy}
          title="Copy Code"
        >
          {hasCopied ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-9 rounded-xl transition-all active:scale-90"
          onClick={onClose}
          title="Close"
        >
          <X className="size-6" />
        </Button>
      </div>

      <div className="relative min-h-0 flex-1 scrollbar-none overflow-hidden rounded-2xl bg-[#1e1e1e]">
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
          className="h-full text-[14px]"
        />
      </div>
    </CustomModal>
  );
}
