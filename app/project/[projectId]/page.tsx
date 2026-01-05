"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  Plus,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Search,
  ZoomIn,
  ZoomOut,
  MoreVertical,
  Smartphone,
  Monitor,
  CheckCircle2,
  Globe,
  X,
  Loader2,
  Edit2,
  Columns,
  Share2,
  Maximize2,
  Download,
  RotateCcw,
  MousePointer2,
  SearchIcon,
  Layout,
  MessageSquareIcon,
  Menu,
  Pencil,
  Hand,
  Image as ImageIcon,
  User,
  Zap,
  Code,
  ExternalLink,
  FileText,
  MousePointerClick,
  Trash2,
  GripVertical,
  ThumbsUp,
  ThumbsDown,
  Eye,
  MoreHorizontal,
  Tablet,
  Palette,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DefaultChatTransport } from "ai";
import { extractArtifacts, stripArtifact, type Artifact } from "@/lib/artifact-renderer";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageAttachments,
  MessageAttachment,
} from "@/components/ai-elements/message";
import { ElementSettings } from "./element-settings";
import { ThemeSettings } from "./theme-settings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import JSZip from "jszip";
import html2canvas from "html2canvas";
import { Editor } from "@monaco-editor/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Project {
  id: string;
  title: string;
  messages: any[];
  canvasData?: any;
}


const getInjectedHTML = (html: string) => {
  const script = `
    <script>
      let lastHeight = 0;
      const sendHeight = () => {
        const height = Math.ceil(Math.max(
          document.body.scrollHeight, 
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight
        ));
        
        // Only update if height changed by more than 5px to avoid jitter
        if (Math.abs(height - lastHeight) > 5) {
          lastHeight = height;
          window.parent.postMessage({ type: 'HEIGHT_UPDATE', height }, '*');
        }
      };

      const observer = new MutationObserver(sendHeight);
      window.onload = () => {
        sendHeight();
        observer.observe(document.body, { 
          childList: true, 
          subtree: true, 
          attributes: true 
        });
        // Multi-stage check to handle complex layouts/late loads
        setTimeout(sendHeight, 100);
        setTimeout(sendHeight, 500);
        setTimeout(sendHeight, 1000);
        setTimeout(sendHeight, 3000);
      };

      try {
        new ResizeObserver(sendHeight).observe(document.documentElement);
      } catch (e) {
        console.error('ResizeObserver failed', e);
      }

      window.addEventListener('message', (event) => {
        if (event.data.type === 'UPDATE_CONTENT') {
          const parser = new DOMParser();
          const newDoc = parser.parseFromString(event.data.content, 'text/html');
          
          // Update head (styles, links)
          const newHead = newDoc.head.innerHTML;
          if (document.head.innerHTML !== newHead) {
            document.head.innerHTML = newHead;
          }

          // Update body
          document.body.innerHTML = newDoc.body.innerHTML;
          
          // Re-trigger height update
          sendHeight();
        }
      });
    </script>
    <style>
      ::-webkit-scrollbar { display: none; }
      html, body { 
        height: auto !important; 
        min-height: 100% !important; 
        overflow: visible !important;
        -ms-overflow-style: none; 
        scrollbar-width: none; 
        margin: 0; 
        padding: 0; 
        background: var(--background); 
        transition: background 0.3s ease; 
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .edit-hover-highlight {
        outline: 2px dotted #6366f1 !important;
        outline-offset: 2px !important;
        cursor: pointer !important;
      }
      .edit-selected-highlight {
        outline: 2px solid #6366f1 !important;
        outline-offset: 2px !important;
      }
    </style>
  `;
  if (html.toLowerCase().includes('</body>')) {
    return html.replace(/<\/body>/i, `${script}</body>`);
  }
  return `${html}${script}`;
};

const sanitizeDocumentHtml = (doc: Document, originalHtml: string) => {
  const root = doc.documentElement;
  if (!root) return originalHtml;

  const clone = root.cloneNode(true) as HTMLElement;
  const walker = doc.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);

  let current = walker.currentNode as HTMLElement | null;
  while (current) {
    if (current.style) {
      current.classList.remove('edit-hover-highlight');
      current.classList.remove('edit-selected-highlight');
      if (current.classList.length === 0) {
        current.removeAttribute('class');
      }
    }
    if (current.getAttribute("contenteditable") === "true") {
      current.removeAttribute("contenteditable");
    }
    current = walker.nextNode() as HTMLElement | null;
  }

  return "<!DOCTYPE html>" + clone.outerHTML;
};


const ModernShimmer = ({ appliedTheme }: { type?: string; appliedTheme?: any }) => {
  return (
    <div 
      className="absolute inset-0 z-50 overflow-hidden pointer-events-none" 
      style={{ backgroundColor: appliedTheme?.cssVars.background || 'var(--background)' }}
    >
      {/* Standard, Clean Shimmer Effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.15) 50%, 
            transparent 100%
          )`,
          width: '60%',
          transform: 'skewX(-20deg) translateX(-200%)',
          animation: 'shimmer-standard 1.8s infinite linear',
        }}
      />

      <style>{`
        @keyframes shimmer-standard {
          0% { transform: skewX(-20deg) translateX(-250%); }
          100% { transform: skewX(-20deg) translateX(450%); }
        }
      `}</style>
    </div>
  );
};


export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const previewRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<{ url: string; isUploading: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [throttledArtifacts, setThrottledArtifacts] = useState<Artifact[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'hand' | 'interact'>('select');
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [framePos, setFramePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingFrame, setIsDraggingFrame] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [dynamicFrameHeights, setDynamicFrameHeights] = useState<Record<number, number>>({});
  const [selectedArtifactIndex, setSelectedArtifactIndex] = useState<number | null>(null);
  const iframeRefs = useRef<Record<number, HTMLIFrameElement | null>>({});
  const [leftSidebarMode, setLeftSidebarMode] = useState<'chat' | 'properties' | 'theme'>('chat');
  const isEditMode = leftSidebarMode === 'properties';
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [appliedTheme, setAppliedTheme] = useState<any>(null);
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);
  const [hoveredEl, setHoveredEl] = useState<HTMLElement | null>(null);
  const [artifactPreviewModes, setArtifactPreviewModes] = useState<Record<number, 'mobile' | 'tablet' | 'desktop' | null>>({});
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);
  const [viewingCode, setViewingCode] = useState("");
  const [viewingTitle, setViewingTitle] = useState("");
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [regenerateInstructions, setRegenerateInstructions] = useState("");
  const [processingArtifact, setProcessingArtifact] = useState<Artifact | null>(null);

  // Refs to keep track of state in wheel event listeners without re-attaching
  const zoomRef = useRef(zoom);
  const canvasOffsetRef = useRef(canvasOffset);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { canvasOffsetRef.current = canvasOffset; }, [canvasOffset]);

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        projectId,
      },
    }),
    onError: (error) => {
      console.error(error);
      toast.error("Engine has been error occurred. Please try again.");
    },
    onFinish: (message: any) => {
      const textContent = (message.parts?.find((p: any) => p.type === 'text') as any)?.text || message.content;
      if (typeof textContent === 'string') {
        const artifactData = extractArtifacts(textContent);
        if (artifactData.length > 0) {
          // Merge with existing artifacts to preserve positions
          const mergeArtifacts = (prev: any[]) => {
            const updated = [...prev];
            artifactData.forEach(newArt => {
              const existingIndex = updated.findIndex(a => a.title === newArt.title);
              if (existingIndex >= 0) {
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  content: newArt.content,
                  isComplete: true
                };
              } else {
                const lastArt = updated[updated.length - 1];
                const getWidth = (t: string) => t === 'app' ? 380 : t === 'web' ? 1024 : 800;
                const newX = lastArt ? (lastArt.x || 0) + getWidth(lastArt.type) + 80 : 0;
                updated.push({ ...newArt, x: newX, y: 0, isComplete: true });
              }
            });
            return updated;
          };

          setArtifacts(mergeArtifacts);
          setThrottledArtifacts(mergeArtifacts);
        } else if (textContent.toLowerCase().includes('<!doctype') || textContent.toLowerCase().includes('<html')) {
           toast.error("Design engine produced an incomplete result.");
        }
      }
    },
    onData: (data) => {
       // Optional: handle custom data if backend sends it
       console.log(data);
    }
  });

  useEffect(() => {
    const fetchProjectAndInitialize = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error("Project not found");
        const data = await res.json();
        setProject(data);
        
        if (data.canvasData) {
          if (data.canvasData.zoom) setZoom(data.canvasData.zoom);
          if (data.canvasData.canvasOffset) setCanvasOffset(data.canvasData.canvasOffset);
          if (data.canvasData.framePos) setFramePos(data.canvasData.framePos);
          if (data.canvasData.artifacts) {
            setArtifacts(data.canvasData.artifacts);
            setThrottledArtifacts(data.canvasData.artifacts);
          }
          if (data.canvasData.appliedTheme) {
            setAppliedTheme(data.canvasData.appliedTheme);
            setActiveThemeId(data.canvasData.appliedTheme.id);
          }
        } else {
           // Reset view for empty/new projects
           setCanvasOffset({ x: 0, y: 0 });
           setZoom(1);
        }

        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }

        const pendingPromptRaw = sessionStorage.getItem(`pending_prompt_${projectId}`);
        if (pendingPromptRaw) {
          const { content, attachments: initialAttachments } = JSON.parse(pendingPromptRaw);
          sessionStorage.removeItem(`pending_prompt_${projectId}`);
          
          sendMessage({
            text: content,
            files: initialAttachments.map((url: string) => ({ type: "file" as const, url, mediaType: "image/*" })),
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load workspace");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchProjectAndInitialize();
  }, [projectId, sendMessage, setMessages, router]);

  const lastUpdateRef = useRef(Date.now());
  useEffect(() => {
    const lastAssistantMessage = (messages as any[]).filter(m => m.role === 'assistant').at(-1);
    if (!lastAssistantMessage) {
        if (messages.length === 0) {
            setArtifacts([]);
            setThrottledArtifacts([]);
        }
        return;
    }

    const textContent = (lastAssistantMessage.parts?.find((p: any) => p.type === 'text') as any)?.text || (lastAssistantMessage as any).content;
    
    if (typeof textContent === 'string' && textContent.length > 0) {
      const artifactData = extractArtifacts(textContent);
      
      if (artifactData.length > 0) {
        // 1. Maintain the full state in 'artifacts' for internal reference
        setArtifacts(prev => {
           const updated = [...prev];
           artifactData.forEach(newArt => {
             const existingIndex = updated.findIndex(a => a.title === newArt.title);
             if (existingIndex >= 0) {
               updated[existingIndex] = {
                 ...updated[existingIndex],
                 content: newArt.content,
                 isComplete: newArt.isComplete
               };
             } else {
               updated.push({ ...newArt, x: 0, y: 0 });
             }
           });
           return updated;
        });
        
        // 2. Manage the visible UI (throttledArtifacts)
        setThrottledArtifacts(prev => {
            const updated = [...prev];
            let changed = false;

            artifactData.forEach(newArt => {
              const existingIndex = updated.findIndex(a => a.title === newArt.title);
              
              if (existingIndex === -1) {
                const lastArt = updated[updated.length - 1];
                const getWidth = (t: string) => t === 'app' ? 380 : t === 'web' ? 1024 : 800;
                const newX = lastArt ? (lastArt.x || 0) + getWidth(lastArt.type) + 80 : 0;
                updated.push({ 
                  ...newArt, 
                  content: "", 
                  x: newX, 
                  y: 0, 
                  isComplete: false 
                });
                changed = true;
              } else {
                 // Existing artifact: 
                 // If we are still streaming, we mark it as NOT complete (isComplete: false)
                 // but we DON'T update the content yet to avoid partial/broken renders.
                 // This ensures the OLD version stays visible until the NEW version is ready.
                 if (status === 'streaming' && updated[existingIndex].isComplete) {
                    updated[existingIndex] = { ...updated[existingIndex], isComplete: false };
                    changed = true;
                 }
                 
                 // If it's DONE (status ready or onFinish already triggered), 
                 // the onFinish callback handles the final content update.
                 // We can also double-check here just in case.
                 if (status === 'ready' && !updated[existingIndex].isComplete && newArt.isComplete) {
                    updated[existingIndex] = { 
                      ...updated[existingIndex], 
                      content: newArt.content, 
                      isComplete: true 
                    };
                    changed = true;
                 }
              }
            });
            
            return changed ? updated : prev;
        });
      } 
    }
  }, [messages, status]);

  // This logic should now be handled inside the rendering loop for each iframe

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'HEIGHT_UPDATE' && typeof event.data.height === 'number') {
        const sourceWindow = event.source as Window;
        // Find which iframe sent the message
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe, index) => {
          if (iframe.contentWindow === sourceWindow) {
            setDynamicFrameHeights(prev => {
              const currentHeight = prev[index] || 0;
              // Only update if difference is > 4px to avoid micro-jitter loops
              if (Math.abs(currentHeight - event.data.height) > 4) {
                 return { ...prev, [index]: event.data.height };
              }
              return prev;
            });
          }
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const commitEdits = useCallback(() => {
    if (selectedArtifactIndex === null) return;
    const iframe = iframeRefs.current[selectedArtifactIndex];
    if (!iframe?.contentDocument) return;

    const currentArtifact = throttledArtifacts[selectedArtifactIndex];
    if (!currentArtifact) return;

    const cleanHtml = sanitizeDocumentHtml(iframe.contentDocument, currentArtifact.content);
    
    // Update the artifacts locally
    const updatedArtifacts = [...throttledArtifacts];
    updatedArtifacts[selectedArtifactIndex] = { ...currentArtifact, content: cleanHtml };
    
    setThrottledArtifacts(updatedArtifacts);
    setArtifacts(updatedArtifacts);
    toast.info("Edits applied locally. Click Save to persist.");
  }, [selectedArtifactIndex, throttledArtifacts]);

  const applyTheme = useCallback((theme: any) => {
    if (selectedArtifactIndex === null) {
        toast.error("Select a screen to apply theme");
        return;
    }
    const iframe = iframeRefs.current[selectedArtifactIndex];
    if (!iframe || !iframe.contentDocument) return;

    const doc = iframe.contentDocument;
    let styleEl = doc.getElementById('theme-overrides') as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = doc.createElement('style');
      styleEl.id = 'theme-overrides';
      doc.head.appendChild(styleEl);
    }

    const getThemeCSS = (theme: any) => `
      :root {
        --background: ${theme.cssVars.background} !important;
        --foreground: ${theme.cssVars.foreground} !important;
        --card: ${theme.cssVars.card} !important;
        --card-foreground: ${theme.cssVars.cardForeground} !important;
        --popover: ${theme.cssVars.popover} !important;
        --popover-foreground: ${theme.cssVars.popoverForeground} !important;
        --primary: ${theme.cssVars.primary} !important;
        --primary-foreground: ${theme.cssVars.primaryForeground} !important;
        --secondary: ${theme.cssVars.secondary} !important;
        --secondary-foreground: ${theme.cssVars.secondaryForeground} !important;
        --muted: ${theme.cssVars.muted} !important;
        --muted-foreground: ${theme.cssVars.mutedForeground} !important;
        --accent: ${theme.cssVars.accent} !important;
        --accent-foreground: ${theme.cssVars.accentForeground} !important;
        --destructive: ${theme.cssVars.destructive} !important;
        --border: ${theme.cssVars.border} !important;
        --input: ${theme.cssVars.input} !important;
        --ring: ${theme.cssVars.ring} !important;
        --radius: ${theme.cssVars.radius} !important;
        ${theme.cssVars.fontSans ? `--font-sans: ${theme.cssVars.fontSans} !important;` : ''}
      }
      body {
        background-color: var(--background) !important;
        color: var(--foreground) !important;
        ${theme.cssVars.fontSans ? `font-family: var(--font-sans) !important;` : ''}
      }
    `;

    styleEl.textContent = getThemeCSS(theme);
    setActiveThemeId(theme.id);
    setAppliedTheme(theme);
    toast.success(`Applied ${theme.name} theme locally. Click Save to persist.`);
  }, [selectedArtifactIndex, artifacts, zoom, canvasOffset, framePos, projectId]);

  // Re-apply theme when artifacts or theme change
  useEffect(() => {
    if (!appliedTheme || throttledArtifacts.length === 0) return;
    
    const getThemeCSS = (theme: any) => `
      :root {
        --background: ${theme.cssVars.background} !important;
        --foreground: ${theme.cssVars.foreground} !important;
        --card: ${theme.cssVars.card} !important;
        --card-foreground: ${theme.cssVars.cardForeground} !important;
        --popover: ${theme.cssVars.popover} !important;
        --popover-foreground: ${theme.cssVars.popoverForeground} !important;
        --primary: ${theme.cssVars.primary} !important;
        --primary-foreground: ${theme.cssVars.primaryForeground} !important;
        --secondary: ${theme.cssVars.secondary} !important;
        --secondary-foreground: ${theme.cssVars.secondaryForeground} !important;
        --muted: ${theme.cssVars.muted} !important;
        --muted-foreground: ${theme.cssVars.mutedForeground} !important;
        --accent: ${theme.cssVars.accent} !important;
        --accent-foreground: ${theme.cssVars.accentForeground} !important;
        --destructive: ${theme.cssVars.destructive} !important;
        --border: ${theme.cssVars.border} !important;
        --input: ${theme.cssVars.input} !important;
        --ring: ${theme.cssVars.ring} !important;
        --radius: ${theme.cssVars.radius} !important;
        ${theme.cssVars.fontSans ? `--font-sans: ${theme.cssVars.fontSans} !important;` : ''}
      }
      body {
        background-color: var(--background) !important;
        color: var(--foreground) !important;
        ${theme.cssVars.fontSans ? `font-family: var(--font-sans) !important;` : ''}
      }
    `;

    const timer = setTimeout(() => {
        throttledArtifacts.forEach((_, index) => {
            const iframe = iframeRefs.current[index];
            if (!iframe || !iframe.contentDocument) return;
            
            const doc = iframe.contentDocument;
            let styleEl = doc.getElementById('theme-overrides') as HTMLStyleElement;
            if (!styleEl) {
              styleEl = doc.createElement('style');
              styleEl.id = 'theme-overrides';
              doc.head.appendChild(styleEl);
            }
            styleEl.textContent = getThemeCSS(appliedTheme);
        });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [appliedTheme, throttledArtifacts]);

  // Handle Edit Mode selection
  useEffect(() => {
    if (selectedArtifactIndex === null) return;
    const iframe = iframeRefs.current[selectedArtifactIndex];
    if (!iframe || !isEditMode) {
      setHoveredEl(null);
      setSelectedEl(null);
      return;
    }

    const doc = iframe.contentDocument;
    if (!doc || !doc.body) return;

    const handlePointerMove = (e: PointerEvent) => {
        const target = e.target as HTMLElement;
        if (!target || target === doc.body || target === doc.documentElement) return;
        
        if (hoveredEl && hoveredEl !== target && hoveredEl !== selectedEl) {
            hoveredEl.classList.remove('edit-hover-highlight');
        }
        
        if (target !== selectedEl) {
            setHoveredEl(target);
            target.classList.add('edit-hover-highlight');
        }
    };

    const handlePointerLeave = () => {
        if (hoveredEl && hoveredEl !== selectedEl) {
            hoveredEl.classList.remove('edit-hover-highlight');
        }
        setHoveredEl(null);
    };

    const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.target as HTMLElement;
        if (!target || target === doc.body || target === doc.documentElement) return;

        if (selectedEl) {
            selectedEl.classList.remove('edit-selected-highlight');
        }

        setSelectedEl(target);
        target.classList.add('edit-selected-highlight');
        target.classList.remove('edit-hover-highlight');
    };

    const handleDoubleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target || target === doc.body) return;
        target.setAttribute("contenteditable", "true");
        target.focus();
        
        const handleBlur = () => {
            target.removeAttribute("contenteditable");
            commitEdits();
            target.removeEventListener("blur", handleBlur);
        };
        target.addEventListener("blur", handleBlur);
    };

    doc.body.addEventListener('pointermove', handlePointerMove, true);
    doc.body.addEventListener('pointerleave', handlePointerLeave, true);
    doc.body.addEventListener('click', handleClick, true);
    doc.body.addEventListener('dblclick', handleDoubleClick, true);

    return () => {
        doc.body.removeEventListener('pointermove', handlePointerMove, true);
        doc.body.removeEventListener('pointerleave', handlePointerLeave, true);
        doc.body.removeEventListener('click', handleClick, true);
        doc.body.removeEventListener('dblclick', handleDoubleClick, true);
        
        // Clean up highlights on exit
        if (hoveredEl) hoveredEl.classList.remove('edit-hover-highlight');
        if (selectedEl) selectedEl.classList.remove('edit-selected-highlight');
    };
  }, [isEditMode, hoveredEl, selectedEl, commitEdits]);

  // Save canvas data on change
  const handleSave = useCallback(async () => {
    if (!project || loading) return;
    
    const savePromise = fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canvasData: {
          zoom,
          canvasOffset,
          framePos,
          artifacts,
          appliedTheme
        },
      }),
    });

    toast.promise(savePromise, {
      loading: 'Saving project...',
      success: 'Project saved successfully',
      error: 'Failed to save project'
    });
  }, [project, loading, projectId, zoom, canvasOffset, framePos, artifacts, appliedTheme]);

  // Shortcut for saving (Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'hand') {
      setIsPanning(true);
      dragStart.current = { x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y };
    }
  };





  // Auto-focus on new artifacts
  const prevArtifactsCount = useRef(0);
  useEffect(() => {
    prevArtifactsCount.current = throttledArtifacts.length;
  }, [throttledArtifacts.length]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && activeTool === 'hand') {
      setCanvasOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    } else if (isDraggingFrame && activeTool === 'select' && selectedArtifactIndex !== null) {
      const newX = (e.clientX - dragStart.current.x) / zoom;
      const newY = (e.clientY - dragStart.current.y) / zoom;
      
      setThrottledArtifacts(prev => {
          const next = [...prev];
          if (next[selectedArtifactIndex]) {
            next[selectedArtifactIndex] = { ...next[selectedArtifactIndex], x: newX, y: newY };
          }
          return next;
      });
      setArtifacts(prev => {
          const next = [...prev];
          if (next[selectedArtifactIndex]) {
            next[selectedArtifactIndex] = { ...next[selectedArtifactIndex], x: newX, y: newY };
          }
          return next;
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingFrame(false);
  };

  const startDraggingFrame = (e: React.MouseEvent, index: number) => {
    if (activeTool === 'select') {
      e.stopPropagation();
      setIsDraggingFrame(true);
      setSelectedArtifactIndex(index);
      const artifact = throttledArtifacts[index];
      const posX = artifact?.x || 0;
      const posY = artifact?.y || 0;
      dragStart.current = { x: e.clientX - posX * zoom, y: e.clientY - posY * zoom };
    }
  };

  useEffect(() => {
    const element = previewRef.current;
    if (!element || loading) return;

    const handleGlobalWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    const handleWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        // Consistent scaling factor for smooth zooming
        const scaleFactor = Math.pow(1.2, -e.deltaY / 120);
        const prevZoom = zoomRef.current;
        const prevOffset = canvasOffsetRef.current;
        
        const rect = element.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        // Calculate position relative to the center of the container
        const cx = mx - rect.width / 2;
        const cy = my - rect.height / 2;

        const newZoom = Math.min(Math.max(prevZoom * scaleFactor, 0.1), 5);
        
        // Zoom relative to the cursor position
        const worldX = (cx - prevOffset.x) / prevZoom;
        const worldY = (cy - prevOffset.y) / prevZoom;
        
        setZoom(newZoom);
        setCanvasOffset({
          x: cx - worldX * newZoom,
          y: worldY === undefined ? prevOffset.y : cy - worldY * newZoom
        });
      } else {
        setCanvasOffset(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    element.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
      element.removeEventListener('wheel', handleWheelNative);
    };
  }, [loading]);

  const handleWheel = (e: React.WheelEvent) => {
    // This is now handled by the native listener for preventDefault support
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');
      
      if (e.code === 'Space' && !isInput && !e.repeat) {
        e.preventDefault();
        setActiveTool('hand');
      }

      if (!isInput) {
        if (e.key === 'v') setActiveTool('select');
        if (e.key === 'h') setActiveTool('hand');
        if (e.key === 'i') setActiveTool('interact');
      }
      
      if ((e.ctrlKey || e.metaKey) && !isInput) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoom(prev => Math.min(prev * 1.2, 5));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoom(prev => Math.max(prev / 1.2, 0.1));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(1);
          setCanvasOffset({ x: 0, y: 0 });
          setFramePos({ x: 0, y: 0 });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    const newPlaceholders = fileList.map(file => ({
      url: URL.createObjectURL(file),
      isUploading: true
    }));
    
    setAttachments(prev => [...prev, ...newPlaceholders]);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const placeholderUrl = newPlaceholders[i].url;

      try {
        const sigRes = await fetch("/api/cloudinary-signature");
        const sigData = await sigRes.json();
        const uploadApi = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/upload`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", sigData.apiKey);
        formData.append("timestamp", sigData.timestamp.toString());
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder || "sketch-wireframe-to-design");

        const uploadRes = await fetch(uploadApi, { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        
        setAttachments(prev => prev.map(attr => 
          attr.url === placeholderUrl 
            ? { url: uploadData.secure_url, isUploading: false } 
            : attr
        ));
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
        setAttachments(prev => prev.filter(attr => attr.url !== placeholderUrl));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const copyCode = () => {
    if (selectedArtifactIndex === null) return;
    const currentArtifact = throttledArtifacts[selectedArtifactIndex];
    if (!currentArtifact) return;
    navigator.clipboard.writeText(currentArtifact.content);
    toast.success("Code copied to clipboard");
  };

  const exportAsHTML = () => {
    if (selectedArtifactIndex === null) return;
    const currentArtifact = throttledArtifacts[selectedArtifactIndex];
    if (!currentArtifact) return;
    const fullHTML = getInjectedHTML(currentArtifact.content);
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design_${projectId}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Design exported as HTML");
  };

  const openInNewTab = () => {
    if (selectedArtifactIndex === null) return;
    const currentArtifact = throttledArtifacts[selectedArtifactIndex];
    if (!currentArtifact) return;
    const fullHTML = getInjectedHTML(currentArtifact.content);
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    
    sendMessage({
      text: input.trim(),
      files: attachments.map(a => ({ type: "file" as const, url: a.url, mediaType: "image/*" }))
    });
    
    setAttachments([]);
    setInput("");
  };

  const handleArtifactAction = (action: 'more' | 'regenerate' | 'variations', artifact: Artifact) => {
    let prompt = "";
    if (action === 'more') {
        prompt = `Based on the design of the "${artifact.title}" screen, create 2-3 additional screens that would naturally belong in this same flow (e.g., if this is a dashboard, create a settings Page, a user profile, and a detailed analytics view). Maintain strict visual consistency with the existing design system, colors, and typography.`;
    } else if (action === 'regenerate') {
        setProcessingArtifact(artifact);
        setRegenerateInstructions("");
        setIsRegenerateDialogOpen(true);
        return;
    } else if (action === 'variations') {
        prompt = `Generate 3 distinct layout variations of the "${artifact.title}" screen. Each variation should explore a different design approach (e.g., more minimal, more data-dense, or a different functional layout) while staying true to the overall theme. Please provide 3 separate artifact blocks, titled "${artifact.title} (Var 1)", "${artifact.title} (Var 2)", and "${artifact.title} (Var 3)".`;
    }

    if (prompt) {
        sendMessage({ text: prompt });
        toast.info(action === 'more' ? "Architecting more pages..." : action === 'regenerate' ? "Regenerating screen..." : "Exploring variations...");
    }
  };

  const handleRegenerateSubmit = () => {
    if (!processingArtifact) return;
    
    let prompt = "";
    if (regenerateInstructions.trim()) {
      prompt = `Please regenerate the "${processingArtifact.title}" screen with these specific instructions: ${regenerateInstructions.trim()}. Maintain the overall theme and structure but FOCUS on the requested changes. IMPORTANT: Use the EXACT title "${processingArtifact.title}" in your artifact tag so it replaces the previous version.`;
    } else {
      prompt = `Please regenerate and improve the "${processingArtifact.title}" screen. Refine the layout, enhance the visual hierarchy, and ensure it follows the highest-fidelity design standards. IMPORTANT: Use the EXACT title "${processingArtifact.title}" in your artifact tag so it replaces the previous version.`;
    }

    sendMessage({ text: prompt });
    toast.info("Regenerating screen...");
    setIsRegenerateDialogOpen(false);
    setProcessingArtifact(null);
    setRegenerateInstructions("");
  };

  const deleteArtifact = (index: number) => {
    setThrottledArtifacts(prev => prev.filter((_, i) => i !== index));
    setArtifacts(prev => prev.filter((_, i) => i !== index));
    setSelectedArtifactIndex(null);
    toast.success("Screen removed from workspace");
  };

  const captureFrameImage = async (index: number): Promise<string | null> => {
    const iframe = iframeRefs.current[index];
    if (!iframe || !iframe.contentDocument?.body) return null;
    
    try {
        const canvas = await html2canvas(iframe.contentDocument.body, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            scale: 2 // High quality
        });
        return canvas.toDataURL("image/png");
    } catch (error) {
        console.error("Capture error:", error);
        return null;
    }
  };

  const handleDownloadImage = async (index: number) => {
    toast.loading("Capturing high-fidelity image...");
    const dataUrl = await captureFrameImage(index);
    toast.dismiss();
    
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `${throttledArtifacts[index].title.replace(/\s+/g, '_')}_UI.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Image downloaded");
    } else {
      toast.error("Failed to capture image");
    }
  };

  const handleExportZip = async (index: number) => {
    toast.loading("Generating production assets...");
    const artifact = throttledArtifacts[index];
    const dataUrl = await captureFrameImage(index);
    
    const zip = new JSZip();
    const folderName = artifact.title.replace(/\s+/g, '_');
    const folder = zip.folder(folderName);
    
    if (folder) {
        // Add HTML
        folder.file("index.html", getInjectedHTML(artifact.content));
        
        // Add PNG
        if (dataUrl) {
            const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
            folder.file("preview.png", base64Data, { base64: true });
        }
    }
    
    const content = await zip.generateAsync({ type: "blob" });
    toast.dismiss();
    
    const link = document.createElement('a');
    link.download = `${folderName}_Package.zip`;
    link.href = URL.createObjectURL(content);
    link.click();
    toast.success("Project assets exported");
  };

  const openCodeViewer = (index: number) => {
    const artifact = throttledArtifacts[index];
    setViewingCode(artifact.content);
    setViewingTitle(artifact.title);
    setIsCodeViewerOpen(true);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <span className="text-zinc-500 text-sm font-medium">Entering Workspace...</span>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      
      {/* Left Sidebar - Chat, Properties, or Theme */}
      <aside className="w-[380px] flex flex-col border-r bg-sidebar z-20">
        {leftSidebarMode === 'properties' ? (
          <ElementSettings 
            selectedEl={selectedEl} 
            clearSelection={() => setSelectedEl(null)}
            onUpdate={commitEdits}
          />
        ) : leftSidebarMode === 'theme' ? (
          <ThemeSettings 
            activeThemeId={activeThemeId}
            onApplyTheme={applyTheme}
          />
        ) : (
          <>
            <header className="flex items-center justify-between px-4 py-2 h-14 border-b bg-sidebar">
               <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                    <Menu className="h-5 w-5" />
                  </Button>
                  <span className="font-semibold text-[15px] text-foreground tracking-tight">{project.title}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white ml-2">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
               </div>
               <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                  <Columns className="h-4 w-4" />
               </Button>
            </header>

            <div className="flex-1 relative overflow-hidden bg-sidebar">
              <Conversation className="relative h-full">
                <ConversationContent className="p-4 gap-8 scrollbar-hide">
                  {messages.length === 0 ? (
                    <ConversationEmptyState
                      title="Initialize Workspace"
                      description="Describe your vision to generate the first high-fidelity prototype."
                      icon={<MessageSquareIcon className="size-6 text-primary" />}
                    />
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                           {message.role === 'user' ? (
                             <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                <User className="h-4 w-4 text-zinc-400" />
                             </div>
                           ) : (
                             <div className="h-8 w-8 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20">
                                <Logo iconSize={14} showText={false} showBadge={false} />
                             </div>
                           )}
                           <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-bold text-zinc-100 uppercase tracking-wide">
                                   {message.role === 'user' ? 'Professor' : 'Stitch'}
                                </span>
                                {message.role === 'assistant' && (
                                  <div className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-full border shadow-sm">
                                    <span className="text-[10px] font-medium text-muted-foreground">Thinking with 3 Pro</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-2 pl-0">
                                <MessageContent className="p-0 bg-transparent text-foreground leading-relaxed text-[14px]">
                                  {message.parts?.map((part: any, i: number) => {
                                    if (part.type === 'text') {
                                      const textContent = typeof part.text === 'string' ? part.text : part.text?.text;
                                      if (!textContent) return null;
                                      return (
                                        <div key={i} className="whitespace-pre-wrap">
                                           {message.role === 'assistant' ? (
                                             (() => {
                                               const isRawHtml = textContent.toLowerCase().includes('<!doctype') || textContent.toLowerCase().includes('<html');
                                               if (isRawHtml && extractArtifacts(textContent).length === 0) {
                                                  return (
                                                    <div className="flex flex-col gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                      <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest">
                                                        <X className="size-3" />
                                                        Engine Analysis
                                                      </div>
                                                      <p className="text-red-200/80 text-sm">Engine has been error occurred. The generated output was malformed. Please try a different prompt.</p>
                                                    </div>
                                                  );
                                               }
                                               return <MessageResponse>{stripArtifact(textContent)}</MessageResponse>;
                                             })()
                                           ) : (
                                             textContent
                                           )}
                                        </div>
                                      );
                                    }
                                    if (part.type === 'file') {
                                      const fileUrl = typeof part.file === 'string' ? part.file : part.file?.url;
                                      if (!fileUrl) return null;
                                      return (
                                        <div key={i} className="mt-3 rounded-xl overflow-hidden border border-zinc-800 shadow-xl max-w-[200px]">
                                           <img src={fileUrl} alt="Design Reference" className="w-full h-auto object-cover" />
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                                  
                                  {!message.parts && (
                                    <div className="whitespace-pre-wrap">
                                       {message.role === 'assistant' ? (
                                         <MessageResponse>{stripArtifact((message as any).content)}</MessageResponse>
                                       ) : (
                                         (message as any).content
                                       )}
                                    </div>
                                  )}
                                </MessageContent>
                              </div>
                           </div>
                        </div>
                      </div>
                    ))
                  )}
                </ConversationContent>
              </Conversation>
            </div>

            {/* Bottom Chat Input */}
            <div className="p-4 bg-sidebar">
               <div className="relative">
                  <div className="bg-muted/50 rounded-2xl p-4 border border-border shadow-2xl transition-all focus-within:border-primary/50">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCustomSubmit(e);
                        }
                      }}
                      placeholder="Describe your design"
                      className="w-full bg-transparent outline-none resize-none text-[14px] text-foreground placeholder:text-muted-foreground min-h-[40px] max-h-[200px]"
                    />

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/50">
                      <div className="flex items-center gap-1.5">
                        <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800">
                          <Plus className="h-5 w-5" />
                        </Button>
                        <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                           onClick={handleCustomSubmit}
                           disabled={(!input.trim() && attachments.length === 0) || status === 'streaming'}
                           className="h-8 w-8 rounded-lg p-0 bg-white hover:bg-zinc-200 text-black shadow-lg"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
               </div>
               <p className="text-[10px] text-center mt-3 text-zinc-600 font-medium">
                  Stitch can make mistakes. Please check its work.
               </p>
            </div>
          </>
        )}
      </aside>

      {/* Main Preview Area */}
      <main 
        ref={previewRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedArtifactIndex(null);
        }}
        className={cn(
          "flex-1 flex flex-col bg-muted relative overflow-hidden",
          activeTool === 'hand' ? "cursor-grab active:cursor-grabbing" : 
          activeTool === 'select' ? "cursor-default" : "cursor-crosshair"
        )}
      >
         {/* Grid Background */}
         <div 
           className="absolute inset-0 pointer-events-none opacity-[0.03]"
           style={{
             backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
             backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
             transform: `translate(${canvasOffset.x % (20 * zoom)}px, ${canvasOffset.y % (20 * zoom)}px)`
           }}
         />

         {/* Preview Header */}
         <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-30 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
               <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {Math.round(zoom * 100)}%
                  </span>
               </div>
            </div>
            
            <div className="flex items-center gap-4 pointer-events-auto">
               <button 
                 onClick={handleSave}
                 className="flex items-center h-9 px-4 rounded-xl bg-zinc-900 border border-white/10 text-white text-[13px] font-semibold shadow-2xl hover:bg-zinc-800 active:scale-95 transition-all gap-2 group"
               >
                 <Save className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                 Save
               </button>
               <UserMenu />
            </div>
         </header>

         {/* Content Layer */}
         <div 
           className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out select-none"
           style={{
             transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`
           }}
         >
            {throttledArtifacts.length > 0 ? (
              <div 
                className="flex items-start gap-32 p-32"
                style={{
                  transform: `translate(${framePos.x}px, ${framePos.y}px)`,
                  transition: isDraggingFrame ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                {throttledArtifacts.map((artifact, index) => (
                  <div 
                    key={index}
                    onMouseDown={(e) => {
                      setSelectedArtifactIndex(index);
                      if (activeTool === 'select') {
                        startDraggingFrame(e, index);
                      }
                    }}
                    className={cn(
                      "group relative flex flex-col items-center select-none",
                      activeTool === 'hand' ? "cursor-grab" : "cursor-default"
                    )}
                    style={{
                      transform: `translate(${artifact.x || 0}px, ${artifact.y || 0}px)`,
                      transition: isDraggingFrame && selectedArtifactIndex === index ? 'none' : 'transform 0.1s ease-out'
                    }}
                  >
                    {/* Modern Floating Toolbar */}
                    {(selectedArtifactIndex === index || isPanning || isDraggingFrame || (artifact.isComplete && selectedArtifactIndex === index)) && (
                      <div className={cn(
                        "absolute -top-20 left-1/2 -translate-x-1/2 flex items-center gap-3 z-[70] animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto",
                        selectedArtifactIndex !== index && !isPanning && !isDraggingFrame && "opacity-0 group-hover:opacity-100"
                      )} onMouseDown={(e) => e.stopPropagation()}>
                        
                        {/* Main Toolbar Container */}
                        <div className="flex items-center gap-1 px-2 py-1.5 bg-zinc-900 border border-white/5 rounded-2xl shadow-2xl">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 px-3 text-white hover:bg-white/10 rounded-xl flex items-center gap-2 text-[13px] font-medium"
                              >
                                <Sparkles className="h-4 w-4 text-indigo-400" />
                                Generate
                                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-56 bg-zinc-900 border-white/10 text-zinc-200 rounded-xl shadow-2xl p-1.5 z-[100]">
                              <DropdownMenuItem 
                                onClick={() => handleArtifactAction('more', artifact)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer text-[13px] font-medium"
                              >
                                <Plus className="h-4 w-4 text-indigo-400" />
                                Create more pages
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleArtifactAction('regenerate', artifact)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer text-[13px] font-medium"
                              >
                                <RotateCcw className="h-4 w-4 text-emerald-400" />
                                Regenerate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleArtifactAction('variations', artifact)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer text-[13px] font-medium"
                              >
                                <Columns className="h-4 w-4 text-amber-400" />
                                Variations
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                                if (leftSidebarMode === 'properties') {
                                    setLeftSidebarMode('chat');
                                } else {
                                    setLeftSidebarMode('properties');
                                    setActiveTool('select');
                                }
                            }}
                            className={cn(
                                "h-9 w-9 text-white rounded-xl flex items-center justify-center transition-all",
                                leftSidebarMode === 'properties' ? "bg-indigo-600 shadow-lg shadow-indigo-500/20" : "hover:bg-white/10"
                            )}
                            title="Edit Mode"
                          >
                            <Pencil className="h-4 w-4 opacity-70" />
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                                if (leftSidebarMode === 'theme') {
                                    setLeftSidebarMode('chat');
                                } else {
                                    setLeftSidebarMode('theme');
                                }
                            }}
                            className={cn(
                                "h-9 w-9 text-white rounded-xl flex items-center justify-center transition-all",
                                leftSidebarMode === 'theme' ? "bg-indigo-600 shadow-lg shadow-indigo-500/20" : "hover:bg-white/10"
                            )}
                            title="Theme Settings"
                          >
                            <Palette className="h-4 w-4 opacity-70" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 px-3 text-white hover:bg-white/10 rounded-xl flex items-center gap-2 text-[13px] font-medium"
                              >
                                {(() => {
                                  const mode = artifactPreviewModes[index] || (artifact.type === 'app' ? 'mobile' : 'desktop');
                                  if (mode === 'mobile') return <Smartphone className="h-4 w-4 opacity-70" />;
                                  if (mode === 'tablet') return <Tablet className="h-4 w-4 opacity-70" />;
                                  return <Monitor className="h-4 w-4 opacity-70" />;
                                })()}
                                Preview
                                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-48 bg-zinc-900 border-white/10 text-zinc-200 rounded-xl shadow-2xl p-1.5 z-[100]">
                              <DropdownMenuItem 
                                onClick={() => setArtifactPreviewModes(prev => ({ ...prev, [index]: 'mobile' }))}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer text-[13px]"
                              >
                                <div className="flex items-center gap-2">
                                  <Smartphone className="h-4 w-4" /> Mobile
                                </div>
                                <span className="text-[10px] text-zinc-500">380px</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setArtifactPreviewModes(prev => ({ ...prev, [index]: 'tablet' }))}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer text-[13px]"
                              >
                                <div className="flex items-center gap-2">
                                  <Tablet className="h-4 w-4" /> Tablet
                                </div>
                                <span className="text-[10px] text-zinc-500">768px</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setArtifactPreviewModes(prev => ({ ...prev, [index]: 'desktop' }))}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer text-[13px]"
                              >
                                <div className="flex items-center gap-2">
                                  <Monitor className="h-4 w-4" /> Desktop
                                </div>
                                <span className="text-[10px] text-zinc-500">1280px</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <div className="w-[1px] h-4 bg-white/10 mx-1" />
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 w-9 p-0 text-white hover:bg-white/10 rounded-xl flex items-center justify-center font-medium"
                              >
                                <MoreHorizontal className="h-4 w-4 opacity-70" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 bg-zinc-900 border-white/10 text-zinc-200 rounded-xl shadow-2xl p-1.5 z-[100]">
                              <DropdownMenuItem 
                                onClick={() => openCodeViewer(index)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer text-[13px]"
                              >
                                <Code className="h-4 w-4 text-zinc-400" />
                                View Code
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleExportZip(index)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer text-[13px]"
                              >
                                <ExternalLink className="h-4 w-4 text-zinc-400" />
                                Export (ZIP)
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDownloadImage(index)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer text-[13px]"
                              >
                                <ImageIcon className="h-4 w-4 text-zinc-400" />
                                Download Image
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={exportAsHTML}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer text-[13px]"
                              >
                                <Download className="h-4 w-4 text-zinc-400" />
                                Download HTML
                              </DropdownMenuItem>
                              <div className="h-px bg-white/5 my-1" />
                              <DropdownMenuItem 
                                onClick={() => deleteArtifact(index)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-red-500/20 text-red-400 cursor-pointer text-[13px]"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Screen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Feedback Container */}
                        <div className="flex items-center gap-0.5 px-1.5 py-1.5 bg-zinc-900 border border-white/5 rounded-2xl shadow-2xl">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 p-0 text-white hover:bg-white/10 rounded-xl"
                          >
                            <ThumbsUp className="h-4 w-4 opacity-70" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 p-0 text-white hover:bg-white/10 rounded-xl"
                          >
                            <ThumbsDown className="h-4 w-4 opacity-70" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Frame Info Overlay (Title & Code Icon) */}
                     {(selectedArtifactIndex === index || isDraggingFrame || artifact.isComplete) && (
                      <div className="absolute -top-7 left-0 right-0 flex items-center justify-between px-1 pointer-events-none select-none">
                         <span 
                           className="text-[11px] font-black uppercase tracking-widest"
                           style={{ color: appliedTheme?.cssVars.primary || 'var(--primary)' }}
                         >
                           {artifact.title || "Untitled Screen"}
                         </span>
                        <div className="flex items-center gap-2">
                           <Code 
                             className="h-3.5 w-3.5" 
                             style={{ color: appliedTheme?.cssVars.mutedForeground || 'var(--muted-foreground)' }}
                           />
                        </div>
                      </div>
                    )}

                    <div 
                     className={cn(
                       "transition-all duration-300 ease-in-out shadow-[0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden border relative flex-shrink-0",
                       selectedArtifactIndex === index && "ring-2",
                       isDraggingFrame && selectedArtifactIndex === index && "shadow-[0_60px_120px_rgba(0,0,0,0.5)]",
                        (() => {
                         const mode = artifactPreviewModes[index];
                         if (mode === 'mobile') return "w-[380px] rounded-sm";
                         if (mode === 'tablet') return "w-[768px] rounded-sm";
                         if (mode === 'desktop') return "w-[1280px] rounded-sm";
                         
                         return artifact.type === 'app' 
                           ? "w-[380px] rounded-sm" 
                           : artifact.type === 'web'
                             ? "w-[1024px] rounded-sm"
                             : "w-[600px] rounded-sm";
                        })()
                      )}
                       style={{
                         height: !artifactPreviewModes[index] && artifact.type !== 'app' && artifact.type !== 'web' 
                           ? "600px" 
                           : `${dynamicFrameHeights[index] || (artifactPreviewModes[index] === 'mobile' || (artifact.type === 'app' && !artifactPreviewModes[index]) ? 800 : 700)}px`,
                         minHeight: (artifactPreviewModes[index] === 'mobile' || (artifact.type === 'app' && !artifactPreviewModes[index])) ? '800px' : '400px',
                         aspectRatio: (artifactPreviewModes[index] === 'mobile' || (artifact.type === 'app' && !artifactPreviewModes[index])) && !dynamicFrameHeights[index] ? '9/19' : (artifact.type !== 'app' && artifact.type !== 'web' && !artifactPreviewModes[index]) ? '1/1' : undefined,
                         transition: 'width 0.3s ease-in-out',
                         backgroundColor: appliedTheme?.cssVars.background || 'var(--background)',
                         borderColor: selectedArtifactIndex === index ? (appliedTheme?.cssVars.primary || 'var(--primary)') : (appliedTheme?.cssVars.border || 'var(--border)'),
                         boxShadow: selectedArtifactIndex === index ? `0 0 0 2px ${appliedTheme?.cssVars.primary || 'var(--primary)'}40, 0 40px 100px rgba(0,0,0,0.4)` : undefined
                       }}
                    >
                       {/* Selection Handles */}
                       {selectedArtifactIndex === index && (
                         <>
                           <div 
                             className="absolute top-0 left-0 w-2.5 h-2.5 border border-white z-[60] -translate-x-1/2 -translate-y-1/2 rounded-full" 
                             style={{ backgroundColor: appliedTheme?.cssVars.primary || 'var(--primary)' }}
                           />
                           <div 
                             className="absolute top-0 right-0 w-2.5 h-2.5 border border-white z-[60] translate-x-1/2 -translate-y-1/2 rounded-full" 
                             style={{ backgroundColor: appliedTheme?.cssVars.primary || 'var(--primary)' }}
                           />
                           <div 
                             className="absolute bottom-0 left-0 w-2.5 h-2.5 border border-white z-[60] -translate-x-1/2 translate-y-1/2 rounded-full" 
                             style={{ backgroundColor: appliedTheme?.cssVars.primary || 'var(--primary)' }}
                           />
                           <div 
                             className="absolute bottom-0 right-0 w-2.5 h-2.5 border border-white z-[60] translate-x-1/2 translate-y-1/2 rounded-full" 
                             style={{ backgroundColor: appliedTheme?.cssVars.primary || 'var(--primary)' }}
                           />
                         </>
                       )}
                     {!artifact.isComplete && <ModernShimmer type={artifact.type} appliedTheme={appliedTheme} />}
                   
                    <iframe 
                      ref={el => { iframeRefs.current[index] = el; }}
                      srcDoc={getInjectedHTML(artifact.content)}
                      loading="eager"
                      scrolling="no"
                      className={cn(
                        "w-full h-full border-none overflow-hidden",
                        (activeTool === 'select' || activeTool === 'hand' || isDraggingFrame) && !isEditMode ? "pointer-events-none" : "pointer-events-auto"
                      )}
                      title={artifact.title}
                    />
                    </div>
                  </div>
                ))}
              </div>
             ) : (
                <div className="flex flex-col items-center gap-6 opacity-20 pointer-events-none">
                   <Logo iconSize={80} showText={false} />
                   <p className="text-xl font-medium tracking-tight">Generate your first design to see it here</p>
                </div>
             )}
          </div>

          {/* Bottom Floating Toolbar */}
         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 p-1.5 bg-card/90 backdrop-blur-xl rounded-2xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-1 z-30">
            <Button 
              onClick={() => setActiveTool('select')}
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-10 w-10 rounded-xl transition-all",
                activeTool === 'select' ? "bg-primary text-background shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Select Tool (V)"
            >
               <MousePointer2 className="h-5 w-5" />
            </Button>
            <Button 
              onClick={() => setActiveTool('hand')}
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-10 w-10 rounded-xl transition-all",
                activeTool === 'hand' ? "bg-primary text-background shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Hand Tool (H)"
            >
               <Hand className="h-5 w-5" />
            </Button>
            <Button 
              onClick={() => setActiveTool('interact')}
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-10 w-10 rounded-xl transition-all",
                activeTool === 'interact' ? "bg-primary text-background shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Interact Tool (I)"
            >
               <MousePointerClick className="h-5 w-5" />
            </Button>
            <div className="w-[1px] h-6 bg-border mx-1" />
            <Button 
              onClick={() => setZoom(prev => Math.min(prev * 1.2, 5))}
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Zoom In (Ctrl +)"
            >
               <ZoomIn className="h-5 w-5" />
            </Button>
            <Button 
              onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.1))}
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Zoom Out (Ctrl -)"
            >
               <ZoomOut className="h-5 w-5" />
            </Button>
            <Button 
              onClick={() => {
                setCanvasOffset({ x: 0, y: 0 });
                setFramePos({ x: 0, y: 0 });
                setZoom(1);
              }}
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Reset View"
            >
               <RotateCcw className="h-5 w-5" />
            </Button>
         </div>
      </main>

      {/* Custom Monaco Code Viewer Modal */}
      <AnimatePresence>
        {isCodeViewerOpen && (
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
                          {viewingTitle} source
                       </span>
                   </div>
                   
                   <div className="flex items-center gap-3">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-10 w-10 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                         onClick={() => {
                           navigator.clipboard.writeText(viewingCode);
                           toast.success("Source code copied");
                         }}
                         title="Copy Code"
                       >
                           <FilesIcon className="h-5 w-5" />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-10 w-10 text-zinc-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-all"
                         onClick={() => setIsCodeViewerOpen(false)}
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
                       value={viewingCode}
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

      <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <DialogHeader className="p-6 pb-0">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="size-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <RotateCcw className="size-5 text-emerald-400" />
                     </div>
                     <div>
                        <DialogTitle className="text-xl font-bold tracking-tight">Regenerate Screen</DialogTitle>
                        <DialogDescription className="text-zinc-500 text-sm">
                          Provide specific instructions or leave blank for a general improvement.
                        </DialogDescription>
                     </div>
                  </div>
              </DialogHeader>
              
              <div className="p-6 space-y-4">
                  <div className="space-y-2">
                     <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Regeneration Instructions</label>
                     <Textarea 
                        placeholder="e.g., Change the hero section to use a mesh gradient, or focus on making the data tables more compact..."
                        className="min-h-[120px] bg-zinc-900/50 border-zinc-800 rounded-2xl resize-none text-sm focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
                        value={regenerateInstructions}
                        onChange={(e) => setRegenerateInstructions(e.target.value)}
                     />
                  </div>
                  
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-start gap-3">
                     <Sparkles className="size-4 text-emerald-400 mt-0.5" />
                     <p className="text-[12px] text-zinc-400 leading-relaxed">
                        The AI will focus on your instructions while maintaining visual consistency with the rest of your project.
                     </p>
                  </div>
              </div>

              <DialogFooter className="p-6 bg-zinc-900/30 border-t border-zinc-800/50 flex flex-row items-center justify-end gap-3">
                  <Button 
                     variant="ghost" 
                     onClick={() => setIsRegenerateDialogOpen(false)}
                     className="rounded-xl hover:bg-zinc-800 text-zinc-400 font-bold text-xs uppercase tracking-widest"
                  >
                     Cancel
                  </Button>
                  <Button 
                     onClick={handleRegenerateSubmit}
                     className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.1em] px-6 shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
                  >
                     Regenerate
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}

// Ensure icons like Files are imported if used
const FilesIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
);

