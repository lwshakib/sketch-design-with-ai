"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  RotateCcw, 
  Sparkles, 
  Layout, 
  Share2, 
  Download, 
  Check, 
  Clipboard 
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { getInjectedHTML } from "@/components/project/utils";
import { useProjectStore } from "@/hooks/use-project-store";

interface ProjectDialogsProps {
  handleRegenerateSubmit: () => void;
  updateProjectTitle: (title: string) => void;
  handleDeleteProject: () => void;
  handleExportZip: (index: number) => void;
}

export function ProjectDialogs({
  handleRegenerateSubmit,
  updateProjectTitle,
  handleDeleteProject,
  handleExportZip
}: ProjectDialogsProps) {
  const {
    isRegenerateDialogOpen,
    setIsRegenerateDialogOpen,
    regenerateInstructions,
    setRegenerateInstructions,
    isEditTitleDialogOpen,
    setIsEditTitleDialogOpen,
    editingTitle,
    setEditingTitle,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isPlanDialogOpen,
    setIsPlanDialogOpen,
    designPlan: viewingPlan,
    isExportSheetOpen,
    setIsExportSheetOpen,
    exportArtifactIndex,
    throttledArtifacts,
    hasCopied,
    setHasCopied
  } = useProjectStore();
  
  const handleCopyCode = () => {
    if (exportArtifactIndex !== null) {
      const art = throttledArtifacts[exportArtifactIndex];
      const html = getInjectedHTML(art.content);
      navigator.clipboard.writeText(html);
      setHasCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Regenerate Dialog */}
      <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">Regenerate Screen</DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm">
              Provide instructions or leave blank for a general layout rethink.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea 
              placeholder="e.g., Make the background a mesh gradient..."
              className="min-h-[140px] bg-zinc-900 border-zinc-800 rounded-xl resize-none text-sm focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-600"
              value={regenerateInstructions}
              onChange={(e) => setRegenerateInstructions(e.target.value)}
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="ghost" 
              onClick={() => setIsRegenerateDialogOpen(false)}
              className="rounded-xl hover:bg-zinc-900 text-zinc-400 text-sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRegenerateSubmit}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-6"
            >
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Title Dialog */}
      <Dialog open={isEditTitleDialogOpen} onOpenChange={setIsEditTitleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Project Title</DialogTitle>
            <DialogDescription>
              Update the title for your project.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateProjectTitle(editingTitle);
                }
              }}
              placeholder="Enter project title"
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditTitleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateProjectTitle(editingTitle)}
              disabled={!editingTitle.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground hover:bg-muted/80">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plan Details Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <DialogHeader className="p-8 pb-0">
              <div className="flex items-center gap-4 mb-2">
                <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Layout className="size-6 text-primary" />
                </div>
                <div>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Project Manifest</DialogTitle>
                    <DialogDescription className="text-zinc-500 text-sm font-medium">
                      Detailed architecture and screen flow plan.
                    </DialogDescription>
                </div>
              </div>
          </DialogHeader>
          
          <div className="p-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
              {viewingPlan?._markdown ? (
                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-bold prose-p:text-zinc-400 prose-li:text-zinc-400 prose-strong:text-zinc-200 prose-code:text-primary prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {viewingPlan._markdown}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">No plan details available.</p>
              )}
          </div>

          <DialogFooter className="p-6 bg-secondary/10 border-t border-border/50">
              <Button 
                onClick={() => setIsPlanDialogOpen(false)}
                className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-widest text-[11px]"
              >
                Close Manifest
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Sheet */}
      <Sheet open={isExportSheetOpen} onOpenChange={setIsExportSheetOpen}>
        <SheetContent side="right" className="w-[400px] bg-card border-l border-border p-0">
          <SheetHeader className="p-6 border-b border-border bg-sidebar/50">
            <div className="flex items-center gap-3 mb-1">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Share2 className="size-4 text-primary" />
              </div>
              <SheetTitle className="text-lg font-bold text-foreground">Export Design</SheetTitle>
            </div>
            <SheetDescription className="text-muted-foreground text-sm">
              Prepare and package "{exportArtifactIndex !== null ? throttledArtifacts[exportArtifactIndex]?.title : ''}" for production.
            </SheetDescription>
          </SheetHeader>

          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">Production Assets</h4>
              
              <div className="grid gap-3">
                <button 
                  onClick={() => {
                    if (exportArtifactIndex !== null) handleExportZip(exportArtifactIndex);
                    setIsExportSheetOpen(false);
                  }}
                  className="group flex items-start gap-4 p-4 bg-muted/40 border border-border rounded-2xl hover:bg-muted/80 hover:border-primary/30 transition-all text-left"
                >
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Download className="size-5 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-foreground">Download Project (ZIP)</span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      Includes the complete HTML, CSS, and a high-resolution preview image.
                    </span>
                  </div>
                </button>

                <button 
                  onClick={handleCopyCode}
                  className="group flex items-start gap-4 p-4 bg-muted/40 border border-border rounded-2xl hover:bg-muted/80 hover:border-primary/30 transition-all text-left"
                >
                  <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    {hasCopied ? <Check className="size-5 text-orange-500" /> : <Clipboard className="size-5 text-orange-500" />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-foreground">Copy Code to Clipboard</span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      Instant copy of the production-ready HTML and Tailwind CSS structure.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">Design Specs</h4>
                <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Screen Type</span>
                    <span className="text-[11px] font-bold text-foreground">
                      {exportArtifactIndex !== null ? (throttledArtifacts[exportArtifactIndex]?.type === 'app' ? 'Mobile App' : 'Web Application') : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Framework</span>
                    <span className="text-[11px] font-bold text-foreground">Tailwind CSS (CDN)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Typography</span>
                    <span className="text-[11px] font-bold text-foreground">Outfit / Inter</span>
                  </div>
                </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
