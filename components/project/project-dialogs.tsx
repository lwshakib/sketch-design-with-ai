"use client";

/**
 * @file project-dialogs.tsx
 * @description This component serves as a central hub for all modal dialogs,
 * alerts, sheets, and the command menu within a project.
 * It handles interactions like project deletion, title editing, regeneration prompts,
 * design export (ZIP or Copy Code), and system settings.
 */

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
  Layout,
  Download,
  Check,
  Clipboard,
  Share2,
  Settings,
  LayoutGrid,
  Undo2,
  Redo2,
  Files,
  Pencil,
  Trash2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { getInjectedHTML } from "@/components/project/utils";
import { useProjectStore } from "@/hooks/use-project-store";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";

/**
 * Props for the ProjectDialogs component.
 * Handlers for project-level actions are passed from the main page logic.
 */
interface ProjectDialogsProps {
  /** Handler to submit a request for AI regeneration of a screen */
  handleRegenerateSubmit: () => void;
  /** Handler to update the project title in the backend/store */
  updateProjectTitle: (title: string) => void;
  /** Handler to permanently delete the current project */
  handleDeleteProject: () => void;
  /** Handler to export a specific screen artifact as a ZIP file */
  handleExportZip: (index: number) => void;
  /** Handler to download the entire project structure as a package */
  handleDownloadFullProject: () => void;
  /** Handler to duplicate the current project */
  handleDuplicateProject: () => void;
}

export function ProjectDialogs({
  handleRegenerateSubmit,
  updateProjectTitle,
  handleDeleteProject,
  handleExportZip,
  handleDownloadFullProject,
  handleDuplicateProject,
}: ProjectDialogsProps) {
  // Extract necessary state and setters from the project store
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
    secondarySidebarMode: _secondarySidebarMode,
    setSecondarySidebarMode: _setSecondarySidebarMode,
    isGenerating,
    project,
  } = useProjectStore();
  const { credits: _credits } = useWorkspaceStore();

  /**
   * Effect to listen for global keyboard shortcuts.
   * Currently supports 'Ctrl/Cmd + K' to toggle the Command Menu.
   */
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
      <Dialog
        open={isRegenerateDialogOpen}
        onOpenChange={setIsRegenerateDialogOpen}
      >
        <DialogContent className="bg-background border-border text-foreground rounded-3xl p-6 shadow-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Regenerate Screen
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Provide instructions or leave blank for a general layout rethink.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="e.g., Make the background a mesh gradient..."
              className="bg-secondary/50 border-border focus:ring-primary placeholder:text-muted-foreground/50 min-h-[140px] resize-none rounded-xl text-sm transition-all focus:ring-1"
              value={regenerateInstructions}
              onChange={(e) => setRegenerateInstructions(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRegenerateSubmit();
                }
              }}
              autoFocus
            />
          </div>

          <DialogFooter className="flex flex-col gap-3">
            <div className="flex w-full flex-row items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsRegenerateDialogOpen(false)}
                className="hover:bg-secondary text-muted-foreground hover:text-foreground h-10 flex-1 rounded-xl text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRegenerateSubmit}
                disabled={isGenerating}
                className="h-10 flex-1 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-500 disabled:opacity-50"
              >
                {isGenerating ? "Regenerating..." : "Regenerate Screen"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Title Dialog */}
      <Dialog
        open={isEditTitleDialogOpen}
        onOpenChange={setIsEditTitleDialogOpen}
      >
        <DialogContent className="bg-background border-border text-foreground rounded-3xl p-6 shadow-2xl sm:max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold tracking-tight">
              Edit Project Title
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
              Update the title for your project. This will change how it appears
              in history.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateProjectTitle(editingTitle);
                }
              }}
              placeholder="Enter project title"
              className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50 focus:ring-primary/50 w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:ring-1 focus:outline-none"
              autoFocus
            />
          </div>
          <DialogFooter className="flex flex-row items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsEditTitleDialogOpen(false)}
              className="text-muted-foreground hover:bg-secondary hover:text-foreground h-10 flex-1 rounded-xl text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateProjectTitle(editingTitle)}
              disabled={!editingTitle.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 flex-1 rounded-xl text-sm font-semibold"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Alert */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-background border-border text-foreground max-w-[380px] rounded-3xl border p-6 shadow-2xl">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-xl font-bold tracking-tight">
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
              Are you sure? This will permanently remove{" "}
              <span className="text-foreground font-bold">
                "{project?.title}"
              </span>{" "}
              and all its associated screens. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-row items-center gap-3">
            <AlertDialogCancel className="bg-secondary border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground mt-0 h-10 flex-1 rounded-xl text-sm font-medium transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="h-10 flex-1 rounded-xl border-none bg-red-500 text-sm font-bold text-white shadow-[0_4px_12px_rgba(239,68,68,0.25)] transition-all hover:bg-red-600 hover:shadow-[0_6px_15px_rgba(239,68,68,0.35)] active:scale-[0.98]"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plan Details Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="bg-background border-border text-foreground overflow-hidden rounded-3xl p-0 shadow-[0_0_50px_rgba(0,0,0,0.3)] sm:max-w-[600px]">
          <DialogHeader className="p-8 pb-0">
            <div className="mb-2 flex items-center gap-4">
              <div className="bg-primary/10 border-primary/20 flex size-12 items-center justify-center rounded-2xl border">
                <Layout className="text-primary size-6" />
              </div>
              <div>
                <DialogTitle className="text-foreground text-2xl font-bold tracking-tight">
                  Project Manifest
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm font-medium">
                  Detailed architecture and screen flow plan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="scrollbar-hide max-h-[60vh] overflow-y-auto p-8">
            {viewingPlan?._markdown ? (
              <div className="prose prose-zinc dark:prose-invert prose-sm prose-headings:text-foreground prose-headings:font-bold prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {viewingPlan._markdown}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No plan details available.
              </p>
            )}
          </div>

          <DialogFooter className="bg-muted/30 border-border/50 border-t p-4">
            <Button
              onClick={() => setIsPlanDialogOpen(false)}
              className="bg-foreground text-background hover:bg-foreground/90 h-10 w-full rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              Close Manifest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Sheet */}
      <Sheet open={isExportSheetOpen} onOpenChange={setIsExportSheetOpen}>
        <SheetContent
          side="right"
          className="bg-background border-border w-[400px] border-l p-0"
        >
          <SheetHeader className="border-border bg-sidebar/50 border-b p-6">
            <div className="mb-1 flex items-center gap-3">
              <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                <Share2 className="text-primary size-4" />
              </div>
              <SheetTitle className="text-foreground text-lg font-bold">
                Export Design
              </SheetTitle>
            </div>
            <SheetDescription className="text-muted-foreground text-sm">
              Prepare and package "
              {exportArtifactIndex !== null
                ? throttledArtifacts[exportArtifactIndex]?.title
                : ""}
              " for production.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-8 p-6">
            <div className="space-y-4">
              <h4 className="text-muted-foreground px-1 text-xs font-semibold tracking-wider uppercase">
                Production Assets
              </h4>

              <div className="grid gap-3">
                <button
                  onClick={() => {
                    if (exportArtifactIndex !== null)
                      handleExportZip(exportArtifactIndex);
                    setIsExportSheetOpen(false);
                  }}
                  className="group bg-secondary/50 border-border hover:bg-secondary hover:border-primary/30 flex items-start gap-4 rounded-2xl border p-4 text-left transition-all"
                >
                  <div className="bg-primary/10 flex size-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
                    <Download className="text-primary size-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-foreground text-sm font-semibold">
                      Download Project (ZIP)
                    </span>
                    <span className="text-muted-foreground text-[11px] leading-relaxed">
                      Includes the complete HTML, CSS, and a high-resolution
                      preview image.
                    </span>
                  </div>
                </button>

                <button
                  onClick={handleCopyCode}
                  className="group bg-secondary/50 border-border hover:bg-secondary hover:border-primary/30 flex items-start gap-4 rounded-2xl border p-4 text-left transition-all"
                >
                  <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10 transition-transform group-hover:scale-110">
                    {hasCopied ? (
                      <Check className="size-5 text-orange-500" />
                    ) : (
                      <Clipboard className="size-5 text-orange-500" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-foreground text-sm font-semibold">
                      Copy Code to Clipboard
                    </span>
                    <span className="text-muted-foreground text-[11px] leading-relaxed">
                      Instant copy of the production-ready HTML and Tailwind CSS
                      structure.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-muted-foreground px-1 text-xs font-semibold tracking-wider uppercase">
                Design Specs
              </h4>
              <div className="bg-secondary/30 border-border space-y-3 rounded-2xl border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px] font-medium">
                    Screen Type
                  </span>
                  <span className="text-foreground text-[11px] font-semibold">
                    {exportArtifactIndex !== null
                      ? throttledArtifacts[exportArtifactIndex]?.type === "app"
                        ? "Mobile App"
                        : "Web Application"
                      : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px] font-medium">
                    Framework
                  </span>
                  <span className="text-foreground text-[11px] font-semibold">
                    Tailwind CSS (CDN)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px] font-medium">
                    Typography
                  </span>
                  <span className="text-foreground text-[11px] font-semibold">
                    Outfit / Inter
                  </span>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      {/* Command Menu */}
      <CommandDialog
        open={isCommandMenuOpen}
        onOpenChange={setIsCommandMenuOpen}
      >
        <CommandInput placeholder="Type a command or search..." />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Project Actions">
            <CommandItem
              onSelect={() => {
                handleDuplicateProject();
                setIsCommandMenuOpen(false);
              }}
            >
              <Files className="mr-2 h-4 w-4" />
              <span>Duplicate Project</span>
              <CommandShortcut>⌘D</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                handleDownloadFullProject();
                setIsCommandMenuOpen(false);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              <span>Download Full Package</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setIsEditTitleDialogOpen(true);
                setIsCommandMenuOpen(false);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              <span>Rename Project</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setIsDeleteDialogOpen(true);
                setIsCommandMenuOpen(false);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Project</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => {
                window.location.href = "/";
              }}
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              <span>Go to Dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setIsSidebarVisible(!isSidebarVisible);
                setIsCommandMenuOpen(false);
              }}
            >
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
      <Dialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
      >
        <DialogContent className="bg-background border-border text-foreground overflow-hidden rounded-3xl p-0 sm:max-w-[600px]">
          <DialogHeader className="flex flex-row items-center gap-4 p-8 pb-0">
            <div className="bg-secondary border-border flex size-12 items-center justify-center rounded-2xl border">
              <Settings className="text-muted-foreground size-6" />
            </div>
            <div>
              <DialogTitle className="text-foreground text-2xl font-black tracking-tight uppercase">
                Settings
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm font-medium">
                Configure your project workspace.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-8">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="bg-secondary border-border mb-8 rounded-xl border p-1">
                <TabsTrigger
                  value="general"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg"
                >
                  General
                </TabsTrigger>
                <TabsTrigger
                  value="appearance"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg"
                >
                  Appearance
                </TabsTrigger>
                <TabsTrigger
                  value="shortcuts"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg"
                >
                  Shortcuts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <div className="bg-secondary/30 border-border/50 flex items-center justify-between rounded-2xl border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-foreground text-sm font-bold">
                      Show Grid
                    </Label>
                    <p className="text-muted-foreground text-[11px]">
                      Show a subtle dot grid background on the canvas.
                    </p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="bg-secondary/30 border-border/50 flex items-center justify-between rounded-2xl border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-foreground text-sm font-bold">
                      Auto-Save
                    </Label>
                    <p className="text-muted-foreground text-[11px]">
                      Automatically persist changes as you edit.
                    </p>
                  </div>
                  <Switch checked={true} />
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6">
                <div className="bg-secondary/20 border-border rounded-2xl border border-dashed p-12 text-center">
                  <p className="text-muted-foreground text-sm font-medium">
                    Appearance settings coming soon.
                  </p>
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
                    <div
                      key={s.label}
                      className="bg-secondary/30 border-border/50 flex items-center justify-between rounded-xl border p-3"
                    >
                      <span className="text-muted-foreground text-[11px] font-bold">
                        {s.label}
                      </span>
                      <kbd className="bg-muted text-muted-foreground/70 rounded px-1.5 py-0.5 font-mono text-[10px]">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="bg-muted/30 border-border/50 border-t p-6">
            <Button
              onClick={() => setIsSettingsDialogOpen(false)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full rounded-xl text-sm font-semibold transition-all"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
