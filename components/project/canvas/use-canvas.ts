"use client";

/**
 * @file use-canvas.ts
 * @description custom hook that encapsulates the complex interaction logic for the project canvas.
 * It manages panning, zooming (with coordinate-space correction), box-selection of multiple artifacts,
 * and dragging/resizing calculation for artifact frames.
 */

import { useRef, useEffect, useCallback } from "react";
import { type Artifact } from "@/lib/artifact-renderer";
import { useProjectStore } from "@/hooks/use-project-store";

/**
 * Props for the useCanvas hook.
 */
interface UseCanvasProps {
  /** Callback triggered when a frame's position or size is finalized (persistence) */
  onPersistFrame: (indices: number[]) => void;
  /** Callback triggered to save the current workspace state */
  onSave: () => void;
  /** Ref to the scrollable container of the canvas */
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export function useCanvas({
  onPersistFrame,
  onSave,
  previewRef,
}: UseCanvasProps) {
  const {
    zoom,
    setZoom,
    canvasOffset,
    setCanvasOffset,
    artifacts,
    setArtifacts,
    setThrottledArtifacts,
    artifactPreviewModes,
    setArtifactPreviewModes,
    dynamicFrameHeights,
    selectedArtifactIds,
    setSelectedArtifactIds,
    selectionBox,
    setSelectionBox,
    loading,
    activeTool,
    setActiveTool,
    isPanning,
    setIsPanning,
    isDraggingFrame,
    setIsDraggingFrame,
    isResizing,
    setIsResizing,
    resizingHandle,
    setResizingHandle,
    setFramePos,
  } = useProjectStore();

  const dragStart = useRef({ x: 0, y: 0 });
  const selectionStartPos = useRef({ x: 0, y: 0 });
  const initialArtifactPositions = useRef<
    Record<string, { x: number; y: number }>
  >({});
  const resizingStartSize = useRef({ width: 0, height: 0 });
  const resizingStartPos = useRef({ x: 0, y: 0 });
  const resizingStartFramePos = useRef({ x: 0, y: 0 });
  const previousToolRef = useRef<typeof activeTool | null>(null);

  const zoomRef = useRef(zoom);
  const canvasOffsetRef = useRef(canvasOffset);

  // Synchronize refs with state for use in event listeners and callbacks
  useEffect(() => {
    zoomRef.current = zoom;
    canvasOffsetRef.current = canvasOffset;
  }, [zoom, canvasOffset]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = previewRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (activeTool === "hand") {
        setIsPanning(true);
        dragStart.current = {
          x: e.clientX - canvasOffset.x,
          y: e.clientY - canvasOffset.y,
        };
      } else if (activeTool === "select") {
        // Start selection box on background
        selectionStartPos.current = { x: mx, y: my };
        setSelectionBox({ x1: mx, y1: my, x2: mx, y2: my });
        if (!(e.shiftKey || e.metaKey)) {
          setSelectedArtifactIds(new Set());
        }
      }
    },
    [
      activeTool,
      canvasOffset,
      setIsPanning,
      setSelectionBox,
      setSelectedArtifactIds,
      previewRef,
    ],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const rect = previewRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (isPanning && activeTool === "hand") {
        setCanvasOffset({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y,
        });
      } else if (selectionBox && activeTool === "select") {
        setSelectionBox({ ...selectionBox, x2: mx, y2: my });
      } else if (
        isDraggingFrame &&
        activeTool === "select" &&
        selectedArtifactIds.size > 0
      ) {
        // The actual scale applied is zoom * 0.5
        const actualScale = zoom * 0.5;
        const dx = (e.clientX - dragStart.current.x) / actualScale;
        const dy = (e.clientY - dragStart.current.y) / actualScale;

        const update = (prev: Artifact[]) => {
          return prev.map((art) => {
            if (art.id && selectedArtifactIds.has(art.id)) {
              const initial = initialArtifactPositions.current[art.id];
              if (initial) {
                return { ...art, x: initial.x + dx, y: initial.y + dy };
              }
            }
            return art;
          });
        };
        setThrottledArtifacts(update);
        setArtifacts(update);
      } else if (
        isResizing &&
        selectedArtifactIds.size === 1 &&
        resizingHandle
      ) {
        const selectedId = Array.from(selectedArtifactIds)[0];
        const selectedIndex = artifacts.findIndex((a) => a.id === selectedId);
        if (selectedIndex === -1) return;

        const actualScale = zoom * 0.5;
        const dx = (e.clientX - resizingStartPos.current.x) / actualScale;
        const dy = (e.clientY - resizingStartPos.current.y) / actualScale;

        const updateArtifact = (prev: Artifact[]) => {
          const next = [...prev];
          const art = next[selectedIndex];
          if (!art) return prev;

          let newWidth = resizingStartSize.current.width;
          let newHeight = resizingStartSize.current.height;
          let newX = resizingStartFramePos.current.x;
          let newY = resizingStartFramePos.current.y;

          if (resizingHandle.includes("right")) {
            newWidth = Math.max(200, resizingStartSize.current.width + dx);
          }
          if (resizingHandle.includes("left")) {
            const deltaWidth = resizingStartSize.current.width - dx;
            if (deltaWidth > 200) {
              newWidth = deltaWidth;
              newX = resizingStartFramePos.current.x + dx;
            }
          }
          if (resizingHandle.includes("bottom")) {
            newHeight = Math.max(200, resizingStartSize.current.height + dy);
          }
          if (resizingHandle.includes("top")) {
            const deltaHeight = resizingStartSize.current.height - dy;
            if (deltaHeight > 200) {
              newHeight = deltaHeight;
              newY = resizingStartFramePos.current.y + dy;
            }
          }

          next[selectedIndex] = {
            ...art,
            width: newWidth,
            height: newHeight,
            x: newX,
            y: newY,
          };

          if (artifactPreviewModes[art.title]) {
            setArtifactPreviewModes((prevModes) => {
              const n = { ...prevModes };
              delete n[art.title];
              return n;
            });
          }
          return next;
        };

        setThrottledArtifacts(updateArtifact);
        setArtifacts(updateArtifact);
      }
    },
    [
      isPanning,
      activeTool,
      isDraggingFrame,
      selectedArtifactIds,
      zoom,
      isResizing,
      resizingHandle,
      artifactPreviewModes,
      selectionBox,
      setArtifactPreviewModes,
      setArtifacts,
      setThrottledArtifacts,
      setCanvasOffset,
      artifacts,
      previewRef,
      setSelectionBox,
    ],
  );

  const handleMouseUp = useCallback(() => {
    if (selectionBox) {
      const rect = previewRef.current?.getBoundingClientRect();
      if (rect) {
        const x1 = Math.min(selectionBox.x1, selectionBox.x2);
        const y1 = Math.min(selectionBox.y1, selectionBox.y2);
        const x2 = Math.max(selectionBox.x1, selectionBox.x2);
        const y2 = Math.max(selectionBox.y1, selectionBox.y2);

        const newlySelected = new Set<string>();
        artifacts.forEach((art) => {
          if (!art.id) return;
          const mode = artifactPreviewModes[art.title];
          const width =
            art.width ||
            (mode === "app"
              ? 380
              : mode === "web"
                ? 1280
                : mode === "tablet"
                  ? 768
                  : art.type === "app"
                    ? 380
                    : 1024);
          const height =
            art.height ||
            dynamicFrameHeights[art.title] ||
            (art.type === "app" ? 800 : 700);

          // Artifact world to screen coordinates
          // The actual scale applied is zoom * 0.5
          const actualScale = zoom * 0.5;
          const originX = rect.width / 2;
          // pt-36 = 144px. If empty, centered.
          const originY = artifacts.length === 0 ? rect.height / 2 : 144;

          const ax1 = originX + canvasOffset.x + (art.x || 0) * actualScale;
          const ay1 = originY + canvasOffset.y + (art.y || 0) * actualScale;
          const ax2 = ax1 + width * actualScale;
          const ay2 = ay1 + height * actualScale;

          const overlaps = !(x2 < ax1 || x1 > ax2 || y2 < ay1 || y1 > ay2);
          if (overlaps) {
            newlySelected.add(art.id);
          }
        });

        // Use the event stored from mousedown/mousemove if possible,
        // but since shiftKey is on the MouseUp event too, let's just check it there
        // Actually MouseUp event might not have shiftKey reliably in all handlers?
        // Let's assume it works or we might need to track it.
        const isShiftDown = (window.event as MouseEvent)?.shiftKey;

        setSelectedArtifactIds((prev) => {
          if (isShiftDown) {
            const next = new Set(prev);
            newlySelected.forEach((id) => next.add(id));
            return next;
          }
          return newlySelected;
        });
      }
      setSelectionBox(null);
    }

    if ((isDraggingFrame || isResizing) && selectedArtifactIds.size > 0) {
      const indices = Array.from(selectedArtifactIds)
        .map((id) => artifacts.findIndex((a) => a.id === id))
        .filter((i) => i !== -1);
      if (indices.length > 0) {
        onPersistFrame(indices);
      }
    }
    if (isPanning || isDraggingFrame || isResizing) {
      onSave();
    }
    setIsPanning(false);
    setIsDraggingFrame(false);
    setIsResizing(false);
    setResizingHandle(null);
  }, [
    isDraggingFrame,
    isResizing,
    selectedArtifactIds,
    isPanning,
    onPersistFrame,
    onSave,
    setIsPanning,
    setIsDraggingFrame,
    setIsResizing,
    setResizingHandle,
    selectionBox,
    artifacts,
    artifactPreviewModes,
    dynamicFrameHeights,
    zoom,
    canvasOffset,
    setSelectedArtifactIds,
    previewRef,
    setSelectionBox,
  ]);

  const startResizing = useCallback(
    (e: React.MouseEvent, index: number, handle: string) => {
      e.stopPropagation();
      e.preventDefault();
      const art = artifacts[index];
      if (!art || !art.id) return;

      setIsResizing(true);
      setResizingHandle(handle);
      setSelectedArtifactIds(new Set([art.id]));

      const mode = artifactPreviewModes[art.title];
      const defaultWidth =
        mode === "app"
          ? 380
          : mode === "web"
            ? 1280
            : mode === "tablet"
              ? 768
              : art.type === "app"
                ? 380
                : 1024;
      const defaultHeight = dynamicFrameHeights[art.title] || 800;

      resizingStartSize.current = {
        width: art.width || defaultWidth,
        height: art.height || defaultHeight,
      };
      resizingStartPos.current = { x: e.clientX, y: e.clientY };
      resizingStartFramePos.current = { x: art.x || 0, y: art.y || 0 };
    },
    [
      artifacts,
      artifactPreviewModes,
      dynamicFrameHeights,
      setSelectedArtifactIds,
      setIsResizing,
      setResizingHandle,
    ],
  );

  const startDraggingFrame = useCallback(
    (e: React.MouseEvent, index: number) => {
      if (activeTool === "select") {
        e.stopPropagation();
        const artifact = artifacts[index];
        if (!artifact || !artifact.id) return;

        const isAlreadySelected = selectedArtifactIds.has(artifact.id);

        if (e.shiftKey || e.metaKey) {
          setSelectedArtifactIds((prev) => {
            const next = new Set(prev);
            if (isAlreadySelected) next.delete(artifact.id!);
            else next.add(artifact.id!);
            return next;
          });
          return;
        }

        let currentSelection = selectedArtifactIds;
        if (!isAlreadySelected) {
          currentSelection = new Set([artifact.id]);
          setSelectedArtifactIds(currentSelection);
        }

        setIsDraggingFrame(true);
        dragStart.current = { x: e.clientX, y: e.clientY };

        // Store initial positions of all selected artifacts
        const positions: Record<string, { x: number; y: number }> = {};
        artifacts.forEach((art) => {
          if (art.id && currentSelection.has(art.id)) {
            positions[art.id] = { x: art.x || 0, y: art.y || 0 };
          }
        });
        initialArtifactPositions.current = positions;
      }
    },
    [
      activeTool,
      artifacts,
      setSelectedArtifactIds,
      setIsDraggingFrame,
      selectedArtifactIds,
    ],
  );

  /**
   * Complex zoom logic that keeps the point under the mouse (mx, my) stationary
   * by adjusting the canvas offset proportional to the zoom delta.
   *
   * @param newScale The target zoom level (1.0 = 100%)
   * @param mx Mouse X coordinate relative to the preview container
   * @param my Mouse Y coordinate relative to the preview container
   */
  const handleZoom = useCallback(
    (newScale: number, mx: number, my: number) => {
      const rect = previewRef.current?.getBoundingClientRect();
      if (!rect) return;

      // The content is centered horizontally (OriginX = width / 2)
      // and pinned to the top (OriginY = 144 or centerY if empty)
      const originX = rect.width / 2;
      const originY = artifacts.length === 0 ? rect.height / 2 : 144;

      // Convert screen-relative mx/my to origin-relative coordinates (our "world space")
      const localMx = mx - originX;
      const localMy = my - originY;

      const prevZoom = zoomRef.current;

      // Clamp zoom between 0.1 and 5
      const nextZoom = Math.min(Math.max(newScale, 0.1), 5);
      if (nextZoom === prevZoom) return;

      // The actual scale applied in CSS is zoom * 0.5 (scaled down for better workspace feel)
      const prevActualScale = prevZoom * 0.5;
      const nextActualScale = nextZoom * 0.5;

      // dx/dy are the content-space coordinates (unscaled) of the point under the cursor
      const dx = (localMx - canvasOffsetRef.current.x) / prevActualScale;
      const dy = (localMy - canvasOffsetRef.current.y) / prevActualScale;

      // New offsets are calculated such that: localM = dx * newScale + newOffset
      const newOffsetX = localMx - dx * nextActualScale;
      const newOffsetY = localMy - dy * nextActualScale;

      setZoom(nextZoom);
      setCanvasOffset({ x: newOffsetX, y: newOffsetY });
    },
    [setZoom, setCanvasOffset, artifacts.length, previewRef],
  );

  const resetView = useCallback(() => {
    setCanvasOffset({ x: 0, y: 0 });
    setFramePos({ x: 0, y: 0 });
    setZoom(1);
  }, [setCanvasOffset, setFramePos, setZoom]);

  // Wheel handling logic
  useEffect(() => {
    const element = previewRef.current;
    if (!element || loading) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const scaleFactor = Math.pow(1.2, -e.deltaY / 120);
        const rect = element.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        handleZoom(zoomRef.current * scaleFactor, mx, my);
      } else {
        // Normal scroll for panning
        setCanvasOffset((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    element.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => element.removeEventListener("wheel", handleWheelNative);
  }, [previewRef, loading, handleZoom, setCanvasOffset]);

  // Keyboard handling logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA"].includes(
        document.activeElement?.tagName || "",
      );
      if (isInput) return;

      // Tool Switching (Press & Hold)
      if (e.key === " " && activeTool !== "hand" && !e.repeat) {
        previousToolRef.current = activeTool;
        setActiveTool("hand");
      }
      if (
        (e.key === "Control" || e.key === "Meta") &&
        activeTool !== "select" &&
        !e.repeat
      ) {
        previousToolRef.current = activeTool;
        setActiveTool("select");
      }

      // Tool Switching (Toggle)
      if (e.key.toLowerCase() === "v") {
        setActiveTool("select");
        previousToolRef.current = null;
      }
      if (e.key.toLowerCase() === "h") {
        setActiveTool("hand");
        previousToolRef.current = null;
      }
      if (e.key.toLowerCase() === "i") {
        setActiveTool("interact");
        previousToolRef.current = null;
      }

      const element = previewRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Zooming
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          handleZoom(zoomRef.current * 1.2, centerX, centerY);
        } else if (e.key === "-") {
          e.preventDefault();
          handleZoom(zoomRef.current / 1.2, centerX, centerY);
        } else if (e.key === "0") {
          e.preventDefault();
          resetView();
        }
      }

      // Panning with arrows
      const panStep = 50 / zoomRef.current;
      if (e.key === "ArrowLeft")
        setCanvasOffset((prev) => ({ ...prev, x: prev.x + panStep }));
      if (e.key === "ArrowRight")
        setCanvasOffset((prev) => ({ ...prev, x: prev.x - panStep }));
      if (e.key === "ArrowUp")
        setCanvasOffset((prev) => ({ ...prev, y: prev.y + panStep }));
      if (e.key === "ArrowDown")
        setCanvasOffset((prev) => ({ ...prev, y: prev.y - panStep }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Control" || e.key === "Meta") {
        if (previousToolRef.current) {
          setActiveTool(previousToolRef.current);
          previousToolRef.current = null;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    previewRef,
    handleZoom,
    resetView,
    setCanvasOffset,
    activeTool,
    setActiveTool,
  ]);

  return {
    activeTool,
    setActiveTool,
    isPanning,
    isDraggingFrame,
    isResizing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    startResizing,
    startDraggingFrame,
    resetView,
  };
}
