"use client";

import React from "react";
import { Code, Files, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Editor } from "@monaco-editor/react";
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
      <DialogContent className="max-w-[92vw] w-[92vw] h-[92vh] p-0 overflow-hidden border-white/10 bg-[#1e1e1e] shadow-[0_0_100px_rgba(0,0,0,0.8)] z-[200]">
        <header className="flex h-14 items-center justify-between border-b border-white/5 bg-[#252526] px-6">
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-red-500/80" />
              <div className="size-2.5 rounded-full bg-amber-500/80" />
              <div className="size-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="ml-2 flex items-center gap-2 text-[11px] font-bold tracking-tight text-zinc-500 uppercase">
              <Code className="size-3.5 text-primary" />
              {title} source
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 rounded-lg px-3 text-zinc-400 text-[11px] font-bold hover:bg-white/5 hover:text-white"
              onClick={() => {
                navigator.clipboard.writeText(code);
                toast.success("Source code copied");
              }}
            >
              <Files className="h-3.5 w-3.5" />
              Copy
            </Button>
          </div>
        </header>

        <div className="w-full h-[calc(92vh-56px)] bg-[#1e1e1e]">
          <Editor
            height="100%"
            defaultLanguage="html"
            theme="vs-dark"
            value={code}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 20 },
              readOnly: true,
              lineNumbers: "on",
              renderLineHighlight: "all",
              cursorStyle: "line",
              fontFamily:
                "JetBrains Mono, Menlo, Monaco, Courier New, monospace",
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
