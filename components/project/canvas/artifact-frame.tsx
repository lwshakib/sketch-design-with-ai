
import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { type Artifact } from "@/lib/artifact-renderer";
import { getInjectedHTML, sanitizeDocumentHtml } from "@/components/project/utils";

// Optimized Iframe component to prevent reloads during live editing
export interface ArtifactFrameProps {
  artifact: Artifact;
  index: number;
  isEditMode: boolean;
  activeTool: string;
  isDraggingFrame: boolean;
  appliedTheme: any;
  onRef: (index: number, el: HTMLIFrameElement | null) => void;
}

export const ArtifactFrame = React.memo(({ 
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

  const getThemeCSS = useCallback((theme: any) => {
    if (!theme || !theme.cssVars) return '';
    
    return `
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
  }, []);

  const applyThemeToIframe = useCallback(() => {
    if (!appliedTheme || !appliedTheme.cssVars || !iframeRef.current?.contentDocument) return;
    
    const doc = iframeRef.current.contentDocument;
    if (!doc || !doc.head) return;

    let styleEl = doc.getElementById('theme-overrides');
    
    if (!styleEl) {
      styleEl = doc.createElement('style');
      styleEl.id = 'theme-overrides';
      doc.head.appendChild(styleEl);
    }
    
    const css = getThemeCSS(appliedTheme);
    if (css && styleEl.textContent !== css) {
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
