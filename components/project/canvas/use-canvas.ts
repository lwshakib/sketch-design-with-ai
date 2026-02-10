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

  // Wheel handling logic
  useEffect(() => {
    const element = previewRef.current;
    if (!element || loading) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        const scaleFactor = Math.pow(1.2, -e.deltaY / 120);
        const prevZoom = zoomRef.current;
        const prevOffset = canvasOffsetRef.current;
        
        const rect = element.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        const newZoom = Math.min(Math.max(prevZoom * scaleFactor, 0.1), 5);
        
        const dx = (mx - prevOffset.x) / prevZoom;
        const dy = (my - prevOffset.y) / prevZoom;
        
        const newOffsetX = mx - dx * newZoom;
        const newOffsetY = my - dy * newZoom;
        
        setZoom(newZoom);
        setCanvasOffset({ x: newOffsetX, y: newOffsetY });
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
  }, [previewRef, loading, setZoom, setCanvasOffset]);

  const resetView = useCallback(() => {
    setCanvasOffset({ x: 0, y: 0 });
    setFramePos({ x: 0, y: 0 });
    setZoom(1);
  }, [setCanvasOffset, setFramePos, setZoom]);

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
