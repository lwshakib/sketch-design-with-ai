"use client";

import React, { useEffect } from "react";
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
  Zap,
  RotateCcw, 
  Sparkles, 
  Layout, 
  Share2, 
  Download, 
  Check, 
  Clipboard,
  Search,
  Command,
  Settings,
  LayoutGrid,
  Undo2,
  Redo2,
  Files,
  Pencil,
  Trash2
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { getInjectedHTML } from "@/components/project/utils";
import { useProjectStore } from "@/hooks/use-project-store";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";

interface ProjectDialogsProps {
  handleRegenerateSubmit: () => void;
  updateProjectTitle: (title: string) => void;
  handleDeleteProject: () => void;
  handleExportZip: (index: number) => void;
  handleDownloadFullProject: () => void;
  handleDuplicateProject: () => void;
}

export function ProjectDialogs({
  handleRegenerateSubmit,
  updateProjectTitle,
  handleDeleteProject,
  handleExportZip,
  handleDownloadFullProject,
  handleDuplicateProject
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
    setHasCopied,
    isCommandMenuOpen,
    setIsCommandMenuOpen,
    isSettingsDialogOpen,
    setIsSettingsDialogOpen,
    isSidebarVisible,
    setIsSidebarVisible,
    secondarySidebarMode,
    setSecondarySidebarMode,
    isGenerating,
    project
  } = useProjectStore();
  const { credits } = useWorkspaceStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandMenuOpen(!isCommandMenuOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isCommandMenuOpen, setIsCommandMenuOpen]);
  
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
        <DialogContent className="sm:max-w-md bg-background border-border text-foreground rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">Regenerate Screen</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Provide instructions or leave blank for a general layout rethink.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea 
              placeholder="e.g., Make the background a mesh gradient..."
              className="min-h-[140px] bg-secondary/50 border-border rounded-xl resize-none text-sm focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
              value={regenerateInstructions}
              onChange={(e) => setRegenerateInstructions(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleRegenerateSubmit();
                }
              }}
              autoFocus
            />
          </div>

          <DialogFooter className="flex flex-col gap-3">
            <div className="flex flex-row items-center gap-3 w-full">
              <Button 
                variant="ghost" 
                onClick={() => setIsRegenerateDialogOpen(false)}
                className="flex-1 h-10 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground text-sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRegenerateSubmit}
                disabled={isGenerating}
                className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50"
              >
                {isGenerating ? "Regenerating..." : "Regenerate Screen"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Title Dialog */}
      <Dialog open={isEditTitleDialogOpen} onOpenChange={setIsEditTitleDialogOpen}>
        <DialogContent className="sm:max-w-md bg-background border-border text-foreground rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold tracking-tight">Edit Project Title</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
              Update the title for your project. This will change how it appears in history.
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
              className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm transition-all"
              autoFocus
            />
          </div>
          <DialogFooter className="flex flex-row items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsEditTitleDialogOpen(false)}
              className="flex-1 h-10 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateProjectTitle(editingTitle)}
              disabled={!editingTitle.trim()}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-background border border-border text-foreground rounded-3xl p-6 max-w-[380px] shadow-2xl">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-xl font-bold tracking-tight">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
              Are you sure? This will permanently remove <span className="text-foreground font-bold">"{project?.title}"</span> and all its associated screens. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-row items-center gap-3">
            <AlertDialogCancel className="flex-1 h-10 rounded-xl bg-secondary border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all text-sm font-medium mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
              className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.25)] hover:shadow-[0_6px_15px_rgba(239,68,68,0.35)] active:scale-[0.98] transition-all text-sm font-bold border-none"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plan Details Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-background border-border text-foreground p-0 overflow-hidden rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)]">
          <DialogHeader className="p-8 pb-0">
              <div className="flex items-center gap-4 mb-2">
                <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Layout className="size-6 text-primary" />
                </div>
                <div>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">Project Manifest</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm font-medium">
                      Detailed architecture and screen flow plan.
                    </DialogDescription>
                </div>
              </div>
          </DialogHeader>
          
          <div className="p-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
              {viewingPlan?._markdown ? (
                <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none prose-headings:text-foreground prose-headings:font-bold prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {viewingPlan._markdown}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No plan details available.</p>
              )}
          </div>

          <DialogFooter className="p-4 bg-muted/30 border-t border-border/50">
              <Button 
                onClick={() => setIsPlanDialogOpen(false)}
                className="w-full h-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold text-sm transition-all shadow-sm"
              >
                Close Manifest
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Sheet */}
      <Sheet open={isExportSheetOpen} onOpenChange={setIsExportSheetOpen}>
        <SheetContent side="right" className="w-[400px] bg-background border-l border-border p-0">
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
              <h4 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">Production Assets</h4>
              
              <div className="grid gap-3">
                <button 
                  onClick={() => {
                    if (exportArtifactIndex !== null) handleExportZip(exportArtifactIndex);
                    setIsExportSheetOpen(false);
                  }}
                  className="group flex items-start gap-4 p-4 bg-secondary/50 border border-border rounded-2xl hover:bg-secondary hover:border-primary/30 transition-all text-left"
                >
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Download className="size-5 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-foreground">Download Project (ZIP)</span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      Includes the complete HTML, CSS, and a high-resolution preview image.
                    </span>
                  </div>
                </button>

                <button 
                  onClick={handleCopyCode}
                  className="group flex items-start gap-4 p-4 bg-secondary/50 border border-border rounded-2xl hover:bg-secondary hover:border-primary/30 transition-all text-left"
                >
                  <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    {hasCopied ? <Check className="size-5 text-orange-500" /> : <Clipboard className="size-5 text-orange-500" />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-foreground">Copy Code to Clipboard</span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      Instant copy of the production-ready HTML and Tailwind CSS structure.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">Design Specs</h4>
                <div className="p-4 bg-secondary/30 border border-border rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Screen Type</span>
                    <span className="text-[11px] font-semibold text-foreground">
                      {exportArtifactIndex !== null ? (throttledArtifacts[exportArtifactIndex]?.type === 'app' ? 'Mobile App' : 'Web Application') : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Framework</span>
                    <span className="text-[11px] font-semibold text-foreground">Tailwind CSS (CDN)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Typography</span>
                    <span className="text-[11px] font-semibold text-foreground">Outfit / Inter</span>
                  </div>
                </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      {/* Command Menu */}
      <CommandDialog open={isCommandMenuOpen} onOpenChange={setIsCommandMenuOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Project Actions">
            <CommandItem onSelect={() => { handleDuplicateProject(); setIsCommandMenuOpen(false); }}>
              <Files className="mr-2 h-4 w-4" />
              <span>Duplicate Project</span>
              <CommandShortcut>⌘D</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { handleDownloadFullProject(); setIsCommandMenuOpen(false); }}>
              <Download className="mr-2 h-4 w-4" />
              <span>Download Full Package</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { setIsEditTitleDialogOpen(true); setIsCommandMenuOpen(false); }}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>Rename Project</span>
            </CommandItem>
            <CommandItem onSelect={() => { setIsDeleteDialogOpen(true); setIsCommandMenuOpen(false); }} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Project</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => { window.location.href = '/'; }}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              <span>Go to Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => { setIsSidebarVisible(!isSidebarVisible); setIsCommandMenuOpen(false); }}>
              <Layout className="mr-2 h-4 w-4" />
              <span>Toggle Sidebar</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Edit">
            <CommandItem disabled>
              <Undo2 className="mr-2 h-4 w-4" />
              <span>Undo</span>
              <CommandShortcut>⌘Z</CommandShortcut>
            </CommandItem>
            <CommandItem disabled>
              <Redo2 className="mr-2 h-4 w-4" />
              <span>Redo</span>
              <CommandShortcut>⌘Y</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>


      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-background border-border text-foreground p-0 overflow-hidden rounded-3xl">
          <DialogHeader className="p-8 pb-0 flex flex-row items-center gap-4">
            <div className="size-12 rounded-2xl bg-secondary border border-border flex items-center justify-center">
              <Settings className="size-6 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground">Settings</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm font-medium">Configure your project workspace.</DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-8">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="bg-secondary border border-border p-1 rounded-xl mb-8">
                <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground">General</TabsTrigger>
                <TabsTrigger value="appearance" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground">Appearance</TabsTrigger>
                <TabsTrigger value="shortcuts" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground">Shortcuts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-secondary/30 border border-border/50 rounded-2xl">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-foreground">Show Grid</Label>
                    <p className="text-[11px] text-muted-foreground">Show a subtle dot grid background on the canvas.</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary/30 border border-border/50 rounded-2xl">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-foreground">Auto-Save</Label>
                    <p className="text-[11px] text-muted-foreground">Automatically persist changes as you edit.</p>
                  </div>
                  <Switch checked={true} />
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6">
                <div className="p-12 text-center rounded-2xl bg-secondary/20 border border-dashed border-border">
                  <p className="text-sm text-muted-foreground font-medium">Appearance settings coming soon.</p>
                </div>
              </TabsContent>

              <TabsContent value="shortcuts" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Command Menu", key: "⌘ K" },
                    { label: "Toggle Sidebar", key: "⌘ B" },
                    { label: "Undo", key: "⌘ Z" },
                    { label: "Duplicate Screen", key: "Alt + D" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between p-3 bg-secondary/30 border border-border/50 rounded-xl">
                      <span className="text-[11px] font-bold text-muted-foreground">{s.label}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground/70">{s.key}</kbd>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-6 bg-muted/30 border-t border-border/50">
            <Button 
                onClick={() => setIsSettingsDialogOpen(false)}
                className="w-full h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm transition-all"
              >
                Done
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
