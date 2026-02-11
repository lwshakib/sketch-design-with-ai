"use client";

import { useRef, useEffect, useCallback } from "react";
import { type Artifact } from "@/lib/artifact-renderer";
import { useProjectStore } from "@/hooks/use-project-store";

interface UseCanvasProps {
  onPersistFrame: (index: number) => void;
  onSave: () => void;
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export function useCanvas({
  onPersistFrame,
  onSave,
  previewRef
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
    selectedArtifactIndex,
    setSelectedArtifactIndex,
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
    setFramePos
  } = useProjectStore();
  
  const dragStart = useRef({ x: 0, y: 0 });
  const resizingStartSize = useRef({ width: 0, height: 0 });
  const resizingStartPos = useRef({ x: 0, y: 0 });
  const resizingStartFramePos = useRef({ x: 0, y: 0 });
  const previousToolRef = useRef<typeof activeTool | null>(null);
  
  const zoomRef = useRef(zoom);
  const canvasOffsetRef = useRef(canvasOffset);

  useEffect(() => {
    zoomRef.current = zoom;
    canvasOffsetRef.current = canvasOffset;
  }, [zoom, canvasOffset]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'hand') {
      setIsPanning(true);
      dragStart.current = { x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y };
    }
  }, [activeTool, canvasOffset, setIsPanning]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isPanning && activeTool === 'hand') {
      setCanvasOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    } else if (isDraggingFrame && activeTool === 'select' && selectedArtifactIndex !== null) {
      const newX = (e.clientX - dragStart.current.x) / zoom;
      const newY = (e.clientY - dragStart.current.y) / zoom;
      
      const update = (prev: Artifact[]) => {
        const next = [...prev];
        if (next[selectedArtifactIndex]) {
          next[selectedArtifactIndex] = { ...next[selectedArtifactIndex], x: newX, y: newY };
        }
        return next;
      };
      setThrottledArtifacts(update);
      setArtifacts(update);
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
        
        if (artifactPreviewModes[art.title]) {
          setArtifactPreviewModes(prevModes => {
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
  }, [isPanning, activeTool, isDraggingFrame, selectedArtifactIndex, zoom, isResizing, resizingHandle, artifactPreviewModes, setArtifactPreviewModes, setArtifacts, setThrottledArtifacts, setCanvasOffset]);

  const handleMouseUp = useCallback(() => {
    if ((isDraggingFrame || isResizing) && selectedArtifactIndex !== null) {
      onPersistFrame(selectedArtifactIndex);
    }
    if (isPanning || isDraggingFrame || isResizing) {
      onSave();
    }
    setIsPanning(false);
    setIsDraggingFrame(false);
    setIsResizing(false);
    setResizingHandle(null);
  }, [isDraggingFrame, isResizing, selectedArtifactIndex, isPanning, onPersistFrame, onSave, setIsPanning, setIsDraggingFrame, setIsResizing, setResizingHandle]);

  const startResizing = useCallback((e: React.MouseEvent, index: number, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizingHandle(handle);
    setSelectedArtifactIndex(index);
    
    const art = artifacts[index];
    if (!art) return;

    const mode = artifactPreviewModes[art.title];
    const defaultWidth = mode === 'app' ? 380 : mode === 'web' ? 1280 : (art.type === 'app' ? 380 : 1024);
    const defaultHeight = dynamicFrameHeights[art.title] || 800;

    resizingStartSize.current = { 
      width: art.width || defaultWidth, 
      height: art.height || defaultHeight 
    };
    resizingStartPos.current = { x: e.clientX, y: e.clientY };
    resizingStartFramePos.current = { x: art.x || 0, y: art.y || 0 };
  }, [artifacts, artifactPreviewModes, dynamicFrameHeights, setSelectedArtifactIndex, setIsResizing, setResizingHandle]);

  const startDraggingFrame = useCallback((e: React.MouseEvent, index: number) => {
    if (activeTool === 'select') {
      e.stopPropagation();
      setIsDraggingFrame(true);
      setSelectedArtifactIndex(index);
      const artifact = artifacts[index];
      const posX = artifact?.x || 0;
      const posY = artifact?.y || 0;
      dragStart.current = { x: e.clientX - posX * zoomRef.current, y: e.clientY - posY * zoomRef.current };
    }
  }, [activeTool, artifacts, setSelectedArtifactIndex, setIsDraggingFrame]);

  const handleZoom = useCallback((newScale: number, mx: number, my: number) => {
    const prevZoom = zoomRef.current;
    const prevOffset = canvasOffsetRef.current;
    
    // Clamp zoom between 0.1 and 5
    const nextZoom = Math.min(Math.max(newScale, 0.1), 5);
    if (nextZoom === prevZoom) return;

    // Calculate the mouse position in 1:1 coordinate space relative to top-left of the canvas
    const dx = (mx - prevOffset.x) / prevZoom;
    const dy = (my - prevOffset.y) / prevZoom;

    // Calculate new offset to keep the same point under the mouse
    const newOffsetX = mx - dx * nextZoom;
    const newOffsetY = my - dy * nextZoom;

    setZoom(nextZoom);
    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
  }, [setZoom, setCanvasOffset]);

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
        setCanvasOffset(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    element.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => element.removeEventListener('wheel', handleWheelNative);
  }, [previewRef, loading, handleZoom, setCanvasOffset]);

  // Keyboard handling logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');
      if (isInput) return;

      // Tool Switching (Press & Hold)
      if (e.key === ' ' && activeTool !== 'hand' && !e.repeat) {
        previousToolRef.current = activeTool;
        setActiveTool('hand');
      }
      if ((e.key === 'Control' || e.key === 'Meta') && activeTool !== 'select' && !e.repeat) {
        previousToolRef.current = activeTool;
        setActiveTool('select');
      }

      // Tool Switching (Toggle)
      if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
        previousToolRef.current = null;
      }
      if (e.key.toLowerCase() === 'h') {
        setActiveTool('hand');
        previousToolRef.current = null;
      }
      if (e.key.toLowerCase() === 'i') {
        setActiveTool('interact');
        previousToolRef.current = null;
      }

      const element = previewRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Zooming
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoom(zoomRef.current * 1.2, centerX, centerY);
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoom(zoomRef.current / 1.2, centerX, centerY);
        } else if (e.key === '0') {
          e.preventDefault();
          resetView();
        }
      }

      // Panning with arrows
      const panStep = 50 / zoomRef.current;
      if (e.key === 'ArrowLeft') setCanvasOffset(prev => ({ ...prev, x: prev.x + panStep }));
      if (e.key === 'ArrowRight') setCanvasOffset(prev => ({ ...prev, x: prev.x - panStep }));
      if (e.key === 'ArrowUp') setCanvasOffset(prev => ({ ...prev, y: prev.y + panStep }));
      if (e.key === 'ArrowDown') setCanvasOffset(prev => ({ ...prev, y: prev.y - panStep }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Control' || e.key === 'Meta') {
        if (previousToolRef.current) {
          setActiveTool(previousToolRef.current);
          previousToolRef.current = null;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [previewRef, handleZoom, resetView, setCanvasOffset, activeTool, setActiveTool]);

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
    resetView
  };
}
