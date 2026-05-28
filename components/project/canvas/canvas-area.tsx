"use client";

/**
 * @file canvas-area.tsx
 * @description The core workspace area where generated screens (artifacts) are displayed.
 * This component manages the infinite-feeling canvas, handling scaling (zoom),
 * multi-element selection, drag-and-drop positioning, and screen resizing.
 * It also provides the Floating Toolbar for each screen and the main Canvas Toolbar.
 */

import React from "react";
import {
  ChevronDown,
  Plus,
  RotateCcw,
  Columns,
  Pencil,
  Palette,
  Smartphone,
  Monitor,
  Tablet,
  MoreHorizontal,
  Menu,
  Home,
  Code,
  Share2,
  Download,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Cloud,
  Check,
  Sparkles,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  QrCode,
  X,
  ArrowRight,
  LayoutGrid,
  ArrowUp,
  ChevronUp,
  Rocket,
  User,
  History,
  Minus,
  Hand,
  MousePointer2,
  Save,
  Undo,
  Redo,
  Layout,
  Layers,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import NumberFlow from "@number-flow/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/user-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { type Artifact } from "@/lib/types";
import { ScreenFrame } from "./screen-frame";
import { ThemeFrame } from "./theme-frame";
import { ModernShimmer } from "./modern-shimmer";
import { CanvasToolbar } from "./canvas-toolbar";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogoIcon } from "@/components/logo";
import { toast } from "sonner";
import axios from "axios";
import { useProjectStore } from "@/hooks/use-project-store";
import { useChat } from "@/hooks/use-chat";
import { SecondarySidebar } from "../secondary-sidebar";

const SELECTION_BLUE = "#3b82f6";

/**
 * Props for the CanvasArea component.
 * Includes interaction handlers from the useCanvas hook and project actions from page.tsx.
 */
interface CanvasAreaProps {
  /** Ref to the main preview container for scroll/wheel events */
  previewRef: React.RefObject<HTMLDivElement | null>;
  /** Dictionary of refs to the individual iframes of each artifact */
  iframeRefs: React.MutableRefObject<Record<string, HTMLIFrameElement | null>>;

  // Interaction Handlers (bridged from useCanvas)
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  /** Starts the resize operation for a screen frame */
  startResizing: (e: React.MouseEvent, index: number, handle: string) => void;
  /** Starts the dragging operation for one or more screen frames */
  startDraggingFrame: (e: React.MouseEvent, index: number) => void;

  // Page-level Action Handlers
  /** Triggers AI actions for a specific artifact */
  handleArtifactAction: (
    action: "more" | "regenerate" | "variations",
    artifact: Artifact,
  ) => void;
  /** Updates the user feedback (like/dislike) for a generated screen */
  handleFeedback: (index: number, action: "like" | "dislike" | "none") => void;
  /** Opens the full code view for a specific artifact */
  openCodeViewer: (index: number) => void;
  /** Exports an artifact's code as a ZIP file */
  handleExportZip: (index: number) => void;
  /** Deletes an artifact from the project */
  deleteArtifact: (index: number) => void;
  /** Controls the visibility of the export sheet */
  setIsExportSheetOpen: (open: boolean) => void;
  /** Sets which artifact is currently being targeted for export */
  setExportArtifactIndex: (index: number | null) => void;
  /** Global action to download the entire project */
  handleDownloadFullProject: () => void;
  /** Global action to duplicate the current project */
  handleDuplicateProject: () => void;
  /** Global action to delete the entire project */
  handleDeleteProject: () => void;
  /** Global action to persist current workspace state */
  onSave: () => void;

  // Chat/Generation Handlers
  handleCustomSubmit: (e: React.FormEvent) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function CanvasArea({
  previewRef,
  iframeRefs,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  startResizing,
  startDraggingFrame,
  handleArtifactAction,
  handleFeedback,
  openCodeViewer,
  handleExportZip,
  deleteArtifact,
  setIsExportSheetOpen,
  setExportArtifactIndex,
  handleDownloadFullProject: _handleDownloadFullProject,
  handleDuplicateProject: _handleDuplicateProject,
  handleDeleteProject: _handleDeleteProject,
  handleCustomSubmit,
  handleFileUpload,
  fileInputRef,
  onSave,
}: CanvasAreaProps) {
  const {
    zoom,
    setZoom,
    canvasOffset,
    setCanvasOffset,
    framePos,
    setFramePos,
    throttledArtifacts,
    setThrottledArtifacts,
    artifacts: _artifacts,
    setArtifacts,
    selectionBox,
    isDraggingFrame,
    isResizing,
    designPlan: _designPlan,
    artifactPreviewModes,
    setArtifactPreviewModes,
    dynamicFrameHeights,
    isSaving,
    hasUnsavedChanges,
    leftSidebarMode: _leftSidebarMode,
    setLeftSidebarMode: _setLeftSidebarMode,
    isPanning,
    secondarySidebarMode,
    setSecondarySidebarMode,
    activeTool,
    setActiveTool,
    regeneratingArtifactIds,
    project,
    input,
    setInput,
    attachments,
    setAttachments,
    is3xMode,
    setIs3xMode,
    selectedArtifactIds,
    setSelectedArtifactIds,
    isGenerating,
    isTalking,
    isTurnDetailVisible,
    selectedTurnId,
    setIsTurnDetailVisible,
    setSelectedTurnId,
    realtimeStatus,
    isAgentLogOpen,
    setIsAgentLogOpen,
    messages,
    setSelectedEl,
  } = useProjectStore();

  const [isMounted, setIsMounted] = React.useState(false);
  const [credits, setCredits] = React.useState<number | null>(null);

  const fetchCredits = React.useCallback(async () => {
    try {
      const res = await axios.get("/api/user/credits");
      if (res.data && typeof res.data.credits === "number") {
        setCredits(res.data.credits);
      }
    } catch (err) {
      console.error("Failed to fetch credits:", err);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    fetchCredits();
  }, [fetchCredits]);

  // Refetch credits after a generation is finished
  const prevIsGenerating = React.useRef(isGenerating);
  React.useEffect(() => {
    if (prevIsGenerating.current && !isGenerating) {
      fetchCredits();
    }
    prevIsGenerating.current = isGenerating;
  }, [isGenerating, fetchCredits]);

  const selectedIndex = throttledArtifacts.findIndex(
    (a) => a.id && selectedArtifactIds.has(a.id),
  );
  const selectedArtifact =
    selectedIndex !== -1 ? throttledArtifacts[selectedIndex] : null;

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const logEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isAgentLogOpen && logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAgentLogOpen]);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const { sendMessage } = useChat(project?.id || "");

  // Filter project themes and currently active theme
  const projectThemes = React.useMemo(() => {
    return throttledArtifacts.filter((a) => a.type === "theme");
  }, [throttledArtifacts]);

  const activeTheme = React.useMemo(() => {
    return projectThemes.find((t) => t.isActive);
  }, [projectThemes]);

  // Handler to activate a different theme
  const handleSwitchTheme = async (themeId: string) => {
    try {
      const res = await fetch(`/api/themes/${themeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) throw new Error("Failed to switch theme");
      
      const updateFn = (prev: any[]) =>
        prev.map((a) =>
          a.type === "theme"
            ? { ...a, isActive: a.id === themeId }
            : a
        );
      setArtifacts(updateFn);
      setThrottledArtifacts(updateFn);
      toast.success("Theme switched successfully!");
    } catch (e) {
      toast.error("Failed to switch theme");
    }
  };

  // State for creating a new design system theme
  const [isCreateThemeOpen, setIsCreateThemeOpen] = React.useState(false);
  const [themePrompt, setThemePrompt] = React.useState("");

  const handleCreateThemeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!themePrompt.trim()) return;

    sendMessage({
      text: `Create a new theme: ${themePrompt.trim()}`,
    });
    setThemePrompt("");
    setIsCreateThemeOpen(false);
  };

  // State for custom theme creator
  const [isCustomThemeOpen, setIsCustomThemeOpen] = React.useState(false);
  const [customThemeName, setCustomThemeName] = React.useState("");
  const [customPrimary, setCustomPrimary] = React.useState("#6366f1");
  const [customSecondary, setCustomSecondary] = React.useState("#ec4899");
  const [customBackground, setCustomBackground] = React.useState("#080808");
  const [customForeground, setCustomForeground] = React.useState("#ffffff");
  const [customFont, setCustomFont] = React.useState("Inter");

  const handleCreateCustomThemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customThemeName.trim()) return;

    try {
      const res = await fetch(`/api/projects/${project?.id}/themes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customThemeName.trim(),
          colors: {
            primary: customPrimary,
            secondary: customSecondary,
            tertiary: "#14b8a6",
            neutral: "#94a3b8",
            background: customBackground,
            foreground: customForeground,
          },
          typography: {
            headline: customFont,
            body: customFont,
            label: customFont,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to create custom theme");

      const newTheme = await res.json();

      const updateFn = (prev: any[]) => {
        const updated = prev.map((a) =>
          a.type === "theme" ? { ...a, isActive: false } : a
        );
        return [...updated, newTheme];
      };

      setArtifacts(updateFn);
      setThrottledArtifacts(updateFn);

      setIsCustomThemeOpen(false);
      setCustomThemeName("");
      toast.success("Custom theme created and applied successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create custom theme");
    }
  };

  const isEditMode = secondarySidebarMode === "properties";
  const _status = isGenerating ? "streaming" : "ready"; // Simplification for UI checks

  const [isQrDialogOpen, setIsQrDialogOpen] = React.useState(false);
  const [qrCodeUrl, setQrCodeUrl] = React.useState("");

  const [selectedElementInfo, setSelectedElementInfo] = React.useState<any>(null);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "ELEMENT_CLICKED") {
        // Find which artifact this message came from by checking iframe sources
        let artifactTitle = null;
        for (const title in iframeRefs.current) {
          const iframe = iframeRefs.current[title];
          if (iframe && iframe.contentWindow === event.source) {
            artifactTitle = title;
            break;
          }
        }

        if (artifactTitle) {
           const artifact = throttledArtifacts.find(a => a.title === artifactTitle);
           if (artifact && artifact.id) {
             setSelectedArtifactIds(new Set([artifact.id]));
           }

           setSelectedElementInfo({
             ...event.data,
             artifactTitle: artifactTitle
           });

           // Find and set the real HTMLElement reference in the store
           const iframe = iframeRefs.current[artifactTitle];
           if (iframe && iframe.contentDocument) {
             const getElementByPath = (doc: Document, path: number[]) => {
               let el: any = doc.body;
               for (const index of path) {
                 if (el && el.children[index]) el = el.children[index];
                 else return null;
               }
               return el;
             };
             const el = getElementByPath(iframe.contentDocument, event.data.path);
             if (el) {
               setSelectedEl(el as HTMLElement);
               setSecondarySidebarMode("properties");
             }
           }
        }
      }
      if (event.data.type === "SELECTION_CLEARED") {
        setSelectedElementInfo(null);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [selectedArtifact, iframeRefs, throttledArtifacts, setSelectedArtifactIds, setSelectedEl, setSecondarySidebarMode]);

  React.useEffect(() => {
    if (isGenerating) {
        setIsTurnDetailVisible(true);
    }
  }, [isGenerating, setIsTurnDetailVisible]);

  return (
    <main
      ref={previewRef}
      onMouseDown={(e) => {
        const isModalOpen = typeof document !== "undefined" && (!!document.querySelector('[role="dialog"]') || !!document.querySelector('[data-slot="dialog-content"]'));
        if (isModalOpen) return;
        const target = e.target as HTMLElement;
        if (
          target.closest('[role="dialog"]') ||
          target.closest('[role="menu"]') ||
          target.closest('[data-radix-portal]') ||
          target.closest('.pointer-events-auto')
        ) {
          return;
        }
        handleMouseDown(e);
      }}
      onMouseMove={(e) => {
        const isModalOpen = typeof document !== "undefined" && (!!document.querySelector('[role="dialog"]') || !!document.querySelector('[data-slot="dialog-content"]'));
        if (isModalOpen) return;
        handleMouseMove(e);
      }}
      onMouseUp={() => {
        const isModalOpen = typeof document !== "undefined" && (!!document.querySelector('[role="dialog"]') || !!document.querySelector('[data-slot="dialog-content"]'));
        if (isModalOpen) return;
        handleMouseUp();
      }}
      onMouseLeave={() => {
        const isModalOpen = typeof document !== "undefined" && (!!document.querySelector('[role="dialog"]') || !!document.querySelector('[data-slot="dialog-content"]'));
        if (isModalOpen) return;
        handleMouseUp();
      }}
      onClick={(e) => {
        const isModalOpen = typeof document !== "undefined" && (!!document.querySelector('[role="dialog"]') || !!document.querySelector('[data-slot="dialog-content"]'));
        if (isModalOpen) return;
        if (e.target === e.currentTarget) {
           setSelectedArtifactIds(new Set());
           setSelectedElementInfo(null);
           if (activeTool === "edit") {
              setSecondarySidebarMode("none");
           }
        }
      }}
      className={cn(
        "bg-background relative flex flex-1 flex-col overflow-hidden",
        activeTool === "hand"
          ? isPanning
            ? "cursor-grabbing"
            : "cursor-grab"
          : activeTool === "select"
            ? "cursor-default"
            : "cursor-crosshair",
      )}
    >
      {/* Grid Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: `${20 * zoom * 0.5}px ${20 * zoom * 0.5}px`,
          transform: `translate(${canvasOffset.x % (20 * zoom * 0.5)}px, ${canvasOffset.y % (20 * zoom * 0.5)}px)`,
        }}
      />
      
      {/* Turn Details Detail (Top Left) */}
      {(selectedTurnId || isGenerating) && isTurnDetailVisible && (
        <div 
           className="pointer-events-none absolute top-[68px] left-6 z-[60] flex flex-col items-start gap-4" 
           onMouseDown={(e) => e.stopPropagation()}
           onWheel={(e) => e.stopPropagation()}
        >
          {(() => {
            const lastUserIdx = [...(messages || [])].reverse().findIndex(m => m.role === 'user');
            const latestUserMsgId = lastUserIdx !== -1 ? messages![messages!.length - 1 - lastUserIdx].id : null;
            
            const targetId = isGenerating ? latestUserMsgId : selectedTurnId;
            const userIdx = messages?.findIndex((m) => m.id === targetId);
            
            if (userIdx === -1 || userIdx === undefined) return null;
            const userMsg = messages![userIdx];
            // Find the assistant message that follows this user message
            const assistantMsg = messages?.slice(userIdx + 1).find((m) => m.role === "assistant");
            
            const getUserText = () => userMsg.parts?.find((p: any) => p.type === "text")?.text || "";
            const getAssistantText = () => {
                 if (isGenerating && !assistantMsg) return "Generating response...";
                 if (!assistantMsg) return "";
                 const text = assistantMsg.parts?.find((p: any) => p.type === "text")?.text || "";
                 return text.replace(/<(artifact|artifact\s+.*?)>[\s\S]*?<\/artifact>/g, "").trim();
            }

            return (
              <div className="bg-background/90 border-border pointer-events-auto flex max-h-[480px] w-[340px] flex-col overflow-y-auto rounded-xl border shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-300 scrollbar-none ring-1 ring-black/5 lg:w-[400px] relative">
                {/* Sticky Header: User Message + Close Button */}
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/10 flex items-start justify-between gap-4 p-5 pb-4">
                  <p className="text-[13.5px] font-medium leading-relaxed text-foreground/90 flex-1 py-0.5">
                    {getUserText().replace(/\[Context:.*?\]\s*/g, "").trim()}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-7 rounded-full hover:bg-muted shrink-0"
                    onClick={() => setIsTurnDetailVisible(false)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>

                <div className="flex flex-col gap-5 p-5 pt-4">
                   {/* Assistant Message */}
                   <div className="text-[13px] leading-relaxed text-muted-foreground py-0.5">
                     {assistantMsg || isGenerating ? (
                        <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted/50 max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {getAssistantText() || (isGenerating ? "Thinking..." : "")}
                            </ReactMarkdown>
                        </div>
                     ) : null}
                   </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Preview Header */}
      <header className="pointer-events-none absolute top-0 right-0 left-0 z-30 flex h-16 items-center justify-between px-6" onMouseDown={(e) => e.stopPropagation()}>
        <div className="pointer-events-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-10 w-10 transition-all hover:bg-transparent"
                title="Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-card border-border text-foreground z-[100] w-56 rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl"
            >
              <DropdownMenuItem
                onClick={() => (window.location.href = "/")}
                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium"
              >
                <Home className="mr-2.5 h-4 w-4 opacity-70" />
                <span>Back to home</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={_handleDeleteProject}
                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium"
              >
                <Trash2 className="mr-2.5 h-4 w-4 opacity-70" />
                <span>Delete project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex flex-col">
            <span className="text-foreground whitespace-nowrap text-[15.5px] font-semibold tracking-tight">
              {project?.title || "Untitled Project"}
            </span>
          </div>
        </div>
        
        {/* Dynamic Center Toolbar for Selected Artifact */}
        <div className="pointer-events-none absolute inset-x-0 h-full flex items-center justify-center">
          {selectedArtifact && selectedArtifactIds.size === 1 && (
            <div className="bg-card/95 border-border/50 pointer-events-auto flex items-center gap-1.5 rounded-full border px-2 py-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300 ring-1 ring-white/5">


              <Button
                variant="ghost"
                size="icon"
                onClick={() => openCodeViewer(selectedIndex)}
                className="h-9 w-9 rounded-full transition-all hover:bg-secondary/40"
                title="View Code"
              >
                <Code className="h-4 w-4" />
              </Button>

              {selectedArtifact.type !== "theme" && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-foreground/80 hover:text-foreground flex h-9 items-center gap-2 rounded-full px-3 text-[13px] font-medium transition-colors hover:bg-secondary/40"
                      >
                        {(() => {
                          const mode = artifactPreviewModes[selectedArtifact.title] || selectedArtifact.type;
                          if (mode === "app") return <Smartphone className="h-4 w-4 opacity-70" />;
                          if (mode === "tablet") return <Tablet className="h-4 w-4 opacity-70" />;
                          return <Monitor className="h-4 w-4 opacity-70" />;
                        })()}
                        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className="bg-card border-border text-foreground z-[100] w-48 rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                            const newModes = { ...artifactPreviewModes, [selectedArtifact.title]: "app" as const };
                            setArtifactPreviewModes(newModes);
                        }}
                        className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-[13px]"
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" /> App
                        </div>
                        <span className="text-muted-foreground text-[10px]">380px</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                            const newModes = { ...artifactPreviewModes, [selectedArtifact.title]: "web" as const };
                            setArtifactPreviewModes(newModes);
                        }}
                        className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-[13px]"
                      >
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" /> Web
                        </div>
                        <span className="text-muted-foreground text-[10px]">1280px</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                            const newModes = { ...artifactPreviewModes, [selectedArtifact.title]: "tablet" as const };
                            setArtifactPreviewModes(newModes);
                        }}
                        className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-[13px]"
                      >
                        <div className="flex items-center gap-2">
                          <Tablet className="h-4 w-4" /> Tablet
                        </div>
                        <span className="text-muted-foreground text-[10px]">768px</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="bg-border/50 mx-1 h-4 w-[1px]" />

                  <div className="flex items-center gap-1 px-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFeedback(selectedIndex, selectedArtifact.isLiked ? "none" : "like")}
                      className={cn(
                        "h-8 w-8 rounded-full transition-all hover:bg-secondary/40",
                        selectedArtifact.isLiked ? "text-primary bg-primary/10" : "text-foreground/40"
                      )}
                    >
                      <ThumbsUp className={cn("h-3.5 w-3.5", selectedArtifact.isLiked && "fill-current")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFeedback(selectedIndex, selectedArtifact.isDisliked ? "none" : "dislike")}
                      className={cn(
                        "h-8 w-8 rounded-full transition-all hover:bg-secondary/40",
                        selectedArtifact.isDisliked ? "text-red-500 bg-red-500/10" : "text-foreground/40"
                      )}
                    >
                      <ThumbsDown className={cn("h-3.5 w-3.5", selectedArtifact.isDisliked && "fill-current")} />
                    </Button>
                  </div>

                  <div className="bg-border/50 mx-1 h-4 w-[1px]" />
                </>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setExportArtifactIndex(selectedIndex);
                  setIsExportSheetOpen(true);
                }}
                className="h-9 w-9 rounded-full transition-all hover:bg-secondary/40"
                title="Export"
              >
                <Share2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleExportZip(selectedIndex)}
                className="h-9 w-9 rounded-full transition-all hover:bg-secondary/40"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteArtifact(selectedIndex)}
                className="hover:bg-destructive/10 text-destructive h-9 w-9 rounded-full transition-all"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-4">
          {credits !== null && isMounted && (
            <span className="text-muted-foreground hidden text-[12px] font-medium sm:block">
              {credits} credits remaining
            </span>
          )}
          <div className="flex h-8 w-8 items-center justify-center">
            {isSaving ? (
              <Loader2 className="text-foreground/40 h-4 w-4 animate-spin" />
            ) : hasUnsavedChanges ? (
              <div title="Unsaved">
                <Cloud className="text-foreground/40 h-4 w-4" />
              </div>
            ) : (
              <div className="relative opacity-20" title="Saved">
                <Cloud className="text-foreground h-4 w-4" />
                <Check className="text-foreground absolute -right-0.5 -bottom-0.5 h-2 w-2 stroke-[4px]" />
              </div>
            )}
          </div>
          <ModeToggle />
          <UserMenu />
        </div>
      </header>

      {/* Content Layer: Contains the translated and scaled artifacts */}
      <div
        className={cn(
          "absolute inset-0 flex select-none",
          throttledArtifacts.length === 0
            ? "items-center justify-center pb-20"
            : "items-center justify-center",
        )}
      >
        {throttledArtifacts.length > 0 ? (
          <div
            className="relative"
            style={{
              /** Apply the global canvas zoom and offset translation */
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom * 0.5})`,
              transformOrigin: "0 0",
              transition:
                isPanning || isDraggingFrame || isResizing
                  ? "none"
                  : "transform 0.5s cubic-bezier(0.2, 0, 0, 1)",
            }}
          >
            <div
              className="relative"
              style={{
                transform: `translate(${framePos.x}px, ${framePos.y}px)`,
              }}
            >
              {throttledArtifacts.map((artifact, index) => (
                <div
                  key={index}
                  onMouseDown={(e) => {
                    if (activeTool === "select") {
                      startDraggingFrame(e, index);
                    } else if (activeTool === "edit") {
                      e.stopPropagation();
                      if (artifact.id) {
                        setSelectedArtifactIds(new Set([artifact.id]));
                        setSecondarySidebarMode("properties");
                      }
                    }
                  }}
                  onDoubleClick={() => {
                    if (activeTool === "select") {
                      useProjectStore.getState().focusArtifact(artifact.title);
                    }
                  }}
                  className={cn(
                    "group absolute top-0 left-0 select-none",
                    activeTool === "hand"
                      ? isPanning
                        ? "cursor-grabbing"
                        : "cursor-grab"
                      : isDraggingFrame
                        ? "cursor-grabbing"
                        : "cursor-default",
                  )}
                  style={{
                    transform: `translate(${artifact.x || 0}px, ${artifact.y || 0}px)`,
                    transition:
                      isDraggingFrame &&
                      artifact.id &&
                      selectedArtifactIds.has(artifact.id)
                        ? "none"
                        : isResizing
                          ? "none"
                          : "transform 0.2s ease-out",
                  }}
                >

                  {/* Frame Info Overlay */}
                  {artifact.id &&
                    (selectedArtifactIds.has(artifact.id) ||
                      isDraggingFrame ||
                      artifact.isComplete) && (() => {
                      const wVal = (() => {
                        const mode = artifactPreviewModes[artifact.title];
                        if (mode === "app") return 380;
                        if (mode === "web") return 1280;
                        if (mode === "tablet") return 768;
                        return artifact.width
                          ? artifact.width
                          : artifact.type === "app"
                            ? 380
                            : 1280;
                      })();
                      const scaleFactor = 1 / (zoom * 0.5);
                      const containerWidth = wVal * (zoom * 0.5);
                      return (
                        <div
                          className="pointer-events-none absolute -top-7 left-0 flex items-center justify-between px-1 select-none overflow-hidden h-6 gap-2"
                          style={{
                            width: `${containerWidth}px`,
                            transform: `scale(${scaleFactor})`,
                            transformOrigin: "left bottom",
                          }}
                        >
                          <span
                            className="text-[12px] font-bold truncate whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0"
                            style={{
                              color: "var(--primary)",
                            }}
                          >
                            {artifact.title || "Untitled Screen"}
                          </span>
                          <div className="flex items-center shrink-0">
                            <Code
                              className="h-3.5 w-3.5 text-muted-foreground"
                            />
                          </div>
                        </div>
                      );
                    })()}

                  <div
                    className={cn(
                      "relative flex-shrink-0 overflow-hidden border shadow-[0_40px_100px_rgba(0,0,0,0.4)] transition-shadow duration-300 ease-in-out",
                      isDraggingFrame &&
                        artifact.id &&
                        selectedArtifactIds.has(artifact.id) &&
                        "shadow-[0_60px_120px_rgba(0,0,0,0.5)]",
                    )}
                    style={{
                      width: (() => {
                        const mode = artifactPreviewModes[artifact.title];
                        if (mode === "app") return "380px";
                        if (mode === "web") return "1280px";
                        if (mode === "tablet") return "768px";
                        return artifact.width
                          ? `${artifact.width}px`
                          : artifact.type === "app"
                            ? "380px"
                            : "1280px";
                      })(),
                      height: (() => {
                        // Manual resize takes absolute priority
                        if (artifact.height) return `${artifact.height}px`;

                        if (artifact.type === "theme") return "524px";

                        const isApp =
                          artifact.type === "app" ||
                          artifactPreviewModes[artifact.title] === "app";

                        if (isApp) return "800px";

                        const dynamicHeight =
                          dynamicFrameHeights[artifact.title];
                        // Prefer dynamic height if detected and no manual height is set
                        if (dynamicHeight && dynamicHeight > 100)
                          return `${dynamicHeight}px`;

                        return "700px";
                      })(),
                      minHeight:
                        artifactPreviewModes[artifact.title] === "app" ||
                        (artifact.type === "app" &&
                          !artifactPreviewModes[artifact.title])
                          ? "800px"
                          : "400px",
                      transition: isResizing
                        ? "none"
                        : "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      backgroundColor: artifact.type === "theme" ? ((artifact.variables as any)?.colors?.background || "var(--background)") : "var(--background)",
                      borderColor:
                        artifact.id && selectedArtifactIds.has(artifact.id)
                          ? SELECTION_BLUE
                          : "var(--border)",
                      boxShadow:
                        artifact.id && selectedArtifactIds.has(artifact.id)
                          ? `0 0 0 2px ${SELECTION_BLUE}40, 0 40px 100px rgba(0,0,0,0.4)`
                          : undefined,
                    }}
                  >
                    {((!artifact.isComplete && !artifact.html) ||
                      (artifact.id &&
                        regeneratingArtifactIds.has(artifact.id))) && (
                      <ModernShimmer
                        type={artifact.type}
                      />
                    )}

                    <div
                      className={cn(
                        "h-full w-full transition-opacity duration-500",
                        artifact.id && regeneratingArtifactIds.has(artifact.id)
                          ? "opacity-30"
                          : "opacity-100",
                      )}
                    >
                      {artifact.type === "theme" ? (
                        <ThemeFrame artifact={artifact} />
                      ) : (
                        <ScreenFrame
                          artifact={artifact}
                          index={index}
                          isEditMode={isEditMode}
                          activeTool={activeTool}
                          isDraggingFrame={isDraggingFrame}
                          onRef={(idx, el) => {
                            if (el)
                              (el as any).dataset.artifactTitle = artifact.title;
                            iframeRefs.current[artifact.title] = el;
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {artifact.id && selectedArtifactIds.has(artifact.id) && (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{ zIndex: 80 }}
                    >
                      {selectedArtifactIds.size === 1 && (
                        <>
                          {/* Edge Handles */}
                          <div
                            onMouseDown={(e) => startResizing(e, index, "left")}
                            className="pointer-events-auto absolute top-4 bottom-4 left-0 z-50 w-1.5 -translate-x-1/2 cursor-ew-resize"
                          />
                          <div
                            onMouseDown={(e) =>
                              startResizing(e, index, "right")
                            }
                            className="pointer-events-auto absolute top-4 right-0 bottom-4 z-50 w-1.5 translate-x-1/2 cursor-ew-resize"
                          />
                          <div
                            onMouseDown={(e) => startResizing(e, index, "top")}
                            className="pointer-events-auto absolute top-0 right-4 left-4 z-50 h-1.5 -translate-y-1/2 cursor-ns-resize"
                          />
                          <div
                            onMouseDown={(e) =>
                              startResizing(e, index, "bottom")
                            }
                            className="pointer-events-auto absolute right-4 bottom-0 left-4 z-50 h-1.5 translate-y-1/2 cursor-ns-resize"
                          />

                          {/* Corner Handles */}
                          <div
                            onMouseDown={(e) =>
                              startResizing(e, index, "top-left")
                            }
                            className="pointer-events-auto absolute top-0 left-0 z-50 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize rounded-full border-2 border-[#3b82f6] bg-white shadow-sm"
                          />
                          <div
                            onMouseDown={(e) =>
                              startResizing(e, index, "top-right")
                            }
                            className="pointer-events-auto absolute top-0 right-0 z-50 h-2.5 w-2.5 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize rounded-full border-2 border-[#3b82f6] bg-white shadow-sm"
                          />
                          <div
                            onMouseDown={(e) =>
                              startResizing(e, index, "bottom-left")
                            }
                            className="pointer-events-auto absolute bottom-0 left-0 z-50 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize rounded-full border-2 border-[#3b82f6] bg-white shadow-sm"
                          />
                          <div
                            onMouseDown={(e) =>
                              startResizing(e, index, "bottom-right")
                            }
                            className="pointer-events-auto absolute right-0 bottom-0 z-50 h-2.5 w-2.5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-full border-2 border-[#3b82f6] bg-white shadow-sm"
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center duration-1000">
            <div className="mb-8">
              <LogoIcon className="text-primary/10 h-32 w-32" />
            </div>
            <p className="text-muted-foreground/40 text-sm font-medium">
              Generate your first design to see it here
            </p>
          </div>
        )}
      </div>

      {/* Agent Log / History (Bottom Left) */}
      <div 
         className="pointer-events-none absolute bottom-6 left-6 z-[60] flex flex-col items-start gap-2.5" 
         onMouseDown={(e) => e.stopPropagation()}
         onWheel={(e) => e.stopPropagation()}
      >
        {/* Minimal History Window */}
        {isAgentLogOpen && (
          <div className="bg-background/80 border-border pointer-events-auto flex max-h-[300px] w-[280px] flex-col gap-1 overflow-y-auto rounded-xl border p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 scrollbar-none ring-1 ring-black/5">
            <div className="flex flex-col gap-0.5">
              {messages
                ?.filter((m) => !m.isSilent && m.role === "user")
                .slice()
                .reverse()
                .map((msg, i) => {
                  const textPart = msg.parts?.find((p: any) => p.type === "text");
                  const text = textPart?.text || "";
                  const cleanText = text.replace(/\[Context:.*?\]\s*/g, "").trim(); 
                  
                  if (!cleanText) return null;

                  return (
                    <div
                      key={msg.id || i}
                      onClick={() => {
                        if (selectedTurnId === msg.id) {
                           setIsTurnDetailVisible(!isTurnDetailVisible);
                        } else {
                           setSelectedTurnId(msg.id);
                           setIsTurnDetailVisible(true);
                        }
                      }}
                      className={cn(
                        "group relative flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer",
                        selectedTurnId === msg.id
                          ? "bg-secondary/60 ring-1 ring-primary/10 shadow-sm" 
                          : "hover:bg-secondary/40"
                      )}
                    >
                      <span className={cn(
                        "text-[12px] font-medium leading-tight transition-colors flex-1 truncate",
                        selectedTurnId === msg.id ? "text-foreground" : "text-muted-foreground",
                      )}>
                        {cleanText}
                      </span>
                      {isGenerating && i === 0 && (
                        <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0 opacity-80" />
                      )}
                    </div>
                  );
                })}
              {messages?.filter((m) => !m.isSilent).length === 0 && (
                <div className="text-muted-foreground/50 py-6 text-center text-[11px] font-medium italic">
                  No activity logs found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Minimal Toggle Button */}
        <Button
          variant="ghost"
          onClick={(e) => {
             e.stopPropagation();
             setIsAgentLogOpen(!isAgentLogOpen);
          }}
          className={cn(
             "pointer-events-auto bg-background/50 border-border group flex items-center gap-2.5 rounded-full border px-4 h-10 text-[13px] font-medium text-muted-foreground backdrop-blur-md transition-all hover:bg-background/80 hover:text-foreground hover:shadow-lg",
             isAgentLogOpen && "bg-background/80 text-foreground border-primary/20 shadow-lg"
          )}
        >
          <Rocket className={cn("h-4 w-4 stroke-[1.5px] transition-colors", isAgentLogOpen ? "text-primary" : "text-muted-foreground")} />
          <span>Agent Log</span>
          {isAgentLogOpen ? (
            <ChevronDown className="h-4 w-4 opacity-50" />
          ) : (
            <ChevronUp className="h-4 w-4 opacity-50" />
          )}
        </Button>
      </div>

      {/* Floating Chat Input */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[100] flex justify-center px-6" onMouseDown={(e) => e.stopPropagation()}>
        <div className="pointer-events-auto w-full max-w-[600px]">
          <div className="bg-background/70 border-border group/input flex flex-col gap-3 rounded-[24px] border p-3 shadow-2xl backdrop-blur-2xl transition-all focus-within:ring-1 focus-within:ring-primary/20">
            <TooltipProvider>
              {/* Selected Artifacts Preview (Reference context) */}
              {selectedArtifactIds.size > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-wrap gap-3 px-2 duration-300">
                  {Array.from(selectedArtifactIds).map((id) => {
                    const art = throttledArtifacts.find((a) => a.id === id);
                    if (!art) return null;
                    return (
                      <Tooltip key={id}>
                        <TooltipTrigger asChild>
                          <div className="group border-border bg-card/50 hover:border-primary/50 relative h-12 w-12 cursor-help overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md">
                            <div className="pointer-events-none absolute inset-0 h-[2000px] w-[1024px] origin-top-left scale-[calc(48/1024)] opacity-100">
                              <iframe
                                title={`mini-preview-${id}`}
                                className="h-full w-full border-none"
                                srcDoc={`
                                  <!DOCTYPE html>
                                  <html>
                                    <head>
                                      <script src="https://cdn.tailwindcss.com"></script>
                                      <style>
                                        body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
                                      </style>
                                    </head>
                                    <body>${art.html}</body>
                                  </html>
                                `}
                              />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedArtifactIds((prev) => {
                                  const next = new Set(prev);
                                  next.delete(id);
                                  return next;
                                });
                              }}
                              className="bg-card border-border hover:bg-destructive hover:text-destructive-foreground absolute top-1 right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border opacity-0 shadow-sm transition-all group-hover:opacity-100"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="border-border bg-card text-xs font-bold text-foreground shadow-xl"
                        >
                          Reference: {art.title || "Untitled Screen"}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCustomSubmit(e);
                    }
                  }}
                  placeholder="What would you like to change or create?"
                  className="placeholder:text-muted-foreground/50 min-h-[1.5rem] w-full resize-none bg-transparent px-2 text-[14px] leading-relaxed text-foreground outline-none overflow-y-auto max-h-[160px]"
                  rows={1}
                />

                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-1.5">
                    {/* File Upload Button */}
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="icon"
                      className="bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted h-7 w-7 rounded-full border"
                      type="button"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />

                    {/* Multi-theme Dropdown Select */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-muted/40 border-border/50 text-foreground/80 hover:text-foreground flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-all hover:bg-muted"
                        >
                          <Palette className="h-3 w-3 text-primary opacity-80" />
                          <span className="max-w-[80px] truncate">
                            {activeTheme ? activeTheme.title : "Select Theme"}
                          </span>
                          <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="bg-card border-border text-foreground z-[100] w-52 rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl"
                      >
                        {projectThemes.length > 0 && (
                          <>
                            {projectThemes.map((theme) => (
                              <DropdownMenuItem
                                key={theme.id}
                                onClick={() => handleSwitchTheme(theme.id!)}
                                className={cn(
                                  "hover:bg-muted flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium",
                                  theme.isActive && "text-primary font-semibold"
                                )}
                              >
                                <div className="flex items-center gap-2 truncate max-w-[130px]">
                                  <div
                                    className="size-3 rounded-full border shrink-0"
                                    style={{ backgroundColor: theme.variables?.colors?.primary || "#6366f1" }}
                                  />
                                  <span className="truncate">{theme.title}</span>
                                </div>
                                {theme.isActive && (
                                  <Check className="h-3 w-3 text-primary shrink-0" />
                                )}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator className="bg-border/30 my-1" />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => setIsCustomThemeOpen(true)}
                          className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1.5 text-[11.5px] font-semibold text-foreground/80 hover:text-primary transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5 text-primary opacity-80" />
                          <span>Custom Theme</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setIsCreateThemeOpen(true)}
                          className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1.5 text-[11.5px] font-semibold text-foreground/80 hover:text-primary transition-colors"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary opacity-80" />
                          <span>AI Theme</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={(e) => handleCustomSubmit(e as any)}
                      disabled={
                        (!input.trim() && attachments.length === 0) ||
                        isGenerating
                      }
                      size="icon"
                      className={cn(
                        "h-9 w-9 shrink-0 rounded-full transition-all duration-300",
                        input.trim() || attachments.length > 0
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 scale-100"
                          : "bg-muted text-muted-foreground scale-90 opacity-40 cursor-not-allowed",
                      )}
                    >
                      {isTalking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Attachments preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2 pb-1">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="group border-border bg-muted relative size-12 overflow-hidden rounded-xl border shadow-sm"
                    >
                      <Image
                        src={att.url}
                        alt="attachment"
                        fill
                        className="object-cover opacity-80 transition-opacity group-hover:opacity-100"
                        unoptimized
                      />
                      <button
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="bg-background/80 hover:bg-destructive absolute top-1 right-1 flex size-5 items-center justify-center rounded-full text-foreground hover:text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Selection Box Overlay */}
      {selectionBox && (
        <div
          className="border-primary/60 bg-primary/10 pointer-events-none absolute z-[1000] rounded-sm border"
          style={{
            left: Math.min(selectionBox.x1, selectionBox.x2),
            top: Math.min(selectionBox.y1, selectionBox.y2),
            width: Math.abs(selectionBox.x2 - selectionBox.x1),
            height: Math.abs(selectionBox.y2 - selectionBox.y1),
          }}
        />
      )}

      {/* Bottom Toolbar */}
      <CanvasToolbar />

      {/* Bottom Right Controls */}
      <div className="bg-card/80 border-border/50 pointer-events-auto absolute right-6 bottom-6 z-50 flex items-center gap-1 rounded-2xl border p-1 shadow-2xl backdrop-blur-xl" onMouseDown={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom((prev) => Math.max(0.1, prev - 0.1))}
          className="text-muted-foreground hover:text-foreground h-10 w-10 rounded-xl transition-all hover:bg-transparent"
          title="Zoom Out"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <div className="text-muted-foreground min-w-[40px] text-center text-[11px] font-bold">
          {Math.round(zoom * 100)}%
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom((prev) => Math.min(5, prev + 0.1))}
          className="text-muted-foreground hover:text-foreground h-10 w-10 rounded-xl transition-all hover:bg-transparent"
          title="Zoom In"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <div className="bg-border/50 mx-1 h-4 w-[1px]" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setZoom(1);
            setCanvasOffset({ x: 0, y: 0 });
            setFramePos({ x: 0, y: 0 });
          }}
          className="text-muted-foreground hover:text-foreground h-10 w-10 rounded-xl transition-all hover:bg-transparent"
          title="Reset View"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>


      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="overflow-hidden border-zinc-800 bg-zinc-950 p-0 text-white sm:max-w-sm">
          <div className="flex flex-col items-center justify-center gap-8 p-8">
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                Scan for mobile
              </h2>
              <p className="text-xs text-zinc-500">
                Open this screen on your device
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-2xl">
              <QRCodeSVG value={qrCodeUrl} size={180} />
            </div>

            <div className="flex w-full flex-col gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 font-mono text-[11px] leading-relaxed break-all text-zinc-400">
                {qrCodeUrl}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(qrCodeUrl);
                  toast.success("Link copied to clipboard");
                }}
                className="h-11 w-full gap-2 rounded-xl border-zinc-800 bg-zinc-900 text-xs font-medium hover:bg-zinc-800 hover:text-white"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Theme Dialog */}
      <Dialog open={isCreateThemeOpen} onOpenChange={setIsCreateThemeOpen}>
        <DialogContent className="bg-background border-border text-foreground rounded-3xl p-6 shadow-2xl sm:max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold tracking-tight">
               Create Theme (Design System)
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
               Describe the visual direction, base colors, and mood of the new style guide. The generator will create color ramps and typography tokens.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateThemeSubmit} className="space-y-4 pt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground px-1">
                 Creative Prompt
              </label>
              <textarea
                value={themePrompt}
                onChange={(e) => setThemePrompt(e.target.value)}
                placeholder="e.g. A retro cybernetic theme with neon green accents, dark charcoal cards, and futuristic monospaced headers..."
                className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground/40 focus:ring-primary/50 min-h-[100px] w-full rounded-2xl border px-4 py-3 text-xs leading-relaxed transition-all focus:ring-1 focus:outline-none resize-none"
                autoFocus
                required
              />
            </div>
            <DialogFooter className="flex flex-row items-center gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateThemeOpen(false)}
                className="text-muted-foreground hover:bg-secondary hover:text-foreground h-9 flex-1 rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!themePrompt.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 flex-1 rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Create Theme
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Custom Theme Dialog */}
      <Dialog open={isCustomThemeOpen} onOpenChange={setIsCustomThemeOpen}>
        <DialogContent className="bg-background border-border text-foreground rounded-3xl p-6 shadow-2xl sm:max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold tracking-tight">
               Create Custom Theme
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
               Manually configure colors and typography tokens to establish your project's custom design system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCustomThemeSubmit} className="space-y-4 pt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground px-1">
                 Theme/Brand Name
              </label>
              <input
                type="text"
                value={customThemeName}
                onChange={(e) => setCustomThemeName(e.target.value)}
                placeholder="e.g. Horizon Ethos, Cyberpunk Neon..."
                className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground/40 focus:ring-primary/50 w-full rounded-xl border px-4 py-2.5 text-xs transition-all focus:ring-1 focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground px-1">Primary Color</label>
                <div className="flex items-center gap-2 bg-secondary/40 border border-border rounded-xl px-3 py-1.5">
                  <input type="color" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="w-6 h-6 rounded-full border-none cursor-pointer p-0 bg-transparent shrink-0" />
                  <span className="text-[11px] font-mono uppercase text-foreground">{customPrimary}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground px-1">Secondary Color</label>
                <div className="flex items-center gap-2 bg-secondary/40 border border-border rounded-xl px-3 py-1.5">
                  <input type="color" value={customSecondary} onChange={(e) => setCustomSecondary(e.target.value)} className="w-6 h-6 rounded-full border-none cursor-pointer p-0 bg-transparent shrink-0" />
                  <span className="text-[11px] font-mono uppercase text-foreground">{customSecondary}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground px-1">Background Color</label>
                <div className="flex items-center gap-2 bg-secondary/40 border border-border rounded-xl px-3 py-1.5">
                  <input type="color" value={customBackground} onChange={(e) => setCustomBackground(e.target.value)} className="w-6 h-6 rounded-full border-none cursor-pointer p-0 bg-transparent shrink-0" />
                  <span className="text-[11px] font-mono uppercase text-foreground">{customBackground}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground px-1">Foreground (Text)</label>
                <div className="flex items-center gap-2 bg-secondary/40 border border-border rounded-xl px-3 py-1.5">
                  <input type="color" value={customForeground} onChange={(e) => setCustomForeground(e.target.value)} className="w-6 h-6 rounded-full border-none cursor-pointer p-0 bg-transparent shrink-0" />
                  <span className="text-[11px] font-mono uppercase text-foreground">{customForeground}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground px-1">Typography Font</label>
              <Select value={customFont} onValueChange={(val) => setCustomFont(val)}>
                <SelectTrigger className="w-full bg-secondary/40 border-border text-foreground rounded-xl h-9 text-xs">
                  <SelectValue placeholder="Select a font" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground z-[150]">
                  <SelectItem value="Inter">Inter (Modern & Clean)</SelectItem>
                  <SelectItem value="Poppins">Poppins (Friendly & Rounded)</SelectItem>
                  <SelectItem value="Playfair Display">Playfair Display (Elegant Serif)</SelectItem>
                  <SelectItem value="Fira Code">Fira Code (Futuristic Monospace)</SelectItem>
                  <SelectItem value="Outfit">Outfit (Geometric & Bold)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="flex flex-row items-center gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCustomThemeOpen(false)}
                className="text-muted-foreground hover:bg-secondary hover:text-foreground h-9 flex-1 rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!customThemeName.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 flex-1 rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Create Theme
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Properties Inspector (Right Overlay) */}
      <SecondarySidebar commitEdits={() => onSave()} />
    </main>
  );
}
