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

export function CodeViewerModal({ isOpen, onClose, code, title }: CodeViewerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-[90vw] h-[90vh] bg-[#1e1e1e] rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
          >
             <header className="flex items-center justify-between px-8 py-4 bg-[#252526] border-b border-white/5 h-16">
                 <div className="flex items-center gap-4">
                     <div className="flex gap-2">
                         <div className="size-3 rounded-full bg-red-500" />
                         <div className="size-3 rounded-full bg-amber-500" />
                         <div className="size-3 rounded-full bg-emerald-500" />
                     </div>
                     <span className="text-zinc-400 font-bold text-sm uppercase tracking-widest ml-4 flex items-center gap-2">
                        <Code className="size-4 text-indigo-400" />
                        {title} source
                     </span>
                 </div>
                 
                 <div className="flex items-center gap-3">
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-10 w-10 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
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
                       className="h-10 w-10 text-zinc-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-all"
                       onClick={onClose}
                       title="Close"
                     >
                         <X className="h-6 w-6" />
                     </Button>
                 </div>
             </header>
             
             <div className="flex-1 w-full bg-[#1e1e1e]">
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
                         lineNumbers: 'on',
                         renderLineHighlight: 'all',
                         cursorStyle: 'line',
                         fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
                     }}
                 />
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
