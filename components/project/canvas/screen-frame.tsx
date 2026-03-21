import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * @file screen-frame.tsx
 * @description Highly optimized Iframe wrapper for rendering design screens.
 * It uses a "Virtual DOM" like approach for the iframe content: instead of updating
 * 'srcDoc' (which causes a full reload/white flash), it communicates with a script
 * inside the iframe via 'postMessage' to surgically update the body and styles.
 * This preserves the user's selection and provides a fluid editing experience.
 */

import { cn } from "@/lib/utils";
import { type Artifact } from "@/lib/types";
import {
  getInjectedHTML,
  sanitizeDocumentHtml,
} from "@/components/project/utils";

// Optimized Iframe component to prevent reloads during live editing
export interface ScreenFrameProps {
  artifact: Artifact;
  index: number;
  isEditMode: boolean;
  activeTool: string;
  isDraggingFrame: boolean;
  onRef: (index: number, el: HTMLIFrameElement | null) => void;
}

/**
 * ScreenFrame is memoized to prevent unnecessary re-renders of the expensive iframe
 * unless its core properties or content actually change.
 */
export const ScreenFrame = React.memo(
  ({
    artifact,
    index,
    isEditMode,
    activeTool,
    isDraggingFrame,
    onRef,
  }: ScreenFrameProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    /**
     * Initial content set only once to avoid reloads.
     * Subsequent updates happen via window.postMessage.
     */
    const [initialSrcDoc] = useState(() => getInjectedHTML(artifact.html));
    const lastContentRef = useRef(artifact.html);

    // Use useEffect to handle content updates via postMessage instead of srcDoc
    useEffect(() => {
      // Only update via postMessage if content changed and it's not the initial content
      if (artifact.html !== lastContentRef.current) {
        // IMPORTANT: Check if the content is already in the iframe to avoid wiping selection
        if (iframeRef.current?.contentDocument) {
          const currentContent = sanitizeDocumentHtml(
            iframeRef.current.contentDocument,
            artifact.html,
          );
          if (currentContent === artifact.html) {
            lastContentRef.current = artifact.html;
            return;
          }
        }

        // Only update if complete or a substantial new block is ready
        if (
          artifact.isComplete ||
          artifact.html.length > lastContentRef.current.length + 200
        ) {
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              {
                type: "UPDATE_CONTENT",
                content: artifact.html,
              },
              "*",
            );
          }
          lastContentRef.current = artifact.html;
        }
      }
    }, [artifact.html, artifact.isComplete]);
    
    const effectivelyInEditMode = isEditMode || activeTool === "edit";

    // Synchronize edit mode with the iframe internal state
    useEffect(() => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              {
                type: "SET_EDIT_MODE",
                enabled: effectivelyInEditMode,
              },
              "*",
            );
        }
    }, [effectivelyInEditMode]);

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
          "h-full w-full overflow-hidden border-none",
          (activeTool === "edit" || effectivelyInEditMode) 
            ? "pointer-events-auto"
            : (activeTool === "select" || activeTool === "hand" || isDraggingFrame)
              ? "pointer-events-none"
              : "pointer-events-auto",
        )}
        title={artifact.title}
      />
    );
  },
);

ScreenFrame.displayName = "ScreenFrame";
