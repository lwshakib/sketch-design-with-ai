"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { fetchInngestToken } from "@/app/actions/inngest";
import { extractArtifacts, type Artifact } from "@/lib/artifact-renderer";
import { ChatSidebar } from "@/components/project/chat-sidebar";
import { SecondarySidebar } from "@/components/project/secondary-sidebar";
import { CanvasArea } from "@/components/project/canvas/canvas-area";
import { useCanvas } from "@/components/project/canvas/use-canvas";
import { sanitizeDocumentHtml } from "@/components/project/utils";
import JSZip from "jszip";
import html2canvas from "html2canvas";
import { authClient } from "@/lib/auth-client";
import { ProjectDialogs } from "@/components/project/project-dialogs";
import { CodeViewerModal } from "@/components/project/code-viewer-modal";
import { useProjectStore } from "@/hooks/use-project-store";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const previewRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    project, setProject,
    loading, setLoading,
    artifacts, setArtifacts,
    throttledArtifacts, setThrottledArtifacts,
    attachments, setAttachments,
    input, setInput,
    zoom, setZoom,
    canvasOffset, setCanvasOffset,
    framePos, setFramePos,
    dynamicFrameHeights, setDynamicFrameHeights,
    artifactPreviewModes, setArtifactPreviewModes,
    selectedArtifactIds, setSelectedArtifactIds,
    leftSidebarMode, setLeftSidebarMode,
    secondarySidebarMode, setSecondarySidebarMode,
    activeThemeId, setActiveThemeId,
    appliedTheme, setAppliedTheme,
    selectedEl, setSelectedEl,
    isCodeViewerOpen, setIsCodeViewerOpen,
    isGenerating, setIsGenerating,
    viewingCode, setViewingCode,
    viewingTitle, setViewingTitle,
    isRegenerateDialogOpen, setIsRegenerateDialogOpen,
    regenerateInstructions, setRegenerateInstructions,
    isSaving, setIsSaving,
    hasUnsavedChanges, setHasUnsavedChanges,
    isEditTitleDialogOpen, setIsEditTitleDialogOpen,
    editingTitle, setEditingTitle,
    isDeleteDialogOpen, setIsDeleteDialogOpen,
    isExportSheetOpen, setIsExportSheetOpen,
    exportArtifactIndex, setExportArtifactIndex,
    isSidebarVisible, setIsSidebarVisible,
    is3xMode,
    hasCopied, setHasCopied,
    designPlan, setDesignPlan,
    realtimeStatus, setRealtimeStatus,
    isPlanDialogOpen, setIsPlanDialogOpen,
    isPromptDialogOpen, setIsPromptDialogOpen,
    viewingPrompt, setViewingPrompt,
    websiteUrl, setWebsiteUrl,
    regeneratingArtifactIds, setRegeneratingArtifactIds,
    messages, setMessages,
    updateState, setActiveTool, resetProjectState
  } = useProjectStore();

  const handlePersistArtifacts = async (indices: number[]) => {
    for (const index of indices) {
      const artifact = artifacts[index];
      if (!artifact || !artifact.id) continue;
      try {
        await fetch(`/api/screens/${artifact.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x: artifact.x, y: artifact.y, width: artifact.width, height: artifact.height })
        });
      } catch (error) {
        console.error('Failed to persist frame:', error);
      }
    }
  };

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    startResizing,
    startDraggingFrame,
  } = useCanvas({
    onPersistFrame: (indices) => handlePersistArtifacts(indices),
    onSave: () => debouncedSave(),
    previewRef
  });

  const chatStatus = isGenerating ? 'streaming' : 'ready';
  const chatError = null;

  const sendMessage = useCallback(async (params: { text: string; files?: any[] }, options?: any) => {
    const { is3xMode, websiteUrl, messages } = useProjectStore.getState();
    const isSilent = options?.body?.isSilent;
    const newUserMessage = {
      id: `m-${Date.now()}`,
      role: 'user' as const,
      content: params.text,
      parts: params.files?.length ? [{ type: 'text', text: params.text }, ...params.files] : [{ type: 'text', text: params.text }],
      isSilent
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsGenerating(true);

    try {
      const body = {
        projectId,
        messages: updatedMessages.map(m => ({
          role: m.role,
          content: m.content || (m.parts as any[])?.find(p => p.type === 'text')?.text || ""
        })),
        is3xMode,
        websiteUrl,
        ...options?.body
      };

      console.log('DEBUG: Custom sendMessage sending body:', body);
      await axios.post('/api/chat', body);
    } catch (err) {
      console.error('Chat error:', err);
      toast.error("Engine encountered an error.");
      setIsGenerating(false);
    }
  }, [projectId, setMessages, setIsGenerating]);

  const handleRetry = useCallback(() => {
    const { messages } = useProjectStore.getState();
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      const textContent = lastUserMessage.content || (lastUserMessage.parts as any[])
        ?.filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
      
      sendMessage({ text: textContent });
    }
  }, [sendMessage]);

  // Initial waiting state is handled by the generation block in ChatSidebar.
  // Vision and Plan will be merged into the assistant message once the manifest is generated.


  const { data: realtimeData } = useInngestSubscription({
    refreshToken: () => fetchInngestToken(projectId),
  });

  const processedCountRef = useRef(0);
  const designPlanRef = useRef(designPlan.screens);
  useEffect(() => { designPlanRef.current = designPlan.screens; }, [designPlan.screens]);

  useEffect(() => {
    if (!realtimeData || realtimeData.length === 0) return;
    const newEvents = realtimeData.slice(processedCountRef.current);
    if (newEvents.length === 0) return;
    processedCountRef.current = realtimeData.length;

    let hasPlanUpdate = false;
    let newPlan: any = null;
    let newMarkdown: string = "";

    newEvents.forEach((event: any) => {
      if (event.topic === 'plan') {
        const { plan, markdown } = event.data;
        if (plan?.screens) {
          hasPlanUpdate = true;
          newPlan = plan;
          newMarkdown = markdown;
          setDesignPlan({ screens: plan.screens, _markdown: markdown || plan._markdown });
        }
      } else if (event.topic === 'status') {
        setRealtimeStatus(event.data);
        if (event.data.status === 'vision' || event.data.status === 'planning') setIsGenerating(true);
        if (event.data.status === 'regenerating' && event.data.screenId) {
          setIsGenerating(true);
          setRegeneratingArtifactIds(prev => new Set(prev).add(event.data.screenId));
        }
        if (event.data.status === 'generating' && event.data.currentScreen) {
          setIsGenerating(true);
          const title = event.data.currentScreen;
          const updateFn = (prev: Artifact[]) => {
            if (prev.some(a => a.title === title)) return prev;
            const planItem = designPlanRef.current.find(p => p.title === title);
            const type = planItem?.type || 'web';
            const getNewX = (existing: any[], scrType: string) => {
              const last = existing[existing.length - 1];
              const getWidth = (t: string) => t === 'app' ? 380 : t === 'web' ? 1024 : 800;
              const currentWidth = getWidth(scrType);
              return last ? (last.x || 0) + (last.width || getWidth(last.type)) + 120 : -(currentWidth / 2);
            };
            return [...prev, { title, content: "", type: type as 'web' | 'app', isComplete: false, x: getNewX(prev, type), y: 0 }];
          };
          setArtifacts(updateFn);
          setThrottledArtifacts(updateFn);
        }
        if (event.data.status === 'complete') {
          setIsGenerating(false);
          setMessages(prev => {
            const updated = [...prev];
            const lastAssistantIndex = [...updated].reverse().findIndex(m => m.role === 'assistant');
            if (lastAssistantIndex !== -1) {
              const actualIndex = updated.length - 1 - lastAssistantIndex;
              (updated[actualIndex] as any).status = 'completed';
            }
            return updated;
          });
          if (event.data.isSilent) {
            toast.success("Screen updated successfully!");
            setRegeneratingArtifactIds(new Set()); // Clear all if silent complete
          } else {
            toast.success("Design generation complete!");
          }
        }
        if (event.data.status === 'partial_complete' && event.data.screen) {
          setIsGenerating(true);
          const newScreen = event.data.screen;
          const updateFn = (prev: Artifact[]) => {
            const updated = [...prev];
            const idx = updated.findIndex(a => a.title === newScreen.title);
            if (idx >= 0) {
              updated[idx] = { ...updated[idx], ...newScreen, x: updated[idx].x, y: updated[idx].y, isComplete: true };
              if (newScreen.id) {
                setRegeneratingArtifactIds(prev => {
                  const next = new Set(prev);
                  next.delete(newScreen.id);
                  return next;
                });
              }
            } else {
              const getNewX = (existing: any[], type: string) => {
                const last = existing[existing.length - 1];
                const getWidth = (t: string) => t === 'app' ? 380 : t === 'web' ? 1024 : 800;
                return last ? (last.x || 0) + (last.width || getWidth(last.type)) + 120 : -(getWidth(type) / 2);
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

    if (hasPlanUpdate) {
      setMessages(prev => {
        const existingPlanMsgIndex = prev.findIndex(m => m.id === 'assistant-plan');
        
        if (existingPlanMsgIndex !== -1) {
          const updated = [...prev];
          const existing = updated[existingPlanMsgIndex] as any;
          updated[existingPlanMsgIndex] = { 
            ...existing, 
            content: newMarkdown, 
            plan: { ...newPlan, _markdown: newMarkdown || newPlan._markdown } 
          };
          return updated;
        }

        const last = prev[prev.length - 1] as any;
        if (last && last.role === 'assistant') {
          const updated = [...prev];
          updated[updated.length - 1] = { ...last, content: newMarkdown, plan: { ...newPlan, _markdown: newMarkdown || newPlan._markdown } } as any;
          return updated;
        }
        
        // Only append if we really don't have a place to put it
        return [...prev, { id: 'assistant-plan', role: 'assistant', content: newMarkdown, plan: { ...newPlan, _markdown: newMarkdown || newPlan._markdown } } as any];
      });
    }
  }, [realtimeData, setMessages, setDesignPlan, setRealtimeStatus, setIsGenerating, setArtifacts, setThrottledArtifacts, projectId]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    const pollProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) return;
        const data = await res.json();
        // Update project metadata only.
        // Artifacts and Messages are handled by Real-time Events for the active session.
        setProject(data);
      } catch (err) {
        console.error("Polling error:", err);
      }
    };
    if (isGenerating) pollInterval = setInterval(pollProject, 10000); // 10s fallback sync
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [isGenerating, projectId, setProject]);

  useEffect(() => {
    resetProjectState();
    const fetchProjectAndInitialize = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error("Project not found");
        const data = await res.json();
        setProject(data);
        if (data.messages && data.messages.length > 0) setMessages(data.messages);
        if (data.canvasData) {
          if (data.canvasData.zoom) setZoom(data.canvasData.zoom);
          if (data.canvasData.canvasOffset) setCanvasOffset(data.canvasData.canvasOffset);
          if (data.canvasData.framePos) setFramePos(data.canvasData.framePos);
          if (data.screens) {
            const fetchedArtifacts = data.screens.map((s: any) => ({ 
              ...s, 
              isComplete: s.status === 'completed' 
            }));
            setArtifacts(fetchedArtifacts);
            setThrottledArtifacts(fetchedArtifacts);
          }
          if (data.canvasData.appliedTheme) {
            setAppliedTheme(data.canvasData.appliedTheme);
            setActiveThemeId(data.canvasData.appliedTheme.id);
          }
        } else {
          // New project or no canvas data: Reset to defaults
          setZoom(1);
          setCanvasOffset({ x: 0, y: 0 });
          setFramePos({ x: 0, y: 0 });
        }
        if (data.messages && data.messages.length > 0) {
          const lastAssistant = [...data.messages].reverse().find((m: any) => m.role === 'assistant');
          if (lastAssistant?.plan?.screens) {
            setDesignPlan({ screens: lastAssistant.plan.screens, _markdown: lastAssistant.plan._markdown });
            if (lastAssistant.status === 'generating') {
              setIsGenerating(true);
            }
          }
        }
        const pendingPromptRaw = sessionStorage.getItem(`pending_prompt_${projectId}`);
        if (pendingPromptRaw) {
          const { content, attachments: initialAttachments } = JSON.parse(pendingPromptRaw);
          sessionStorage.removeItem(`pending_prompt_${projectId}`);
          setIsGenerating(true);
          sendMessage({ text: content, files: initialAttachments.map((url: string) => ({ type: "file" as const, url, mediaType: "image/*" })) });
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
  }, [projectId, sendMessage, setMessages, router, setLoading, setProject, setZoom, setCanvasOffset, setFramePos, setArtifacts, setThrottledArtifacts, setAppliedTheme, setActiveThemeId, setDesignPlan, setIsGenerating]);

  useEffect(() => {
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').at(-1);
    if (!lastAssistantMessage) {
      if (messages.length === 0) {
        setArtifacts([]);
        setThrottledArtifacts([]);
      }
      return;
    }
    const textContent = (lastAssistantMessage as any).content;
    if (typeof textContent === 'string' && textContent.length > 0) {
      const artifactData = extractArtifacts(textContent);
      if (artifactData.length > 0) {
        const getNewX = (existingArtifacts: any[], newType: string) => {
          const lastArt = existingArtifacts[existingArtifacts.length - 1];
          const getWidth = (t: string) => t === 'app' ? 380 : t === 'web' ? 1024 : 800;
          return lastArt ? (lastArt.x || 0) + (lastArt.width || getWidth(lastArt.type)) + 120 : -(getWidth(newType) / 2);
        };
        setArtifacts(prev => {
          const updated = [...prev];
          let changed = false;
          artifactData.forEach(newArt => {
            const existingIndex = updated.findIndex(a => a.title === newArt.title);
            if (existingIndex >= 0) {
              if (updated[existingIndex].content !== newArt.content || updated[existingIndex].isComplete !== newArt.isComplete) {
                updated[existingIndex] = { ...updated[existingIndex], content: newArt.content, isComplete: newArt.isComplete };
                changed = true;
              }
            } else {
              updated.push({ ...newArt, x: getNewX(updated, newArt.type), y: 0 });
              changed = true;
            }
          });
          return changed ? updated : prev;
        });
        setThrottledArtifacts(prev => {
          const updated = [...prev];
          let changed = false;
          artifactData.forEach(newArt => {
            const existingIndex = updated.findIndex(a => a.title === newArt.title);
            if (existingIndex === -1) {
              updated.push({ ...newArt, content: "", x: getNewX(updated, newArt.type), y: 0, isComplete: false });
              changed = true;
            } else {
              if (status === 'streaming' && updated[existingIndex].isComplete) {
                updated[existingIndex] = { ...updated[existingIndex], isComplete: false };
                changed = true;
              }
              if (status === 'ready' && !updated[existingIndex].isComplete && newArt.isComplete) {
                updated[existingIndex] = { ...updated[existingIndex], content: newArt.content, isComplete: true };
                changed = true;
              }
            }
          });
          return changed ? updated : prev;
        });
      }
    }
  }, [messages, status, setArtifacts, setThrottledArtifacts]);

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
                if (Math.abs((prev[artifactTitle] || 0) - event.data.height) > 10) return { ...prev, [artifactTitle]: event.data.height };
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
            const art = artifacts[index];
            if (art?.id) setSelectedArtifactIds(new Set([art.id]));
            const doc = iframe.contentDocument;
            if (doc) {
              const el = doc.querySelector('.edit-selected-highlight') as HTMLElement;
              if (el) setSelectedEl(el);
            }
          }
        });
      }
      if (event.data.type === 'SELECTION_CLEARED') setSelectedEl(null);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setDynamicFrameHeights, setSelectedArtifactIds, setSelectedEl, artifacts]);

  const isEditMode = secondarySidebarMode === 'properties';
  useEffect(() => {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => iframe.contentWindow?.postMessage({ type: 'SET_EDIT_MODE', enabled: isEditMode }, '*'));
  }, [isEditMode, throttledArtifacts]);

  useEffect(() => {
    if (selectedEl === null) {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => iframe.contentWindow?.postMessage({ type: 'CLEAR_SELECTION' }, '*'));
    }
  }, [selectedEl]);

  const commitEdits = useCallback(async (screenId?: string) => {
    const targetId = screenId || Array.from(selectedArtifactIds)[0];
    const targetArtifact = artifacts.find(a => a.id === targetId);
    if (!targetArtifact || !targetId) return;
    
    const iframe = iframeRefs.current[targetArtifact.title];
    if (!iframe?.contentDocument) return;
    
    const cleanHtml = sanitizeDocumentHtml(iframe.contentDocument, targetArtifact.content);
    
    // Update local state immediately
    const updateFn = (prev: Artifact[]) => prev.map(a => a.id === targetId ? { ...a, content: cleanHtml } : a);
    setThrottledArtifacts(updateFn);
    setArtifacts(updateFn);

    // Persist to database
    try {
      const res = await fetch(`/api/screens/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: cleanHtml })
      });
      
      if (!res.ok) throw new Error("Failed to save changes");
      toast.success("Changes saved");
      setHasUnsavedChanges(true); 
    } catch (error) {
      console.error('Commit error:', error);
      toast.error("Failed to persist edits");
    }
  }, [selectedArtifactIds, artifacts, setThrottledArtifacts, setArtifacts, setHasUnsavedChanges]);

  const commitEditsRef = useRef(commitEdits);
  useEffect(() => { commitEditsRef.current = commitEdits; }, [commitEdits]);

  const applyTheme = useCallback((theme: any) => {
    setActiveThemeId(theme.id);
    setAppliedTheme(theme);
    toast.success(`Theme "${theme.name}" selected. Click Save to persist.`);
  }, [setActiveThemeId, setAppliedTheme]);

  const hoveredElRef = useRef<HTMLElement | null>(null);
  const selectedElRef = useRef<HTMLElement | null>(null);
  useEffect(() => { hoveredElRef.current = selectedEl; }, [selectedEl]);
  useEffect(() => { selectedElRef.current = selectedEl; }, [selectedEl]);

  useEffect(() => {
    const selectedId = Array.from(selectedArtifactIds)[0];
    const currentArtifact = throttledArtifacts.find(a => a.id === selectedId);
    if (!currentArtifact) return;
    const iframe = iframeRefs.current[currentArtifact.title];
    if (!iframe || !isEditMode) {
      setSelectedEl(null);
      return;
    }
    const doc = iframe.contentDocument;
    if (!doc || !doc.body) return;
    const handlePointerMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target === doc.body || target === doc.documentElement) return;
      if (hoveredElRef.current && hoveredElRef.current !== target && hoveredElRef.current !== selectedElRef.current) {
        hoveredElRef.current.classList.remove('edit-hover-highlight');
      }
      if (target !== selectedElRef.current) {
        target.classList.add('edit-hover-highlight');
        hoveredElRef.current = target;
      }
    };
    const handlePointerLeave = () => {
      if (hoveredElRef.current && hoveredElRef.current !== selectedElRef.current) {
        hoveredElRef.current.classList.remove('edit-hover-highlight');
      }
      hoveredElRef.current = null;
    };
    const handleClick = (e: MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      const target = e.target as HTMLElement;
      if (!target || target === doc.body || target === doc.documentElement) return;
      if (selectedElRef.current) selectedElRef.current.classList.remove('edit-selected-highlight');
      setSelectedEl(target);
      target.classList.add('edit-selected-highlight');
      target.classList.remove('edit-hover-highlight');
    };
    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target === doc.body) return;
      target.setAttribute("contenteditable", "true"); target.focus();
      const handleBlur = () => {
        target.removeAttribute("contenteditable"); 
        commitEditsRef.current(selectedId);
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
      if (hoveredElRef.current) hoveredElRef.current.classList.remove('edit-hover-highlight');
      if (selectedElRef.current) selectedElRef.current.classList.remove('edit-selected-highlight');
    };
  }, [isEditMode, selectedArtifactIds, throttledArtifacts, setSelectedEl]);

  const handleSave = useCallback(async (showToast = true) => {
    if (!project) return;
    setIsSaving(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          canvasData: { artifacts, framePos, zoom, canvasOffset, dynamicFrameHeights, artifactPreviewModes, appliedTheme }
        })
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error("Failed to save project");
    } finally {
      setIsSaving(false);
    }
  }, [project, projectId, messages, artifacts, framePos, zoom, canvasOffset, dynamicFrameHeights, artifactPreviewModes, appliedTheme, setIsSaving, setHasUnsavedChanges]);

  const debouncedSave = useCallback(() => {
    setHasUnsavedChanges(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => handleSave(false), 5000);
  }, [handleSave, setHasUnsavedChanges]);

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
      const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete project');
      toast.success("Project deleted");
      router.push("/");
    } catch (error) {
      console.error('Delete project error:', error);
      toast.error("Failed to delete project");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); debouncedSave(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debouncedSave]);

  useEffect(() => { if (!loading) debouncedSave(); }, [zoom, canvasOffset, framePos, artifacts, dynamicFrameHeights, artifactPreviewModes, appliedTheme, loading, debouncedSave]);


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    const fileList = Array.from(files);
    const newPlaceholders = fileList.map(file => ({ url: URL.createObjectURL(file), isUploading: true }));
    setAttachments(prev => [...prev || [], ...newPlaceholders]);
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]; const placeholderUrl = newPlaceholders[i].url;
      try {
        const sigRes = await fetch("/api/cloudinary-signature");
        const sigData = await sigRes.json();
        const formData = new FormData();
        formData.append("file", file); formData.append("api_key", sigData.apiKey);
        formData.append("timestamp", sigData.timestamp.toString()); formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder || "sketch-design-with-ai");
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/upload`, { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        setAttachments(prev => prev.map(attr => attr.url === placeholderUrl ? { url: uploadData.secure_url, isUploading: false } : attr));
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
        setAttachments(prev => prev.filter(attr => attr.url !== placeholderUrl));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments?.length === 0) return;
    
    const text = input.trim();
    setIsGenerating(true); 
    setDesignPlan({ screens: [] }); 
    setRealtimeStatus(null);
    
    sendMessage({ 
      text, 
      files: attachments?.map(a => ({ type: "file" as const, url: a.url, mediaType: "image/*" })),
    });
    setAttachments([]); setInput(""); setWebsiteUrl(null);
  };

  const handleArtifactAction = (action: 'more' | 'regenerate' | 'variations', artifact: Artifact) => {
    let prompt = "";
    if (action === 'more') prompt = `Analyze the project based on the "${artifact.title}" screen and architect additional screens (you decide how many, e.g., 2-3 or more) to complete the full user journey and application logic. Generate them now.`;
    else if (action === 'regenerate') { setRegenerateInstructions(""); setIsRegenerateDialogOpen(true); return; }
    else if (action === 'variations') prompt = `Generate 3 distinct layout variations of the "${artifact.title}" screen...`;
    if (prompt) { 
      setIsGenerating(true); 
      sendMessage({ text: prompt }, { body: { isSilent: false } }); 
    }
  };

  const handleRegenerateSubmit = async () => {
    const selectedId = Array.from(selectedArtifactIds)[0];
    const artifact = artifacts.find(a => a.id === selectedId);
    if (!artifact || !artifact.id) return;
    
    const instructions = regenerateInstructions.trim();
    setIsGenerating(true); 
    setRegeneratingArtifactIds(prev => new Set(prev).add(artifact.id!));
    toast.info(`Regenerating "${artifact.title}"...`);
    
    try {
      await axios.post('/api/regenerate', {
        projectId,
        screenId: artifact.id,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content || (m.parts as any[])?.find(p => p.type === 'text')?.text || ""
        })),
        instructions
      });
    } catch (err) {
      console.error('Regeneration error:', err);
      toast.error("Failed to start regeneration.");
      setIsGenerating(false);
      setRegeneratingArtifactIds(prev => {
        const next = new Set(prev);
        next.delete(artifact.id!);
        return next;
      });
    }

    setIsRegenerateDialogOpen(false); 
    setRegenerateInstructions("");
  };

  const deleteArtifact = (index: number) => {
    const updateFn = (prev: Artifact[]) => prev.filter((_, i) => i !== index);
    setThrottledArtifacts(updateFn); setArtifacts(updateFn);
    setSelectedArtifactIds(new Set()); toast.success("Screen removed");
  };

  const captureFrameImage = async (index: number): Promise<string | null> => {
    const artifact = throttledArtifacts[index];
    const iframe = iframeRefs.current[artifact?.title];
    if (!iframe?.contentDocument?.body) return null;
    try {
      if (iframe.contentDocument.fonts) await iframe.contentDocument.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 1000));
      const canvas = await html2canvas(iframe.contentDocument.body, { useCORS: true, allowTaint: true, scale: 2 });
      return canvas.toDataURL("image/png");
    } catch (error) { console.error("Capture error:", error); return null; }
  };

  const handleExportZip = async (index: number) => {
    const artifact = throttledArtifacts[index];
    const dataUrl = await captureFrameImage(index);
    const zip = new JSZip();
    zip.file("code.html", artifact.content);
    if (dataUrl) zip.file("screen.png", dataUrl.split(',')[1], { base64: true });
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.download = `${artifact.title.replace(/\s+/g, '_')}_Package.zip`;
    link.href = URL.createObjectURL(content); link.click();
  };

  const openCodeViewer = (index: number) => {
    const artifact = throttledArtifacts[index];
    setViewingCode(artifact.content); setViewingTitle(artifact.title); setIsCodeViewerOpen(true);
  };

  const handleFeedback = async (index: number, action: 'like' | 'dislike' | 'none') => {
    const artifact = artifacts[index];
    if (!artifact?.id) return;
    try {
      const res = await fetch(`/api/screens/${artifact.id}/feedback`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      if (!res.ok) throw new Error('Failed');
      const updated = await res.json();
      const updateFn = (prev: Artifact[]) => prev.map((a, i) => i === index ? { ...a, isLiked: updated.isLiked, isDisliked: updated.isDisliked } : a);
      setArtifacts(updateFn); setThrottledArtifacts(updateFn);
    } catch (error) { console.error(error); }
  };

  const session = authClient.useSession();

  if (loading || !project) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <span className="text-zinc-500 text-sm font-medium">Entering Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {isSidebarVisible && (
        <div className="relative w-[380px] flex-shrink-0 border-r">
          <ChatSidebar
            handleCustomSubmit={handleCustomSubmit}
            handleRetry={handleRetry}
            handleFileUpload={handleFileUpload}
            fileInputRef={fileInputRef}
            commitEdits={commitEdits}
            applyTheme={applyTheme}
            session={session}
            status={chatStatus}
            messages={messages}
            error={chatError}
          />
          <SecondarySidebar 
            commitEdits={commitEdits}
            applyTheme={applyTheme}
          />
        </div>
      )}

      <CanvasArea
        previewRef={previewRef}
        iframeRefs={iframeRefs}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        startResizing={startResizing}
        startDraggingFrame={startDraggingFrame}
        handleArtifactAction={handleArtifactAction}
        handleFeedback={handleFeedback}
        openCodeViewer={openCodeViewer}
        handleExportZip={handleExportZip}
        deleteArtifact={deleteArtifact}
        setIsExportSheetOpen={setIsExportSheetOpen}
        setExportArtifactIndex={setExportArtifactIndex}
      />

      <CodeViewerModal
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
        code={viewingCode}
        title={viewingTitle}
      />

      <ProjectDialogs
        handleRegenerateSubmit={handleRegenerateSubmit}
        updateProjectTitle={updateProjectTitle}
        handleDeleteProject={handleDeleteProject}
        handleExportZip={handleExportZip}
      />
    </div>
  );
}
