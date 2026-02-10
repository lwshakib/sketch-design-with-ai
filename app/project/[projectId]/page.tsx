"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
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
  Square,
  Save,
  Copy,
  Check,
  Clipboard,
  Files,
  Boxes,
  Cloud,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { UserMenu } from "@/components/user-menu";
import { Logo, LogoIcon } from "@/components/logo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DefaultChatTransport } from "ai";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { fetchInngestToken } from "@/app/actions/inngest";
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
import { authClient } from "@/lib/auth-client";
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

interface Project {
  id: string;
  title: string;
  messages: any[];
  canvasData?: any;
}


const SELECTION_BLUE = '#3b82f6';

const getInjectedHTML = (html: string) => {
  // Prevent duplicate injection if the HTML already contains our script
  if (html.includes('id="sketch-injected-script"') || html.includes("id='sketch-injected-script'")) {
    return html;
  }

  const headInjections = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style id="sketch-material-icons-fix">
      .material-icons {
        font-family: 'Material Icons' !important;
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        -webkit-font-feature-settings: 'liga';
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        -moz-osx-font-smoothing: grayscale;
        font-feature-settings: 'liga';
      }
    </style>
    <script id="sketch-tailwind-cdn" src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script id="sketch-tailwind-config">
      if (window.tailwind) {
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                  DEFAULT: "var(--primary)",
                  foreground: "var(--primary-foreground)",
                },
                secondary: {
                  DEFAULT: "var(--secondary)",
                  foreground: "var(--secondary-foreground)",
                },
                destructive: {
                  DEFAULT: "var(--destructive, #ef4444)",
                  foreground: "var(--destructive-foreground, #ffffff)",
                },
                muted: {
                  DEFAULT: "var(--muted)",
                  foreground: "var(--muted-foreground)",
                },
                accent: {
                  DEFAULT: "var(--accent)",
                  foreground: "var(--accent-foreground)",
                },
                popover: {
                  DEFAULT: "var(--popover)",
                  foreground: "var(--popover-foreground)",
                },
                card: {
                  DEFAULT: "var(--card)",
                  foreground: "var(--card-foreground)",
                },
              },
              borderRadius: {
                lg: "var(--radius, 0.5rem)",
                md: "calc(var(--radius, 0.5rem) - 2px)",
                sm: "calc(var(--radius, 0.5rem) - 4px)",
              },
            },
          },
        }
      }
    </script>
    <style id="sketch-injected-style">
      html, body {
        margin: 0;
        padding: 0;
        min-height: 100%;
        background-color: var(--background, #ffffff);
        color: var(--foreground, #000000);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
      }
      ::-webkit-scrollbar { display: none; }
      * { box-sizing: border-box; }
      body[data-edit-mode="true"] * {
        pointer-events: auto !important;
        user-select: none !important;
      }
      .edit-hover-highlight {
        outline: 2px dashed #6366f1 !important;
        outline-offset: -1px !important;
        cursor: pointer !important;
        z-index: 50000 !important;
      }
      .edit-selected-highlight {
        outline: 2px solid #6366f1 !important;
        outline-offset: -1px !important;
        box-shadow: 0 0 15px rgba(99, 102, 241, 0.3) !important;
        z-index: 50001 !important;
      }
    </style>
  `;

  const scriptLogic = `
    <script id="sketch-injected-script">
      (function() {
        if (window.__SKETCH_INITIALIZED__) return;
        window.__SKETCH_INITIALIZED__ = true;

        var lastHeight = 0;
        var isEditMode = false;
        var selectedEl = null;
        var hoveredEl = null;

        var fixVHUnits = function() {
          var elements = document.querySelectorAll('*');
          elements.forEach(function(el) {
            var heightAttr = el.getAttribute('class') || '';
            if (heightAttr.includes('h-[') && heightAttr.includes('vh]')) {
               var match = heightAttr.match(/h-\\[(\\d+)vh\\]/);
               if (match) {
                 var vhValue = parseInt(match[1]);
                 el.style.height = (vhValue * 8) + 'px';
                 el.style.minHeight = '0';
               }
            }
          });
        };

        var heightTimeout = null;
        var sendHeight = function() {
          if (heightTimeout) return;
          heightTimeout = setTimeout(function() {
            heightTimeout = null;
            fixVHUnits();
            var height = Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight,
              document.body.offsetHeight,
              document.documentElement.offsetHeight
            );
            var cappedHeight = Math.min(height, 5000);
            if (Math.abs(cappedHeight - lastHeight) > 10) {
              lastHeight = cappedHeight;
              window.parent.postMessage({ type: 'HEIGHT_UPDATE', height: cappedHeight }, '*');
            }
          }, 100);
        };

        var clearHover = function() {
          if (hoveredEl) {
            hoveredEl.classList.remove('edit-hover-highlight');
            hoveredEl = null;
          }
        };

        var clearSelected = function() {
          if (selectedEl) {
            selectedEl.classList.remove('edit-selected-highlight');
            selectedEl = null;
          }
        };

        var getElementPath = function(el) {
          var path = [];
          var current = el;
          while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
            var index = 0;
            var sibling = current.previousElementSibling;
            while (sibling) {
              index++;
              sibling = sibling.previousElementSibling;
            }
            path.unshift(index);
            current = current.parentElement;
          }
          return path;
        };

        var getElementByPath = function(path) {
          var el = document.body;
          for (var i = 0; i < path.length; i++) {
            if (el && el.children[path[i]]) {
                el = el.children[path[i]];
            } else {
                return null;
            }
          }
          return el;
        };

        var handlePointerMove = function(e) {
          if (!isEditMode) return;
          var target = e.target.closest('*');
          if (!target || target === document.body || target === document.documentElement) {
            clearHover();
            return;
          }
          if (target.classList.contains('edit-selected-highlight')) {
            clearHover();
            return;
          }
          if (hoveredEl !== target) {
            clearHover();
            hoveredEl = target;
            hoveredEl.classList.add('edit-hover-highlight');
          }
        };

        var handleClick = function(e) {
          if (!isEditMode) return;
          e.preventDefault();
          e.stopPropagation();
          var target = e.target.closest('*');
          
          if (!target || target === document.body || target === document.documentElement) {
            clearSelected();
            window.parent.postMessage({ type: 'SELECTION_CLEARED' }, '*');
            return;
          }
          
          clearSelected();
          selectedEl = target;
          selectedEl.classList.add('edit-selected-highlight');
          clearHover();
          
          window.parent.postMessage({ 
            type: 'ELEMENT_CLICKED', 
            tagName: target.tagName,
            id: target.id,
            className: target.className
          }, '*');
        };

        window.addEventListener('pointermove', handlePointerMove, true);
        window.addEventListener('pointerleave', clearHover, true);
        window.addEventListener('click', handleClick, true);

        window.addEventListener('message', function(event) {
          if (event.data.type === 'UPDATE_CONTENT') {
            var savedPath = selectedEl ? getElementPath(selectedEl) : null;
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(event.data.content, 'text/html');
            
            // 1. Sync DocumentElement (HTML) Attributes
            const currentRoot = document.documentElement;
            const newRoot = newDoc.documentElement;
            // Remove attributes no longer present
            Array.from(currentRoot.attributes).forEach(attr => {
                if (!newRoot.hasAttribute(attr.name)) currentRoot.removeAttribute(attr.name);
            });
            // Set/Update attributes from new content
            Array.from(newRoot.attributes).forEach(attr => {
                currentRoot.setAttribute(attr.name, attr.value);
            });

            // 2. Sync Body Attributes
            const currentBody = document.body;
            const newBody = newDoc.body;
            // Remove attributes no longer present (excluding our internal ones)
            Array.from(currentBody.attributes).forEach(attr => {
                if (attr.name !== 'data-edit-mode' && !newBody.hasAttribute(attr.name)) {
                    currentBody.removeAttribute(attr.name);
                }
            });
            // Set/Update attributes from new content
            Array.from(newBody.attributes).forEach(attr => {
                if (attr.name !== 'data-edit-mode') {
                    currentBody.setAttribute(attr.name, attr.value);
                }
            });

            // 3. Update Body Content
            currentBody.innerHTML = newBody.innerHTML;

            // 4. Selective Head Update (Styles and Links)
            // Remove styles/links from previous AI content
            Array.from(document.head.children).forEach(child => {
              if (child.tagName === 'STYLE' || child.tagName === 'LINK') {
                 if (!child.id || (!child.id.startsWith('sketch-') && child.id !== 'theme-overrides')) {
                    child.remove();
                 }
              }
            });

            // Add new styles/links from incoming AI content
            Array.from(newDoc.head.children).forEach(child => {
              if (child.tagName === 'STYLE' || child.tagName === 'LINK') {
                if (!child.id || !child.id.startsWith('sketch-')) {
                   document.head.appendChild(child.cloneNode(true));
                }
              }
            });

            // 5. Re-render styling engine (Tailwind)
            if (window.tailwind) {
              try { 
                window.tailwind.render(); 
                // Second pass after a micro-task to ensure variables are parsed
                setTimeout(function() { window.tailwind.render(); }, 50);
              } catch (e) {}
            }

            if (savedPath) {
                var newEl = getElementByPath(savedPath);
                if (newEl) {
                    selectedEl = newEl;
                    selectedEl.classList.add('edit-selected-highlight');
                    window.parent.postMessage({ 
                      type: 'ELEMENT_CLICKED', 
                      tagName: selectedEl.tagName,
                      id: selectedEl.id,
                      className: selectedEl.className
                    }, '*');
                } else {
                    selectedEl = null;
                    window.parent.postMessage({ type: 'SELECTION_CLEARED' }, '*');
                }
            }

            fixVHUnits();
            sendHeight();
          }
          if (event.data.type === 'SET_EDIT_MODE') {
            isEditMode = event.data.enabled;
            document.body.setAttribute('data-edit-mode', isEditMode ? 'true' : 'false');
            if (!isEditMode) {
              clearHover();
              clearSelected();
            }
          }
          if (event.data.type === 'CLEAR_SELECTION') {
            clearSelected();
          }
        });

        var observer = new MutationObserver(sendHeight);
        window.onload = function() {
          fixVHUnits();
          sendHeight();
          observer.observe(document.body, { 
            childList: true, 
            subtree: true, 
            attributes: true,
            characterData: true
          });
          [100, 300, 600, 1000, 2000, 4000].forEach(function(delay) { setTimeout(sendHeight, delay); });
        };
        window.addEventListener('load', sendHeight);
      })();
    </script>
  `;

  let processedHtml = html;
  if (/<head\b[^>]*>/i.test(processedHtml)) {
    processedHtml = processedHtml.replace(/(<head\b[^>]*>)/i, '$1' + headInjections);
  } else if (/<html\b[^>]*>/i.test(processedHtml)) {
    processedHtml = processedHtml.replace(/(<html\b[^>]*>)/i, '$1<head>' + headInjections + '</head>');
  } else {
    processedHtml = '<head>' + headInjections + '</head>' + processedHtml;
  }

  if (processedHtml.toLowerCase().includes('</body>')) {
    return processedHtml.replace(/<\/body>/i, scriptLogic + '</body>');
  }
  return processedHtml + scriptLogic;
};


const sanitizeDocumentHtml = (doc: Document, originalHtml: string) => {
  const root = doc.documentElement;
  if (!root) return originalHtml;

  const clone = root.cloneNode(true) as HTMLElement;
  
  // Remove injected script and style
  const injectedScript = clone.querySelector('#sketch-injected-script');
  if (injectedScript) injectedScript.remove();
  const injectedStyle = clone.querySelector('#sketch-injected-style');
  if (injectedStyle) injectedStyle.remove();

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


const ModernShimmer = ({ type = 'app', appliedTheme }: { type?: 'web' | 'app' | string; appliedTheme?: any }) => {
  const isWeb = type === 'web';
  return (
    <div 
      className="absolute inset-0 z-50 overflow-hidden pointer-events-none flex flex-col p-10 gap-10" 
      style={{ backgroundColor: appliedTheme?.cssVars.background || 'var(--background)' }}
    >
      {/* Wireframe Skeletons */}
      <div className="flex items-center justify-between w-full opacity-40">
         <div className="h-4 w-24 bg-foreground/10 rounded-full animate-pulse" />
         <div className="flex gap-3">
            <div className="size-5 bg-foreground/10 rounded-full animate-pulse" />
            <div className="size-5 bg-foreground/10 rounded-full animate-pulse" />
         </div>
      </div>
      
      <div className="space-y-5 opacity-40">
         <div className="h-8 w-3/4 bg-foreground/10 rounded-xl animate-pulse" />
         <div className="h-3 w-1/2 bg-foreground/10 rounded-lg animate-pulse" />
      </div>

      <div className={cn("grid gap-6 w-full opacity-40", isWeb ? "grid-cols-3" : "grid-cols-1")}>
         <div className="h-40 bg-foreground/10 rounded-3xl animate-pulse" />
         {isWeb && (
           <>
             <div className="h-40 bg-foreground/10 rounded-3xl animate-pulse" />
             <div className="h-40 bg-foreground/10 rounded-3xl animate-pulse" />
           </>
         )}
      </div>

      {/* Standard Shimmer Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.05) 50%, 
            transparent 100%
          )`,
          width: '100%',
          transform: 'skewX(-20deg) translateX(-200%)',
          animation: 'shimmer-standard 2.5s infinite linear',
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

// Optimized Iframe component to prevent reloads during live editing
interface ArtifactFrameProps {
  artifact: Artifact;
  index: number;
  isEditMode: boolean;
  activeTool: string;
  isDraggingFrame: boolean;
  appliedTheme: any;
  onRef: (index: number, el: HTMLIFrameElement | null) => void;
}

const ArtifactFrame = React.memo(({ 
  artifact, 
  index, 
  isEditMode, 
  activeTool, 
  isDraggingFrame, 
  appliedTheme,
  onRef 
}: ArtifactFrameProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [initialSrcDoc] = useState(() => getInjectedHTML(artifact.content));
  const lastContentRef = useRef(artifact.content);

  const getThemeCSS = useCallback((theme: any) => `
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
  `, []);

  const applyThemeToIframe = useCallback(() => {
    if (!appliedTheme || !iframeRef.current?.contentDocument) return;
    const doc = iframeRef.current.contentDocument;
    let styleEl = doc.getElementById('theme-overrides') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = doc.createElement('style');
      styleEl.id = 'theme-overrides';
      doc.head.appendChild(styleEl);
    }
    const css = getThemeCSS(appliedTheme);
    if (styleEl.textContent !== css) {
      styleEl.textContent = css;
    }
  }, [appliedTheme, getThemeCSS]);

  // Apply theme when iframe loads or theme changes
  useEffect(() => {
    applyThemeToIframe();
    // Also re-apply after a short delay to ensure injected content is covered
    const timer = setTimeout(applyThemeToIframe, 500);
    return () => clearTimeout(timer);
  }, [applyThemeToIframe, artifact.content]);

  // Use useEffect to handle content updates via postMessage instead of srcDoc
  useEffect(() => {
    // Only update via postMessage if content changed and it's not the initial content
    if (artifact.content !== lastContentRef.current) {
        // IMPORTANT: Check if the content is already in the iframe to avoid wiping selection
        if (iframeRef.current?.contentDocument) {
            const currentContent = sanitizeDocumentHtml(iframeRef.current.contentDocument, artifact.content);
            if (currentContent === artifact.content) {
                lastContentRef.current = artifact.content;
                return;
            }
        }

        // Only update if complete or a substantial new block is ready
        if (artifact.isComplete || artifact.content.length > lastContentRef.current.length + 200) {
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage({
                    type: 'UPDATE_CONTENT',
                    content: artifact.content
                }, '*');
                // Re-apply theme after content update
                setTimeout(applyThemeToIframe, 10);
            }
            lastContentRef.current = artifact.content;
        }
    }
  }, [artifact.content, artifact.isComplete, applyThemeToIframe]);

  return (
    <iframe 
      ref={(el) => {
        (iframeRef as any).current = el;
        onRef(index, el);
      }}
      srcDoc={initialSrcDoc}
      loading="eager"
      scrolling="no"
      className={cn(
        "w-full h-full border-none overflow-hidden",
        (activeTool === 'select' || activeTool === 'hand' || isDraggingFrame) && !isEditMode ? "pointer-events-none" : "pointer-events-auto"
      )}
      title={artifact.title}
    />
  );
});

ArtifactFrame.displayName = 'ArtifactFrame';


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
  const [dynamicFrameHeights, setDynamicFrameHeights] = useState<Record<string, number>>({});
  const [selectedArtifactIndex, setSelectedArtifactIndex] = useState<number | null>(null);
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [leftSidebarMode, setLeftSidebarMode] = useState<'chat' | 'properties' | 'theme'>('chat');
  const isEditMode = leftSidebarMode === 'properties';
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [appliedTheme, setAppliedTheme] = useState<any>(null);
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);
  const [hoveredEl, setHoveredEl] = useState<HTMLElement | null>(null);
  const [artifactPreviewModes, setArtifactPreviewModes] = useState<Record<string, 'mobile' | 'tablet' | 'desktop' | null>>({});
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewingCode, setViewingCode] = useState("");
  const [viewingTitle, setViewingTitle] = useState("");
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [regenerateInstructions, setRegenerateInstructions] = useState("");
  const [processingArtifact, setProcessingArtifact] = useState<Artifact | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingHandle, setResizingHandle] = useState<string | null>(null);
  const resizingStartSize = useRef({ width: 0, height: 0 });
  const resizingStartPos = useRef({ x: 0, y: 0 });
  const resizingStartFramePos = useRef({ x: 0, y: 0 });
  const [isEditTitleDialogOpen, setIsEditTitleDialogOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportSheetOpen, setIsExportSheetOpen] = useState(false);
  const [exportArtifactIndex, setExportArtifactIndex] = useState<number | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [designPlan, setDesignPlan] = useState<{ title: string; type: string; description: string }[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<{ message: string; status: string; currentScreen?: string } | null>(null);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<any>(null);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [viewingPrompt, setViewingPrompt] = useState("");
  
  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        projectId,
      },
    }),
    onError: (err) => {
      console.error(err);
      toast.error("Engine encountered an error.");
    },
    onFinish: () => {
      // Background generation started, polling will handle result
    },
    onData: (data) => {
       // Optional: handle custom data if backend sends it
       console.log(data);
    }
  });
  
  const handleRetry = useCallback(() => {
    const lastUserMessage = (messages as any[]).filter(m => m.role === 'user').at(-1);
    if (lastUserMessage) {
        const msg = lastUserMessage as any;
        const text = msg.content || "";
        
        setIsGenerating(true);
        sendMessage({ text, files: [] }); // Files not stored in new simplified model for now
    }
  }, [messages, sendMessage]);

  // Inngest Realtime Subscription
  const { data: realtimeData } = useInngestSubscription({
    refreshToken: () => fetchInngestToken(projectId as string),
  });

  // Handle incoming realtime data
  useEffect(() => {
    if (!realtimeData || realtimeData.length === 0) return;
    
    // Process messages in order
    realtimeData.forEach((event: any) => {
      if (event.topic === 'plan') {
        const { plan, markdown } = event.data;
        if (plan?.screens) {
          setDesignPlan(plan.screens);
        }
        if (markdown) {
          setMessages(prev => {
            const last = prev[prev.length - 1] as any;
            if (last && last.role === 'assistant') {
              const updated = [...prev];
              // Avoid double appending if it already has the markdown
              const lastContent = last.content || '';
              if (!lastContent.includes(markdown.substring(0, 20))) {
                updated[updated.length - 1] = { 
                  ...last, 
                  content: lastContent + "\n\n" + markdown,
                  plan: plan 
                } as any;
              }
              return updated;
            } else {
              // Create new assistant message if none exists
               return [...prev, { 
                id: Math.random().toString(), 
                role: 'assistant', 
                content: markdown,
                plan: plan 
              } as any];
            }
          });
        }
      } else if (event.topic === 'status') {
        setRealtimeStatus(event.data);
        
        if (event.data.status === 'vision' || event.data.status === 'planning') {
          setIsGenerating(true);
        }

        // If a screen starts generating, show a shimmer placeholder
        if (event.data.status === 'generating' && event.data.currentScreen) {
          setIsGenerating(true);
          const title = event.data.currentScreen;
          
          const updateFn = (prev: any[]) => {
            if (prev.some(a => a.title === title)) return prev;
            
            // Find type from designPlan if possible
            const planItem = designPlan.find(p => p.title === title);
            const type = planItem?.type || 'web';

            const getNewX = (existing: any[], scrType: string) => {
              const last = existing[existing.length - 1];
              const getWidth = (t: string) => t === 'app' ? 380 : t === 'web' ? 1024 : 800;
              const currentWidth = getWidth(scrType);
              return last 
                ? (last.x || 0) + (last.width || getWidth(last.type)) + 120 
                : -(currentWidth / 2);
            };

            const newPlaceholder = {
              title,
              content: "",
              type: type as 'web' | 'app',
              isComplete: false,
              x: getNewX(prev, type),
              y: 0
            };
            return [...prev, newPlaceholder];
          };

          setArtifacts(updateFn);
          setThrottledArtifacts(updateFn);
        }

        // All screens finished
        if (event.data.status === 'complete') {
          setIsGenerating(false);
          toast.success("Design generation complete!");
        }

        // If a screen is complete, update artifacts locally for instant view
        if (event.data.status === 'partial_complete' && event.data.screen) {
          setIsGenerating(true);
          const newScreen = event.data.screen;
          
          const updateFn = (prev: any[]) => {
            const updated = [...prev];
            const idx = updated.findIndex(a => a.title === newScreen.title);
            if (idx >= 0) {
              // Preserve current coordinates if it was already in the list (e.g. from generating status)
              updated[idx] = { 
                ...updated[idx], 
                ...newScreen, 
                x: updated[idx].x, 
                y: updated[idx].y,
                isComplete: true 
              };
            } else {
              const getNewX = (existing: any[], type: string) => {
                const last = existing[existing.length - 1];
                const getWidth = (t: string) => t === 'app' ? 380 : t === 'web' ? 1024 : 800;
                const currentWidth = getWidth(type);
                return last 
                  ? (last.x || 0) + (last.width || getWidth(last.type)) + 120 
                  : -(currentWidth / 2);
              };
              updated.push({ ...newScreen, isComplete: true, x: newScreen.x || getNewX(updated, newScreen.type), y: newScreen.y || 0 });
            }
            return updated;
          };

          setArtifacts(updateFn);
          setThrottledArtifacts(updateFn);
        }
      }
    });
  }, [realtimeData, setMessages, projectId, designPlan]);

  // Refs to keep track of state in wheel event listeners without re-attaching
  const zoomRef = useRef(zoom);
  const canvasOffsetRef = useRef(canvasOffset);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { canvasOffsetRef.current = canvasOffset; }, [canvasOffset]);


  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const pollProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        // Update project, artifacts, and messages
        setProject(data);
        if (data.screens) {
          const fetchedArtifacts = data.screens.map((s: any) => ({ ...s, isComplete: true }));
          setArtifacts(fetchedArtifacts);
          setThrottledArtifacts(fetchedArtifacts);
        }

        // Check if we are done based on screens vs plan
        const planCount = designPlan.length;
        const screensCount = data.screens?.length || 0;
        
        if (planCount > 0 && screensCount >= planCount) {
             setIsGenerating(false);
        }

        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    if (isGenerating) {
      pollInterval = setInterval(pollProject, 3000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isGenerating, projectId, setMessages]);

  useEffect(() => {
    const fetchProjectAndInitialize = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error("Project not found");
        const data = await res.json();
        setProject(data);
        
        if (data.messages) {
          setMessages(data.messages);
        }

        if (data.canvasData) {
          if (data.canvasData.zoom) setZoom(data.canvasData.zoom);
          if (data.canvasData.canvasOffset) setCanvasOffset(data.canvasData.canvasOffset);
          if (data.canvasData. framePos) setFramePos(data.canvasData.framePos);
          if (data.screens) {
            const fetchedArtifacts = data.screens.map((s: any) => ({ ...s, isComplete: true }));
            setArtifacts(fetchedArtifacts);
            setThrottledArtifacts(fetchedArtifacts);
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
            setArtifacts(prev => prev.length > 0 ? [] : prev);
            setThrottledArtifacts(prev => prev.length > 0 ? [] : prev);
        }
        return;
    }

    const textContent = (lastAssistantMessage.parts?.find((p: any) => p.type === 'text') as any)?.text || (lastAssistantMessage as any).content;
    
    if (typeof textContent === 'string' && textContent.length > 0) {
      const artifactData = extractArtifacts(textContent);
      
      if (artifactData.length > 0) {
        // Shared layout helper
        const getNewX = (existingArtifacts: any[], newType: string) => {
          const lastArt = existingArtifacts[existingArtifacts.length - 1];
          const getWidth = (t: string) => t === 'app' ? 380 : t === 'web' ? 1024 : 800;
          const currentWidth = getWidth(newType);
          return lastArt 
            ? (lastArt.x || 0) + (lastArt.width || getWidth(lastArt.type)) + 120 
            : -(currentWidth / 2);
        };

        // 1. Maintain full state in 'artifacts'
        setArtifacts(prev => {
           const updated = [...prev];
           let changed = false;
           artifactData.forEach(newArt => {
             const existingIndex = updated.findIndex(a => a.title === newArt.title);
             if (existingIndex >= 0) {
               if (updated[existingIndex].content !== newArt.content || updated[existingIndex].isComplete !== newArt.isComplete) {
                   updated[existingIndex] = {
                     ...updated[existingIndex],
                     content: newArt.content,
                     isComplete: newArt.isComplete
                   };
                   changed = true;
               }
             } else {
               updated.push({ ...newArt, x: getNewX(updated, newArt.type), y: 0 });
               changed = true;
             }
           });
           return changed ? updated : prev;
        });
        
        // 2. Visible UI (throttledArtifacts)
        setThrottledArtifacts(prev => {
            const updated = [...prev];
            let changed = false;

            artifactData.forEach(newArt => {
              const existingIndex = updated.findIndex(a => a.title === newArt.title);
              
              if (existingIndex === -1) {
                updated.push({ 
                  ...newArt, 
                  content: "", 
                  x: getNewX(updated, newArt.type), 
                  y: 0, 
                  isComplete: false 
                });
                changed = true;
              } else {
                 if (status === 'streaming' && updated[existingIndex].isComplete) {
                    updated[existingIndex] = { ...updated[existingIndex], isComplete: false };
                    changed = true;
                 }
                 
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
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          if (iframe.contentWindow === sourceWindow) {
            const artifactTitle = (iframe as any).dataset.artifactTitle;
            if (artifactTitle) {
              setDynamicFrameHeights(prev => {
                const currentHeight = prev[artifactTitle] || 0;
                if (Math.abs(currentHeight - event.data.height) > 10) {
                   return { ...prev, [artifactTitle]: event.data.height };
                }
                return prev;
              });
            }
          }
        });
      }

      if (event.data.type === 'ELEMENT_CLICKED') {
        const sourceWindow = event.source as Window;
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe, index) => {
          if (iframe.contentWindow === sourceWindow) {
            setSelectedArtifactIndex(index);
            // Since we are same-origin, we can reach into the iframe
            // and find the element that has the 'edit-selected-highlight' class
            const doc = iframe.contentDocument;
            if (doc) {
              const el = doc.querySelector('.edit-selected-highlight') as HTMLElement;
              if (el) {
                setSelectedEl(el);
              }
            }
          }
        });
      }
    };
    
    const handleSelectionCleared = (event: MessageEvent) => {
      if (event.data.type === 'SELECTION_CLEARED') {
          setSelectedEl(null);
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('message', handleSelectionCleared);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('message', handleSelectionCleared);
    };
  }, []);

  // Broadcast Edit Mode state to all iframes
  useEffect(() => {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.contentWindow?.postMessage({ 
        type: 'SET_EDIT_MODE', 
        enabled: isEditMode 
      }, '*');
    });
  }, [isEditMode, throttledArtifacts]);

  // Broadcast Clear Selection state
  useEffect(() => {
    if (selectedEl === null) {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        iframe.contentWindow?.postMessage({ type: 'CLEAR_SELECTION' }, '*');
      });
    }
  }, [selectedEl]);

  const commitEdits = useCallback(() => {
    if (selectedArtifactIndex === null) return;
    const selectedArtifact = throttledArtifacts[selectedArtifactIndex];
    if (!selectedArtifact) return;

    const iframe = iframeRefs.current[selectedArtifact.title];
    if (!iframe?.contentDocument) return;

    const currentArtifact = throttledArtifacts[selectedArtifactIndex];
    if (!currentArtifact) return;

    const cleanHtml = sanitizeDocumentHtml(iframe.contentDocument, currentArtifact.content);
    
    // Update the artifacts locally
    const updatedArtifacts = [...throttledArtifacts];
    updatedArtifacts[selectedArtifactIndex] = { ...currentArtifact, content: cleanHtml };
    
    setThrottledArtifacts(updatedArtifacts);
    setArtifacts(updatedArtifacts);
  }, [selectedArtifactIndex, throttledArtifacts]);

  const commitEditsRef = useRef(commitEdits);
  useEffect(() => {
    commitEditsRef.current = commitEdits;
  }, [commitEdits]);

  const applyTheme = useCallback((theme: any) => {
    setActiveThemeId(theme.id);
    setAppliedTheme(theme);
    toast.success(`Theme "${theme.name}" selected. Click Save to persist.`);
  }, []);


  // Refs for tracking hovered/selected elements to avoid re-running useEffect
  const hoveredElRef = useRef<HTMLElement | null>(null);
  const selectedElRef = useRef<HTMLElement | null>(null);
  
  // Keep refs in sync with state
  useEffect(() => {
    hoveredElRef.current = hoveredEl;
  }, [hoveredEl]);
  
  useEffect(() => {
    selectedElRef.current = selectedEl;
  }, [selectedEl]);

  // Handle Edit Mode selection
  useEffect(() => {
    if (selectedArtifactIndex === null) return;
    const currentArtifact = throttledArtifacts[selectedArtifactIndex];
    if (!currentArtifact) return;

    const iframe = iframeRefs.current[currentArtifact.title];
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
        
        const currentHovered = hoveredElRef.current;
        const currentSelected = selectedElRef.current;
        
        if (currentHovered && currentHovered !== target && currentHovered !== currentSelected) {
            currentHovered.classList.remove('edit-hover-highlight');
        }
        
        if (target !== currentSelected) {
            setHoveredEl(target);
            target.classList.add('edit-hover-highlight');
        }
    };

    const handlePointerLeave = () => {
        const currentHovered = hoveredElRef.current;
        const currentSelected = selectedElRef.current;
        
        if (currentHovered && currentHovered !== currentSelected) {
            currentHovered.classList.remove('edit-hover-highlight');
        }
        setHoveredEl(null);
    };

    const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.target as HTMLElement;
        if (!target || target === doc.body || target === doc.documentElement) return;

        const currentSelected = selectedElRef.current;
        if (currentSelected) {
            currentSelected.classList.remove('edit-selected-highlight');
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
            commitEditsRef.current();
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
        
        // Clean up highlights on exit using refs for current values
        const currentHovered = hoveredElRef.current;
        const currentSelected = selectedElRef.current;
        if (currentHovered) currentHovered.classList.remove('edit-hover-highlight');
        if (currentSelected) currentSelected.classList.remove('edit-selected-highlight');
    };
  }, [isEditMode, selectedArtifactIndex]); // Removed commitEdits from dependencies

  // Save canvas data on change
  const handleSave = useCallback(async (showToast = true) => {
    if (!project) return;
    setIsSaving(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          canvasData: {
            artifacts,
            framePos,
            zoom,
            canvasOffset,
            dynamicFrameHeights,
            artifactPreviewModes,
            appliedTheme
          }
        })
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error("Failed to save project");
    } finally {
      setIsSaving(false);
    }
  }, [project, projectId, messages, artifacts, framePos, zoom, canvasOffset, dynamicFrameHeights, artifactPreviewModes, appliedTheme]);

  const debouncedSave = useCallback(() => {
    setHasUnsavedChanges(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(false);
    }, 5000);
  }, [handleSave]);

  const updateProjectTitle = async (newTitle: string) => {
    if (!project || !newTitle.trim()) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() })
      });

      if (!response.ok) throw new Error('Failed to update title');

      setProject({ ...project, title: newTitle.trim() });
      toast.success("Project title updated!");
      setIsEditTitleDialogOpen(false);
    } catch (error) {
      console.error('Update title error:', error);
      toast.error("Failed to update project title");
    }
  };

  const handleDeleteProject = async () => {
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete project');

      toast.success("Project deleted");
      router.push("/");
    } catch (error) {
      console.error('Delete project error:', error);
      toast.error("Failed to delete project");
    }
  };

  // Shortcut for saving (Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        debouncedSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debouncedSave]);

  // Auto-save canvas state when zoom, offset, or artifacts change
  useEffect(() => {
    if (loading) return;
    debouncedSave();
  }, [zoom, canvasOffset, framePos, artifacts, dynamicFrameHeights, artifactPreviewModes, appliedTheme, loading, debouncedSave]);

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

  const handlePersistFrame = async (index: number) => {
    const artifact = artifacts[index];
    if (!artifact || !artifact.id) return;

    try {
      await fetch(`/api/screens/${artifact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: artifact.x,
          y: artifact.y,
          width: artifact.width,
          height: artifact.height
        })
      });
    } catch (error) {
      console.error('Failed to persist frame:', error);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
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
    } else if (isResizing && selectedArtifactIndex !== null && resizingHandle) {
      const dx = (e.clientX - resizingStartPos.current.x) / zoom;
      const dy = (e.clientY - resizingStartPos.current.y) / zoom;
      
      const updateArtifact = (prev: Artifact[]) => {
        const next = [...prev];
        const art = next[selectedArtifactIndex];
        if (!art) return prev;
        
        let newWidth = resizingStartSize.current.width;
        let newHeight = resizingStartSize.current.height;
        let newX = resizingStartFramePos.current.x;
        let newY = resizingStartFramePos.current.y;
        
        if (resizingHandle.includes('right')) {
          newWidth = Math.max(200, resizingStartSize.current.width + dx);
        }
        if (resizingHandle.includes('left')) {
          const deltaWidth = resizingStartSize.current.width - dx;
          if (deltaWidth > 200) {
            newWidth = deltaWidth;
            newX = resizingStartFramePos.current.x + dx;
          }
        }
        if (resizingHandle.includes('bottom')) {
          newHeight = Math.max(200, resizingStartSize.current.height + dy);
        }
        if (resizingHandle.includes('top')) {
          const deltaHeight = resizingStartSize.current.height - dy;
          if (deltaHeight > 200) {
            newHeight = deltaHeight;
            newY = resizingStartFramePos.current.y + dy;
          }
        }
        
        next[selectedArtifactIndex] = { ...art, width: newWidth, height: newHeight, x: newX, y: newY };
        
        // Clear preview mode on manual resize
        if (artifactPreviewModes[art.title]) {
          setArtifactPreviewModes(prev => {
            const n = { ...prev };
            delete n[art.title];
            return n;
          });
        }
        return next;
      };

      setThrottledArtifacts(updateArtifact);
      setArtifacts(updateArtifact);
    }
  };

  const handleMouseUp = () => {
    if ((isDraggingFrame || isResizing) && selectedArtifactIndex !== null) {
      handlePersistFrame(selectedArtifactIndex);
    }
    if (isPanning || isDraggingFrame || isResizing) {
      debouncedSave();
    }
    setIsPanning(false);
    setIsDraggingFrame(false);
    setIsResizing(false);
    setResizingHandle(null);
  };

  const startResizing = (e: React.MouseEvent, index: number, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizingHandle(handle);
    setSelectedArtifactIndex(index);
    
    const art = throttledArtifacts[index];
    const mode = artifactPreviewModes[art.title];
    const defaultWidth = mode === 'mobile' ? 380 : mode === 'tablet' ? 768 : mode === 'desktop' ? 1280 : (art.type === 'app' ? 380 : 1024);
    const defaultHeight = dynamicFrameHeights[art.title] || 800;

    resizingStartSize.current = { 
      width: art.width || defaultWidth, 
      height: art.height || defaultHeight 
    };
    resizingStartPos.current = { x: e.clientX, y: e.clientY };
    resizingStartFramePos.current = { x: art.x || 0, y: art.y || 0 };
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
        formData.append("folder", sigData.folder || "sketch-design-with-ai");

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
    }
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

    if (status === 'streaming' || status === 'submitted') {
      stop();
      return;
    }

    if (!input.trim() && attachments.length === 0) return;
    
    setIsGenerating(true);
    setDesignPlan([]);
    setRealtimeStatus(null);
    
    sendMessage({
      text: input.trim(),
      files: attachments.map(a => ({ type: "file" as const, url: a.url, mediaType: "image/*" }))
    });
    
    setAttachments([]);
    setInput("");
  };

  const handleArtifactAction = (action: 'more' | 'regenerate' | 'variations', artifact: Artifact) => {
    if (status !== 'ready') {
      toast.warning("Sketch is busy with another task. Please wait a moment.");
      return;
    }

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
        setIsGenerating(true);
        sendMessage({ text: prompt });
        toast.info(action === 'more' ? "Architecting more pages..." : "Exploring variations...");
    }
  };

  const handleRegenerateSubmit = () => {
    if (status !== 'ready') {
      toast.warning("Sketch is busy. Please wait for the current task to finish.");
      return;
    }
    
    if (!processingArtifact) return;
    
    let prompt = "";
    if (regenerateInstructions.trim()) {
      prompt = `Please regenerate the "${processingArtifact.title}" screen with these specific instructions: ${regenerateInstructions.trim()}. Maintain the overall theme and structure but FOCUS on the requested changes. IMPORTANT: Use the EXACT title "${processingArtifact.title}" in your artifact tag so it replaces the previous version.`;
    } else {
      prompt = `Please regenerate and improve the "${processingArtifact.title}" screen. Refine the layout, enhance the visual hierarchy, and ensure it follows the highest-fidelity design standards. IMPORTANT: Use the EXACT title "${processingArtifact.title}" in your artifact tag so it replaces the previous version.`;
    }

    setIsGenerating(true);
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
    const currentArtifact = throttledArtifacts[index];
    if (!currentArtifact) return null;
    const iframe = iframeRefs.current[currentArtifact.title];
    if (!iframe || !iframe.contentDocument?.body) return null;
    
    try {
        // 1. Ensure fonts are loaded in the iframe
        if (iframe.contentDocument.fonts) {
            await iframe.contentDocument.fonts.ready;
        }

        // 2. Extra safety: ensure fonts are pre-loaded in the parent document too
        // html2canvas sometimes needs this to resolve font-faces during cloning
        const fontLinks = iframe.contentDocument.querySelectorAll('link[rel="stylesheet"]');
        for (const link of Array.from(fontLinks)) {
            const href = (link as HTMLLinkElement).href;
            if (href.includes('fonts.googleapis.com')) {
                if (!document.querySelector(`link[href="${href}"]`)) {
                    const newLink = document.createElement('link');
                    newLink.rel = 'stylesheet';
                    newLink.href = href;
                    document.head.appendChild(newLink);
                }
            }
        }
        
        // Wait for parent fonts just in case
        if (document.fonts) await document.fonts.ready;

        // 3. Significant delay for styles and ligatures to settle
        await new Promise(resolve => setTimeout(resolve, 1000));

        const canvas = await html2canvas(iframe.contentDocument.body, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: appliedTheme?.cssVars.background || '#ffffff',
            scale: 2,
            logging: false,
            onclone: (clonedDoc) => {
                // Ensure the cloned document has the same head content (fonts/styles)
                if (iframe.contentDocument) {
                    clonedDoc.head.innerHTML = iframe.contentDocument.head.innerHTML;
                }

                // Force material icons to render as ligatures in the clone
                const icons = clonedDoc.querySelectorAll('.material-icons');
                icons.forEach(icon => {
                    const el = icon as HTMLElement;
                    el.style.fontFamily = "'Material Icons'";
                    el.style.textRendering = "optimizeLegibility";
                    el.style.fontFeatureSettings = "'liga'";
                    (el.style as any)['-webkit-font-feature-settings'] = "'liga'";
                    el.style.display = "inline-block";
                    el.style.visibility = "visible";
                });
            }
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
    const fileName = artifact.title.replace(/\s+/g, '_');
    
    // Add HTML
    zip.file("code.html", getInjectedHTML(artifact.content));
    
    // Add PNG
    if (dataUrl) {
        const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
        zip.file("screen.png", base64Data, { base64: true });
    }
    
    const content = await zip.generateAsync({ type: "blob" });
    toast.dismiss();
    
    const link = document.createElement('a');
    link.download = `${fileName}_Package.zip`;
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

  const session = authClient.useSession();

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

  const handleFeedback = async (index: number, action: 'like' | 'dislike' | 'none') => {
    const artifact = artifacts[index];
    if (!artifact || !artifact.id) return;

    try {
      const res = await fetch(`/api/screens/${artifact.id}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!res.ok) throw new Error('Failed to update feedback');

      const updatedScreen = await res.json();
      const updateFn = (prev: Artifact[]) => prev.map((a, i) => i === index ? { 
        ...a, 
        isLiked: updatedScreen.isLiked, 
        isDisliked: updatedScreen.isDisliked 
      } : a);

      setArtifacts(updateFn);
      setThrottledArtifacts(updateFn);
      
      if (action === 'like') toast.success("Glad you like it!");
      else if (action === 'dislike') toast.info("Feedback received. We'll try better.");
    } catch (error) {
      console.error('Feedback error:', error);
      toast.error("Failed to save feedback");
    }
  };

  if (!project) return null;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      
      {/* Left Sidebar - Chat, Properties, or Theme */}
      <aside className="w-[380px] flex flex-col border-r bg-card z-20 transition-all duration-300">
        {leftSidebarMode === 'properties' ? (
          <ElementSettings 
            selectedEl={selectedEl} 
            setSelectedEl={setSelectedEl}
            clearSelection={() => setSelectedEl(null)}
            onUpdate={commitEdits}
          />
        ) : leftSidebarMode === 'theme' ? (
          <ThemeSettings 
            activeThemeId={activeThemeId}
            onApplyTheme={applyTheme}
            appliedTheme={appliedTheme}
          />
        ) : (
          <>
            <header className="flex items-center justify-between px-4 py-2 h-14 border-b bg-sidebar transition-all">
               <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Menu className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem onClick={() => router.push('/')}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Go to all projects
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <span className="font-semibold text-[15px] text-foreground tracking-tight">
                    {project.title}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-primary"
                    onClick={() => {
                      setEditingTitle(project.title);
                      setIsEditTitleDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
               </div>
            </header>

            <div className="flex-1 relative overflow-hidden bg-sidebar">
              <Conversation className="relative h-full">
                <ConversationContent className="p-0 scrollbar-hide">
                  <div className="flex flex-col min-h-full pb-8">
                    {messages.length === 0 && artifacts.length === 0 && !isGenerating ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
                        <div className="relative mb-6">
                           <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                           <div className="relative h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <Sparkles className="size-8 text-primary animate-pulse" />
                           </div>
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight mb-2 uppercase">Initialize Workspace</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">
                          Describe your vision to generate the first high-fidelity prototype.
                        </p>
                      </div>
                    ) : (
                      <div className="">
                        {messages.map((message) => {
                          const msg = message as any;
                          return (
                          <div 
                            key={message.id} 
                            className={cn(
                              "group transition-colors duration-300",
                            )}
                          >
                            <div className="px-5 py-5 flex gap-3">
                              {/* Avatar */}
                              {message.role === 'user' ? (
                                (session.data?.user as any)?.image ? (
                                  <img 
                                    src={(session.data?.user as any).image} 
                                    alt={session.data?.user?.name || 'User'}
                                    className="h-8 w-8 rounded-lg object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <User className="h-4 w-4 text-zinc-400" />
                                  </div>
                                )
                              ) : (
                                <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <LogoIcon className="text-primary"/>
                                </div>
                              )}
                              
                              {/* Message Content */}
                              <div className="flex-1 min-w-0">
                                {/* Name inline with message */}
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-semibold text-foreground">
                                    {message.role === 'user' ? (session.data?.user?.name || 'User') : 'Sketch AI'}
                                  </span>
                                  
                                  <MessageContent className="p-0 bg-transparent text-foreground leading-relaxed text-[15px]">
                                    <div className="whitespace-pre-wrap">
                                      {message.role === 'assistant' ? (
                                        (() => {
                                          const textContent = msg.content || "";
                                          const isRawHtml = textContent.toLowerCase().includes('<!doctype') || textContent.toLowerCase().includes('<html');
                                          if (isRawHtml && extractArtifacts(textContent).length === 0) {
                                            return (
                                              <div className="flex flex-col gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl mt-2">
                                                <div className="flex items-center gap-2 text-destructive font-bold text-[10px] uppercase tracking-wide">
                                                  <X className="size-3" />
                                                  Error
                                                </div>
                                                <p className="text-destructive/80 text-sm leading-relaxed">Engine error occurred. Please try a different prompt.</p>
                                              </div>
                                            );
                                          }
                                           return (
                                            <div className="text-foreground/90 leading-relaxed text-[15px]">
                                              <MessageResponse>{stripArtifact(textContent)}</MessageResponse>
                                               {msg.plan && (
                                                <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-700">
                                                  {/* Design Specification Card */}
                                                  <motion.div 
                                                     initial={{ opacity: 0, scale: 0.95 }}
                                                     animate={{ opacity: 1, scale: 1 }}
                                                     className="p-4 bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl group cursor-pointer hover:bg-card/60 transition-all shadow-sm"
                                                     onClick={() => {
                                                       setViewingPlan(msg.plan);
                                                       setIsPlanDialogOpen(true);
                                                     }}
                                                  >
                                                     <div className="flex items-center justify-between mb-2">
                                                       <div className="flex items-center gap-2.5">
                                                         <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                                           <Boxes className="h-4 w-4 text-primary" />
                                                         </div>
                                                         <span className="text-[12px] font-bold text-foreground/90">Design Specification</span>
                                                       </div>
                                                       <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                                     </div>
                                                     <p className="text-[11px] text-muted-foreground/60 leading-relaxed font-medium pl-10">
                                                       {msg.plan.screens.length} Screens defined. Click to view detailed layout, components, and state logic.
                                                     </p>
                                                  </motion.div>

                                                  {/* Sequential Screen Cards inside Accordion */}
                                                  <div className="rounded-xl border border-primary/20 bg-background/40 overflow-hidden my-2 shadow-inner">
                                                    <Accordion
                                                      type="single"
                                                      collapsible
                                                      defaultValue="screens"
                                                      className="w-full"
                                                    >
                                                      <AccordionItem value="screens" className="border-none">
                                                        <AccordionTrigger className="hover:no-underline py-2.5 px-4 text-xs font-semibold transition-colors hover:bg-muted/30">
                                                          <div className="flex items-center gap-3 w-full">
                                                            <div className="relative flex items-center justify-center">
                                                              {isGenerating ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                                              ) : (
                                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                              )}
                                                            </div>
                                                            <span className="text-foreground font-medium">
                                                              {isGenerating ? "Synthesizing Design..." : "Design Complete"}
                                                            </span>
                                                            <div className="flex-1" />
                                                            <Badge
                                                              variant="secondary"
                                                              className="text-[10px] h-4.5 px-2 bg-primary/10 text-primary border-none font-bold"
                                                            >
                                                              {msg.plan.screens.length}{" "}
                                                              {msg.plan.screens.length === 1 ? "Screen" : "Screens"}
                                                            </Badge>
                                                          </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                          <div className="px-3 pb-3 space-y-1.5 mt-1">
                                                            {msg.plan.screens.map((screen: any, idx: number) => {
                                                              const isCurrent = realtimeStatus?.currentScreen === screen.title && isGenerating;
                                                              const isComplete = artifacts.some(a => a.title === screen.title && a.isComplete);
                                                              
                                                              return (
                                                                <div 
                                                                  key={idx}
                                                                  onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setViewingPrompt(screen.prompt || "No dimensional prompt archived.");
                                                                    setIsPromptDialogOpen(true);
                                                                  }}
                                                                  className={cn(
                                                                    "flex items-center justify-between text-xs py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors group/file cursor-pointer",
                                                                    isCurrent && "bg-primary/5"
                                                                  )}
                                                                >
                                                                  <div className="flex items-center gap-2.5 min-w-0">
                                                                    {isComplete ? (
                                                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                                    ) : isCurrent ? (
                                                                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                                                                    ) : (
                                                                      <div className="h-3.5 w-3.5 rounded-full border border-border/50 shrink-0" />
                                                                    )}
                                                                    <div className="flex flex-col min-w-0">
                                                                      <span className={cn(
                                                                        "font-bold truncate text-[11px] transition-colors",
                                                                        isCurrent ? "text-primary" : isComplete ? "text-emerald-400" : "text-muted-foreground group-hover/file:text-foreground"
                                                                      )}>
                                                                        {screen.title}
                                                                      </span>
                                                                       <span className="text-[9px] text-muted-foreground/40 font-bold tracking-widest">{screen.type}</span>
                                                                    </div>
                                                                  </div>
                                                                  {isCurrent && (
                                                                    <span className="text-[10px] text-primary/70 font-medium animate-pulse shrink-0 ml-4">
                                                                      Designing...
                                                                    </span>
                                                                  )}
                                                                  {isComplete && (
                                                                    <ChevronRight className="size-3 text-muted-foreground/30 group-hover/file:text-primary transition-colors" />
                                                                  )}
                                                                </div>
                                                              );
                                                            })}
                                                          </div>
                                                        </AccordionContent>
                                                      </AccordionItem>
                                                    </Accordion>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()
                                      ) : (
                                        <div className="text-foreground/90 leading-relaxed text-[15px]">
                                          {msg.content}
                                        </div>
                                      )}
                                    </div>
                                  </MessageContent>
                                </div>
                              </div>
                            </div>
                          </div>
                        );})}
                        
                        {isGenerating && messages[messages.length - 1]?.role !== 'assistant' && (
                          <div className="flex gap-4 p-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="size-8 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                               <Sparkles className="size-4 text-primary animate-pulse" />
                            </div>
                            <div className="flex-1 space-y-4 pr-6">
                                <div className="flex items-center gap-2">
                                   <span className="text-sm font-semibold text-foreground">Sketch AI</span>
                                </div>
                               <div className="space-y-4">
                                  <div className="h-4 bg-primary/5 rounded-full w-[80%] animate-pulse" />
                                  <div className="h-4 bg-primary/5 rounded-full w-[60%] animate-pulse" />
                               </div>
                            </div>
                          </div>
                        )}
                        
                        {error && (
                          <div className="flex justify-center p-6 border-t border-destructive/10 bg-destructive/5 rounded-2xl mx-4 my-2 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex flex-col items-center gap-3">
                              <p className="text-sm text-destructive font-medium">Message failed to send</p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleRetry()}
                                className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive transition-all"
                              >
                                <RotateCcw className="size-3" />
                                Retry sending now
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                      readOnly={status !== 'ready'}
                      placeholder={status === 'ready' ? "Describe your design" : "Processing vision..."}
                      className="w-full bg-transparent outline-none resize-none text-[14px] text-foreground placeholder:text-muted-foreground min-h-[40px] max-h-[200px]"
                    />

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/50">
                      <div className="flex items-center gap-1.5">
                        <Button 
                          onClick={() => fileInputRef.current?.click()} 
                          variant="ghost" 
                          size="icon" 
                          disabled={status !== 'ready'}
                          className="h-8 w-8 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                        <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                           onClick={handleCustomSubmit}
                           disabled={status === 'ready' && (!input.trim() && attachments.length === 0)}
                           className={cn(
                             "h-8 w-8 rounded-lg p-0 shadow-lg transition-all",
                             (status === 'streaming' || status === 'submitted') 
                               ? "bg-red-500 hover:bg-red-600 text-white" 
                               : "bg-white hover:bg-zinc-200 text-black"
                           )}
                        >
                          {(status === 'streaming' || status === 'submitted') ? (
                            <Square className="h-3 w-3 fill-current" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
               </div>
                <p className="text-[10px] text-center mt-3 text-zinc-600 font-medium tracking-wide uppercase">
                  Sketch can make mistakes. Please check its work.
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
                {/* Minimalist Save Status */}
                <div className="flex items-center justify-center w-8 h-8">
                   {isSaving ? (
                      <Loader2 className="h-4 w-4 text-foreground/40 animate-spin" />
                   ) : hasUnsavedChanges ? (
                       <div title="Unsaved"><Cloud className="h-4 w-4 text-foreground/40" /></div>
                   ) : (
                      <div className="relative opacity-20" title="Saved">
                        <Cloud className="h-4 w-4 text-foreground" />
                        <Check className="absolute -bottom-0.5 -right-0.5 h-2 w-2 text-foreground stroke-[4px]" />
                      </div>
                   )}
                </div>
                <UserMenu />
             </div>
         </header>

         {/* Content Layer */}
          <div 
            className={cn(
                "absolute inset-0 flex select-none",
                throttledArtifacts.length === 0 ? "items-center justify-center pb-20" : "items-start justify-center pt-36",
                !isDraggingFrame && !isResizing && "transition-transform duration-75 ease-out"
            )}
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`
            }}
          >
             {throttledArtifacts.length > 0 ? (
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
                      setSelectedArtifactIndex(index);
                      if (activeTool === 'select') {
                        startDraggingFrame(e, index);
                      }
                    }}
                     className={cn(
                       "group absolute top-0 left-0 select-none",
                       activeTool === 'hand' ? "cursor-grab" : "cursor-default"
                     )}
                     style={{
                       transform: `translate(${artifact.x || 0}px, ${artifact.y || 0}px)`,
                       transition: isDraggingFrame && selectedArtifactIndex === index ? 'none' : isResizing ? 'none' : 'transform 0.2s ease-out'
                     }}
                   >
                    {/* Modern Floating Toolbar */}
                    {activeTool === 'select' && (selectedArtifactIndex === index || (artifact.isComplete && selectedArtifactIndex === index)) && (
                      <div 
                        className={cn(
                          "absolute left-1/2 flex items-center gap-3 z-[70] animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto",
                          selectedArtifactIndex !== index && "opacity-0 group-hover:opacity-100"
                        )} 
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                          bottom: `calc(100% + ${28 + 20 / zoom}px)`,
                          transform: `translateX(-50%) scale(${1 / zoom})`,
                          transformOrigin: 'bottom center'
                        }}
                      >
                        
                        {/* Main Toolbar Container */}
                        <div className="flex items-center gap-1 px-2 py-1.5 bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={status !== 'ready'}
                                className="h-9 px-3 text-foreground/80 hover:text-foreground rounded-lg flex items-center gap-2 text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {status !== 'ready' ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                ) : (
                                  <Sparkles className="h-4 w-4 text-primary" />
                                )}
                                Generate
                                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-56 bg-card border-border text-foreground rounded-xl shadow-2xl p-1.5 z-[100]">
                              <DropdownMenuItem 
                                onClick={() => handleArtifactAction('more', artifact)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px] font-medium"
                              >
                                <Plus className="h-4 w-4 text-primary" />
                                Create more pages
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleArtifactAction('regenerate', artifact)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px] font-medium"
                              >
                                <RotateCcw className="h-4 w-4 text-primary" />
                                Regenerate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleArtifactAction('variations', artifact)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px] font-medium"
                              >
                                <Columns className="h-4 w-4 text-primary" />
                                Variations
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={status !== 'ready'}
                            onClick={() => {
                                if (leftSidebarMode === 'properties') {
                                    setLeftSidebarMode('chat');
                                } else {
                                    setLeftSidebarMode('properties');
                                    setActiveTool('select');
                                }
                            }}
                            className={cn(
                                "h-9 w-9 text-foreground/80 hover:text-foreground rounded-lg flex items-center justify-center transition-all disabled:opacity-30",
                                leftSidebarMode === 'properties' && "bg-primary/10 text-primary shadow-lg shadow-primary/5"
                            )}
                            title="Edit Mode"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={status !== 'ready'}
                            onClick={() => {
                                if (leftSidebarMode === 'theme') {
                                    setLeftSidebarMode('chat');
                                } else {
                                    setLeftSidebarMode('theme');
                                }
                            }}
                            className={cn(
                                "h-9 w-9 text-foreground/80 hover:text-foreground rounded-lg flex items-center justify-center transition-all disabled:opacity-30",
                                leftSidebarMode === 'theme' && "bg-primary/10 text-primary shadow-lg shadow-primary/5"
                            )}
                            title="Theme Settings"
                          >
                            <Palette className="h-4 w-4" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 px-3 text-foreground/80 hover:text-foreground rounded-lg flex items-center gap-2 text-[13px] font-medium transition-colors"
                              >
                                {(() => {
                                  const mode = artifactPreviewModes[artifact.title] || (artifact.type === 'app' ? 'mobile' : 'desktop');
                                  if (mode === 'mobile') return <Smartphone className="h-4 w-4 opacity-70" />;
                                  if (mode === 'tablet') return <Tablet className="h-4 w-4 opacity-70" />;
                                  return <Monitor className="h-4 w-4 opacity-70" />;
                                })()}
                                Preview
                                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-48 bg-card border-border text-foreground rounded-xl shadow-2xl p-1.5 z-[100]">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setArtifactPreviewModes(prev => ({ ...prev, [artifact.title]: 'mobile' }));
                                  // Clear manual sizing to adopt mobile preset
                                  setThrottledArtifacts(prev => prev.map((a, i) => i === index ? { ...a, width: undefined, height: undefined } : a));
                                  setArtifacts(prev => prev.map((a, i) => i === index ? { ...a, width: undefined, height: undefined } : a));
                                }}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px]"
                              >
                                <div className="flex items-center gap-2">
                                  <Smartphone className="h-4 w-4" /> Mobile
                                </div>
                                <span className="text-[10px] text-muted-foreground">380px</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setArtifactPreviewModes(prev => ({ ...prev, [artifact.title]: 'tablet' }));
                                  setThrottledArtifacts(prev => prev.map((a, i) => i === index ? { ...a, width: undefined, height: undefined } : a));
                                  setArtifacts(prev => prev.map((a, i) => i === index ? { ...a, width: undefined, height: undefined } : a));
                                }}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px]"
                              >
                                <div className="flex items-center gap-2">
                                  <Tablet className="h-4 w-4" /> Tablet
                                </div>
                                <span className="text-[10px] text-muted-foreground">768px</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setArtifactPreviewModes(prev => ({ ...prev, [artifact.title]: 'desktop' }));
                                  setThrottledArtifacts(prev => prev.map((a, i) => i === index ? { ...a, width: undefined, height: undefined } : a));
                                  setArtifacts(prev => prev.map((a, i) => i === index ? { ...a, width: undefined, height: undefined } : a));
                                }}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px]"
                              >
                                <div className="flex items-center gap-2">
                                  <Monitor className="h-4 w-4" /> Desktop
                                </div>
                                <span className="text-[10px] text-muted-foreground">1280px</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <div className="w-[1px] h-4 bg-white/10 mx-1" />
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 w-9 p-0 text-foreground/80 hover:text-foreground rounded-lg flex items-center justify-center font-medium transition-colors"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 bg-card border-border text-foreground rounded-xl shadow-2xl p-1.5 z-[100]">
                              <DropdownMenuItem 
                                onClick={() => openCodeViewer(index)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px]"
                              >
                                <Code className="h-4 w-4 text-muted-foreground" />
                                View Code
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setExportArtifactIndex(index);
                                  setIsExportSheetOpen(true);
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px]"
                              >
                                <Share2 className="h-4 w-4 text-muted-foreground" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleExportZip(index)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer text-[13px]"
                              >
                                <Download className="h-4 w-4 text-muted-foreground" />
                                Download
                              </DropdownMenuItem>
                              <div className="h-px bg-border my-1" />
                              <DropdownMenuItem 
                                onClick={() => deleteArtifact(index)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-destructive/20 text-destructive cursor-pointer text-[13px]"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Feedback Container */}
                        <div className="flex items-center gap-0.5 px-1.5 py-1.5 bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleFeedback(index, artifact.isLiked ? 'none' : 'like')}
                            className={cn(
                              "h-9 w-9 p-0 rounded-lg transition-all",
                              artifact.isLiked ? "text-primary bg-primary/10" : "text-foreground/80 hover:text-foreground"
                            )}
                          >
                            <ThumbsUp className={cn("h-4 w-4", artifact.isLiked && "fill-current")} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleFeedback(index, artifact.isDisliked ? 'none' : 'dislike')}
                            className={cn(
                              "h-9 w-9 p-0 rounded-lg transition-all",
                              artifact.isDisliked ? "text-red-500 bg-red-500/10" : "text-foreground/80 hover:text-foreground"
                            )}
                          >
                            <ThumbsDown className={cn("h-4 w-4", artifact.isDisliked && "fill-current")} />
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
                        "transition-shadow duration-300 ease-in-out shadow-[0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden border relative flex-shrink-0",
                        isDraggingFrame && selectedArtifactIndex === index && "shadow-[0_60px_120px_rgba(0,0,0,0.5)]",
                        (() => {
                          const mode = artifactPreviewModes[artifact.title];
                          if (mode === 'mobile') return "w-[380px] rounded-sm";
                          if (mode === 'tablet') return "w-[768px] rounded-sm";
                          if (mode === 'desktop') return "w-[1280px] rounded-sm transition-all duration-300";
                         
                         return artifact.type === 'app' 
                           ? "w-[380px] rounded-sm" 
                           : artifact.type === 'web'
                             ? "w-[1024px] rounded-sm"
                             : "w-[600px] rounded-sm";
                        })()
                      )}
                        style={{
                          width: (() => {
                            const mode = artifactPreviewModes[artifact.title];
                            if (mode === 'mobile') return "380px";
                            if (mode === 'tablet') return "768px";
                            if (mode === 'desktop') return "1280px";
                            return artifact.width ? `${artifact.width}px` : (artifact.type === 'app' ? "380px" : artifact.type === 'web' ? "1024px" : "600px");
                          })(),
                          height: (() => {
                            const mode = artifactPreviewModes[artifact.title];
                            const heightFallback = dynamicFrameHeights[artifact.title] || (artifact.type === 'app' ? 800 : 700);
                            return artifact.height ? `${artifact.height}px` : `${heightFallback}px`;
                          })(),
                          minHeight: (artifactPreviewModes[artifact.title] === 'mobile' || (artifact.type === 'app' && !artifactPreviewModes[artifact.title])) ? '800px' : '400px',
                          transition: isResizing ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          backgroundColor: appliedTheme?.cssVars.background || 'var(--background)',
                          borderColor: selectedArtifactIndex === index ? SELECTION_BLUE : (appliedTheme?.cssVars.border || 'var(--border)'),
                          boxShadow: selectedArtifactIndex === index ? `0 0 0 2px ${SELECTION_BLUE}40, 0 40px 100px rgba(0,0,0,0.4)` : undefined
                        }}
                     >
                        {(!artifact.isComplete && !artifact.content) && <ModernShimmer type={artifact.type} appliedTheme={appliedTheme} />}
                    
                     <ArtifactFrame 
                       artifact={artifact}
                       index={index}
                       isEditMode={isEditMode}
                       activeTool={activeTool}
                       isDraggingFrame={isDraggingFrame}
                       appliedTheme={appliedTheme}
                        onRef={(idx, el) => { 
                          if (el) (el as any).dataset.artifactTitle = artifact.title;
                          iframeRefs.current[artifact.title] = el; 
                        }}
                     />
                     </div>

                     {/* Selection Overlays & Handles (Outside overflow-hidden) */}
                     {selectedArtifactIndex === index && (
                       <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 80 }}>
                          {/* Corner Handles */}
                          <div 
                            onMouseDown={(e) => startResizing(e, index, 'top-left')}
                            className="absolute top-0 left-0 w-2 h-2 border border-white pointer-events-auto cursor-nwse-resize -translate-x-1/2 -translate-y-1/2" 
                            style={{ backgroundColor: SELECTION_BLUE }}
                          />
                          <div 
                            onMouseDown={(e) => startResizing(e, index, 'top-right')}
                            className="absolute top-0 right-0 w-2 h-2 border border-white pointer-events-auto cursor-nesw-resize translate-x-1/2 -translate-y-1/2" 
                            style={{ backgroundColor: SELECTION_BLUE }}
                          />
                          <div 
                            onMouseDown={(e) => startResizing(e, index, 'bottom-left')}
                            className="absolute bottom-0 left-0 w-2 h-2 border border-white pointer-events-auto cursor-nesw-resize -translate-x-1/2 translate-y-1/2" 
                            style={{ backgroundColor: SELECTION_BLUE }}
                          />
                          <div 
                            onMouseDown={(e) => startResizing(e, index, 'bottom-right')}
                            className="absolute bottom-0 right-0 w-2 h-2 border border-white pointer-events-auto cursor-nwse-resize translate-x-1/2 translate-y-1/2" 
                            style={{ backgroundColor: SELECTION_BLUE }}
                          />

                          {/* Edge Resize Hit-Areas (Invisible but active) */}
                          <div 
                            onMouseDown={(e) => startResizing(e, index, 'top')}
                            className="absolute top-0 left-0 right-0 h-2 -translate-y-1/2 pointer-events-auto cursor-ns-resize hover:bg-blue-500/10"
                          />
                          <div 
                            onMouseDown={(e) => startResizing(e, index, 'bottom')}
                            className="absolute bottom-0 left-0 right-0 h-2 translate-y-1/2 pointer-events-auto cursor-ns-resize hover:bg-blue-500/10"
                          />
                          <div 
                            onMouseDown={(e) => startResizing(e, index, 'left')}
                            className="absolute top-0 bottom-0 w-2 -translate-x-1/2 pointer-events-auto cursor-ew-resize hover:bg-blue-500/10"
                          />
                          <div 
                            onMouseDown={(e) => startResizing(e, index, 'right')}
                            className="absolute top-0 bottom-0 w-2 translate-x-1/2 pointer-events-auto cursor-ew-resize hover:bg-blue-500/10"
                          />

                          {/* Middle Handles (Rectangular) */}
                          <div 
                            onMouseDown={(e) => startResizing(e, index, 'top')}
                            className="absolute top-0 left-1/2 w-3 h-1.5 border border-white pointer-events-auto cursor-ns-resize -translate-x-1/2 -translate-y-1/2 rounded-[1px]" 
                            style={{ backgroundColor: SELECTION_BLUE }}
                          />
                          <div 
                            onMouseDown={(e) => startResizing(e, index, 'bottom')}
                            className="absolute bottom-0 left-1/2 w-3 h-1.5 border border-white pointer-events-auto cursor-ns-resize -translate-x-1/2 translate-y-1/2 rounded-[1px]" 
                            style={{ backgroundColor: SELECTION_BLUE }}
                          />
                          <div 
                            onMouseDown={(e) => startResizing(e, index, 'left')}
                            className="absolute left-0 top-1/2 w-1.5 h-3 border border-white pointer-events-auto cursor-ew-resize -translate-x-1/2 -translate-y-1/2 rounded-[1px]" 
                            style={{ backgroundColor: SELECTION_BLUE }}
                          />
                          <div 
                            onMouseDown={(e) => startResizing(e, index, 'right')}
                            className="absolute right-0 top-1/2 w-1.5 h-3 border border-white pointer-events-auto cursor-ew-resize translate-x-1/2 -translate-y-1/2 rounded-[1px]" 
                            style={{ backgroundColor: SELECTION_BLUE }}
                          />
                       </div>
                     )}
                  </div>
                ))}
              </div>
             ) : (
                <div className="flex flex-col items-center gap-6 opacity-20 pointer-events-none">
                   {!isGenerating && (
                     <>
                       <Logo iconSize={80} showText={false} />
                       <p className="text-xl font-medium tracking-tight">Generate your first design to see it here</p>
                     </>
                   )}
                   {isGenerating && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className={cn(
                         "border border-border/20 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm relative transition-all duration-700 shadow-[0_50px_100px_rgba(0,0,0,0.4)]",
                         (designPlan[0]?.type === 'web') ? "w-[1024px] h-[640px]" : "w-[380px] h-[740px]"
                       )}
                     >
                       <ModernShimmer type={designPlan[0]?.type || 'app'} appliedTheme={appliedTheme} />
                       <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-[2px] z-[60]">
                          <Loader2 className="size-10 text-primary animate-spin" />
                          <span className="text-sm font-bold text-white tracking-[0.2em] animate-pulse">Synthesizing Vision...</span>
                       </div>
                     </motion.div>
                   )}
                </div>
             )}
          </div>

          {/* Prompt Details Dialog */}
          <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-900 text-white rounded-3xl p-8">
              <DialogHeader>
                <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Sparkles className="size-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight">Generation Node</DialogTitle>
                <DialogDescription className="text-zinc-500 font-medium pt-1">
                  The specific architectural prompt used to synthesize this screen.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 p-6 bg-white/5 border border-white/5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Code className="size-12" />
                </div>
                <p className="text-sm font-medium leading-relaxed text-zinc-300 italic relative z-10">
                  &ldquo;{viewingPrompt}&rdquo;
                </p>
              </div>
              <DialogFooter className="mt-8">
                <Button 
                  onClick={() => setIsPromptDialogOpen(false)}
                  className="w-full h-12 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest"
                >
                  Close Prompt
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Bottom Floating Toolbar */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 p-1.5 bg-card/95 backdrop-blur-xl rounded-xl border border-border/50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-1 z-30">
            <Button 
              onClick={() => setActiveTool('select')}
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-9 w-9 rounded-lg transition-all duration-200",
                activeTool === 'select' 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Select Tool (V)"
            >
               <MousePointer2 className="h-4.5 w-4.5" />
            </Button>
            <Button 
              onClick={() => setActiveTool('hand')}
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-9 w-9 rounded-lg transition-all duration-200",
                activeTool === 'hand' 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Hand Tool (H)"
            >
               <Hand className="h-4.5 w-4.5" />
            </Button>
            <div className="w-[1px] h-4 bg-border/50 mx-1" />
            <Button 
              onClick={() => setZoom(prev => Math.min(prev * 1.2, 5))}
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200"
              title="Zoom In (Ctrl +)"
            >
               <ZoomIn className="h-4.5 w-4.5" />
            </Button>
            <Button 
              onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.1))}
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200"
              title="Zoom Out (Ctrl -)"
            >
               <ZoomOut className="h-4.5 w-4.5" />
            </Button>
            <Button 
              onClick={() => {
                setCanvasOffset({ x: 0, y: 0 });
                setFramePos({ x: 0, y: 0 });
                setZoom(1);
              }}
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200"
              title="Reset View"
            >
               <RotateCcw className="h-4 w-4" />
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
                           <Files className="h-5 w-5" />
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
             <div className="space-y-4">
                {viewingPlan?.screens?.map((screen: any, idx: number) => {
                  const isGeneratingThisScreen = isGenerating && realtimeStatus?.currentScreen === screen.title;
                  const isScreeenComplete = artifacts.some(a => a.title === screen.title && a.isComplete);

                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "p-5 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-4 transition-all group relative overflow-hidden",
                        isGeneratingThisScreen ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : 
                        isScreeenComplete ? "border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_20px_-10px_rgba(16,185,129,0.2)]" : "hover:border-white/10"
                      )}
                    >
                       {isGeneratingThisScreen && (
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
                       )}

                       <div className={cn(
                         "size-10 rounded-xl bg-white/5 flex items-center justify-center transition-all",
                         isGeneratingThisScreen ? "bg-primary border border-primary text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" : 
                         isScreeenComplete ? "bg-emerald-500 border border-emerald-500 text-white" : "text-zinc-500 font-mono text-xs group-hover:bg-primary/10 group-hover:text-primary"
                       )}>
                          {isScreeenComplete ? <Check className="size-5" /> : 
                           isGeneratingThisScreen ? <Loader2 className="size-5 animate-spin" /> : 
                           String(idx + 1).padStart(2, '0')}
                       </div>

                       <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <span className={cn(
                                 "font-bold text-white tracking-tight transition-colors",
                                 isGeneratingThisScreen && "text-primary",
                                 isScreeenComplete && "text-emerald-400"
                               )}>{screen.title}</span>
                               {isGeneratingThisScreen && (
                                 <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[8px] font-black uppercase tracking-tighter text-primary border border-primary/20 animate-pulse">
                                   Designing...
                                 </span>
                               )}
                               {isScreeenComplete && (
                                 <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[8px] font-black uppercase tracking-tighter text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                    <div className="size-1 rounded-full bg-emerald-400" />
                                    Online
                                 </span>
                               )}
                             </div>
                             <span className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-500 border border-white/5">
                                {screen.type}
                             </span>
                          </div>
                          <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                             {screen.description}
                          </p>
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>

          <DialogFooter className="p-8 bg-zinc-900/30 border-t border-zinc-800/50">
             <Button 
               onClick={() => setIsPlanDialogOpen(false)}
               className="w-full h-12 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest"
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
            {/* Export Options */}
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
                  onClick={() => {
                    if (exportArtifactIndex !== null) {
                      const art = throttledArtifacts[exportArtifactIndex];
                      copyToClipboard(getInjectedHTML(art.content));
                    }
                  }}
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

            {/* Preview Section */}
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
    </div>
  );
}

