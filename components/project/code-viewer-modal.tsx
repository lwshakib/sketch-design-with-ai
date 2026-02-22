"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, Files, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Editor } from "@monaco-editor/react";
import { toast } from "sonner";

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-8 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="flex h-[90vh] w-[90vw] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#1e1e1e] shadow-[0_0_100px_rgba(0,0,0,0.8)]"
          >
            <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#252526] px-8 py-4">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="size-3 rounded-full bg-red-500" />
                  <div className="size-3 rounded-full bg-amber-500" />
                  <div className="size-3 rounded-full bg-emerald-500" />
                </div>
                <span className="ml-4 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <Code className="size-3.5 text-indigo-400" />
                  {title} source
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    toast.success("Source code copied");
                  }}
                  title="Copy Code"
                >
                  <Files className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl text-zinc-400 transition-all hover:bg-red-500/20 hover:text-white"
                  onClick={onClose}
                  title="Close"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </header>

            <div className="w-full flex-1 bg-[#1e1e1e]">
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
