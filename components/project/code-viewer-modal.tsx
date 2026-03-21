"use client";

import React from "react";
import { Code, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

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
  title,
}: CodeViewerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[96vw] w-[96vw] h-[94vh] p-0 overflow-hidden border-border bg-card shadow-2xl z-[200] gap-0">
        <DialogHeader className="flex h-12 flex-row items-center justify-between border-b bg-muted/30 px-5 space-y-0">
          <div className="flex items-center gap-2.5">
            <Code className="size-4 text-primary" />
            <DialogTitle className="text-[13px] font-semibold text-foreground/80 tracking-tight">
              {title} Source
            </DialogTitle>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 rounded-lg px-2.5 text-[11.5px] font-semibold border-border/50 bg-background/50 hover:bg-muted transition-all"
              onClick={() => {
                navigator.clipboard.writeText(code);
                toast.success("Source code copied to clipboard", {
                   icon: <Copy className="size-3.5" />,
                   style: { background: "#18181b", color: "#fafafa", border: "1px solid #27272a" }
                });
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Code
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="w-full flex-1 overflow-auto bg-[#1e1e1e] scrollbar-none">
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
            className="text-[14px]"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
