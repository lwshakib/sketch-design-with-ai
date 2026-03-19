import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * @file artifact-frame.tsx
 * @description Highly optimized Iframe wrapper for rendering design artifacts.
 * It uses a "Virtual DOM" like approach for the iframe content: instead of updating
 * 'srcDoc' (which causes a full reload/white flash), it communicates with a script
 * inside the iframe via 'postMessage' to surgically update the body and styles.
 * This preserves the user's selection and provides a fluid editing experience.
 */

import { cn } from "@/lib/utils";
import { type Artifact } from "@/lib/artifact-renderer";
import {
  getInjectedHTML,
  sanitizeDocumentHtml,
} from "@/components/project/utils";

// Optimized Iframe component to prevent reloads during live editing
export interface ArtifactFrameProps {
  artifact: Artifact;
  index: number;
  isEditMode: boolean;
  activeTool: string;
  isDraggingFrame: boolean;
  onRef: (index: number, el: HTMLIFrameElement | null) => void;
}

/**
 * ArtifactFrame is memoized to prevent unnecessary re-renders of the expensive iframe
 * unless its core properties or content actually change.
 */
export const ArtifactFrame = React.memo(
  ({
    artifact,
    index,
    isEditMode,
    activeTool,
    isDraggingFrame,
    onRef,
  }: ArtifactFrameProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    /**
     * Initial content set only once to avoid reloads.
     * Subsequent updates happen via window.postMessage.
     */
    const [initialSrcDoc] = useState(() => getInjectedHTML(artifact.content));
    const lastContentRef = useRef(artifact.content);

    // Use useEffect to handle content updates via postMessage instead of srcDoc
    useEffect(() => {
      // Only update via postMessage if content changed and it's not the initial content
      if (artifact.content !== lastContentRef.current) {
        // IMPORTANT: Check if the content is already in the iframe to avoid wiping selection
        if (iframeRef.current?.contentDocument) {
          const currentContent = sanitizeDocumentHtml(
            iframeRef.current.contentDocument,
            artifact.content,
          );
          if (currentContent === artifact.content) {
            lastContentRef.current = artifact.content;
            return;
          }
        }

        // Only update if complete or a substantial new block is ready
        if (
          artifact.isComplete ||
          artifact.content.length > lastContentRef.current.length + 200
        ) {
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              {
                type: "UPDATE_CONTENT",
                content: artifact.content,
              },
              "*",
            );
          }
          lastContentRef.current = artifact.content;
        }
      }
    }, [artifact.content, artifact.isComplete]);

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
          (activeTool === "select" ||
            activeTool === "hand" ||
            isDraggingFrame) &&
            !isEditMode
            ? "pointer-events-none"
            : "pointer-events-auto",
        )}
        title={artifact.title}
      />
    );
  },
);

ArtifactFrame.displayName = "ArtifactFrame";
