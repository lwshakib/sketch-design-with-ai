"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { uploadFileToS3 } from "@/lib/s3-client";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { fetchInngestToken } from "@/app/actions/inngest";
import { type Artifact } from "@/lib/types";
import { CanvasArea } from "@/components/project/canvas/canvas-area";
import { useCanvas } from "@/components/project/canvas/use-canvas";
import { sanitizeDocumentHtml } from "@/components/project/utils";
import JSZip from "jszip";
import html2canvas from "html2canvas";
import { authClient } from "@/lib/auth-client";
import { ShareDialog } from "@/components/project/share-dialog";
import { ProjectDialogs } from "@/components/project/project-dialogs";
import { CodeViewerModal } from "@/components/project/code-viewer-modal";
import { VariationsSheet } from "@/components/project/variations-sheet";
import { useProjectStore } from "@/hooks/use-project-store";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { useChat } from "@/hooks/use-chat";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const previewRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    project,
    setProject,
    loading,
    setLoading,
    artifacts,
    setArtifacts,
    throttledArtifacts,
    setThrottledArtifacts,
    attachments,
    setAttachments,
    input,
    setInput,
    zoom,
    setZoom,
    canvasOffset,
    setCanvasOffset,
    framePos,
    setFramePos,
    dynamicFrameHeights,
    setDynamicFrameHeights,
    artifactPreviewModes,
    setArtifactPreviewModes: _setArtifactPreviewModes,
    selectedArtifactIds,
    setSelectedArtifactIds,
    leftSidebarMode: _leftSidebarMode,
    setLeftSidebarMode: _setLeftSidebarMode,
    secondarySidebarMode,
    setSecondarySidebarMode: _setSecondarySidebarMode,

    selectedEl,
    setSelectedEl,
    isCodeViewerOpen,
    setIsCodeViewerOpen,
    isGenerating,
    setIsGenerating,
    viewingCode,
    setViewingCode,
    viewingTitle,
    setViewingTitle,
    isRegenerateDialogOpen: _isRegenerateDialogOpen,
    setIsRegenerateDialogOpen,
    regenerateInstructions,
    setRegenerateInstructions,
    isSaving: _isSaving,
    setIsSaving,
    hasUnsavedChanges: _hasUnsavedChanges,
    setHasUnsavedChanges,
    isEditTitleDialogOpen: _isEditTitleDialogOpen,
    setIsEditTitleDialogOpen,
    editingTitle: _editingTitle,
    setEditingTitle: _setEditingTitle,
    isDeleteDialogOpen: _isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isExportSheetOpen: _isExportSheetOpen,
    setIsExportSheetOpen,
    exportArtifactIndex: _exportArtifactIndex,
    setExportArtifactIndex,
    isSidebarVisible,
    setIsSidebarVisible: _setIsSidebarVisible,
    is3xMode: _is3xMode,
    hasCopied: _hasCopied,
    setHasCopied: _setHasCopied,
    designPlan,
    setDesignPlan,
    realtimeStatus: _realtimeStatus,
    setRealtimeStatus,
    setRealtimeStatuses,
    isPlanDialogOpen: _isPlanDialogOpen,
    setIsPlanDialogOpen: _setIsPlanDialogOpen,
    isPromptDialogOpen: _isPromptDialogOpen,
    setIsPromptDialogOpen: _setIsPromptDialogOpen,
    viewingPrompt: _viewingPrompt,
    setViewingPrompt: _setViewingPrompt,
    regeneratingArtifactIds: _regeneratingArtifactIds,
    setRegeneratingArtifactIds,
    messages,
    setMessages,
    updateState: _updateState,
    setActiveTool: _setActiveTool,
    setIsAgentLogOpen,
    resetProjectState,
    setIsVariationsSheetOpen,
    setVariationsArtifactIndex,
    setIsTalking,
    setSelectedTurnId,
    setIsTurnDetailVisible,
  } = useProjectStore();

  const { sendMessage, chatStatus, chatError } = useChat(projectId);


  const handlePersistArtifacts = async (indices: number[]) => {
    for (const index of indices) {
      const artifact = artifacts[index];
      if (!artifact || !artifact.id) continue;
      try {
        await fetch(`/api/screens/${artifact.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            x: artifact.x,
            y: artifact.y,
            width: artifact.width,
            height: artifact.height,
          }),
        });
      } catch (error) {
        console.error("Failed to persist frame:", error);
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
    previewRef,
  });


  const handleRetry = useCallback(() => {
    const { messages } = useProjectStore.getState();
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    if (lastUserMessage) {
      const textContent =
        (lastUserMessage as any).introductoryText ||
        (lastUserMessage.parts as any[])
          ?.filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("");

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
  useEffect(() => {
    designPlanRef.current = designPlan.screens;
  }, [designPlan.screens]);

  useEffect(() => {
    if (!realtimeData || realtimeData.length === 0) return;
    const newEvents = realtimeData.slice(processedCountRef.current);
    if (newEvents.length === 0) return;
    processedCountRef.current = realtimeData.length;

    newEvents.forEach((event: any) => {
      if (event.topic === "plan") {
        const { plan, markdown } = event.data;
        if (plan?.screens) {
          setDesignPlan({
            screens: plan.screens,
            _markdown: markdown || plan._markdown,
          });
        }
      } else if (event.topic === "status") {
        const eventMessageId = event.data.messageId;
        setRealtimeStatus(event.data);
        if (eventMessageId) {
          // If we have a stable messageId, check if we need to "claim" a pending message
          setMessages((prev) => {
            const hasStable = prev.some((m) => m.id === eventMessageId);
            if (hasStable) return prev;

            // Look for the first pending message or the default assistant-plan
            const pendingIndex = prev.findIndex(
              (m) =>
                m.role === "assistant" &&
                (m.id?.toString().startsWith("pending-") ||
                  m.id === "assistant-plan"),
            );
            if (pendingIndex !== -1) {
              const updated = [...prev];
              updated[pendingIndex] = {
                ...updated[pendingIndex],
                id: eventMessageId,
              };
              return updated;
            }
            return prev;
          });

          setRealtimeStatuses((prev) => ({
            ...prev,
            [eventMessageId]: event.data,
          }));
        }

        if (event.data.status === "vision" || event.data.status === "planning")
          setIsGenerating(true);
        if (event.data.status === "regenerating" && event.data.screenId) {
          setIsGenerating(true);
          setRegeneratingArtifactIds((prev) =>
            new Set(prev).add(event.data.screenId),
          );
        }
        if (event.data.status === "generating" && event.data.currentScreen) {
          setIsGenerating(true);
          const title = event.data.currentScreen;
          const screenId = event.data.screenId;
          const updateFn = (prev: Artifact[]) => {
            // Match by ID if available, otherwise fallback to title
            const existingIdx = prev.findIndex(
              (a) => (screenId && a.id === screenId) || a.title === title,
            );
            if (existingIdx !== -1) return prev;

            const planItem = designPlanRef.current.find(
              (p) => p.title === title,
            );
            const type = event.data.type || planItem?.type || "web";
            const getNewX = (existing: any[], scrType: string) => {
              const last = existing[existing.length - 1];
              const getWidth = (t: string) =>
                t === "app" ? 380 : t === "web" ? 1024 : 800;
              const currentWidth = getWidth(scrType);
              return last
                ? (last.x || 0) + (last.width || getWidth(last.type)) + 120
                : -(currentWidth / 2);
            };
            return [
              ...prev,
              {
                id: screenId,
                title,
                html: "",
                type: type as "web" | "app",
                isComplete: false,
                x: getNewX(prev, type),
                y: 0,
              },
            ];
          };
          setArtifacts(updateFn);
          setThrottledArtifacts(updateFn);
        }
        if (event.data.status === "error") {
          setIsGenerating(false);
          toast.error(
            event.data.message || "An error occurred during generation",
          );
        }

        if (event.data.status === "complete") {
          const eventMessageId = event.data.messageId;
          const finishedScreen = event.data.screen;
          
          setMessages((prev) => {
            const updated = [...prev];
            // Try to find by messageId first
            let targetIndex = eventMessageId
              ? updated.findIndex((m) => m.id === eventMessageId)
              : -1;

            // Fallback to last assistant message if not found
            if (targetIndex === -1) {
              const lastAssistantIndex = [...updated]
                .reverse()
                .findIndex((m) => m.role === "assistant");
              if (lastAssistantIndex !== -1) {
                targetIndex = updated.length - 1 - lastAssistantIndex;
              }
            }

            if (targetIndex !== -1) {
              (updated[targetIndex] as any).status = "completed";
            }

            // Check if any other assistant message is still generating
            const stillBusy = updated.some(
              (m) =>
                m.role === "assistant" &&
                (m as any).status !== "completed" &&
                ((m as any).plan || (m as any).status === "generating" || m.id?.toString().startsWith("pending-")),
            );
            setIsGenerating(stillBusy);

            return updated;
          });

          if (finishedScreen) {
             const updateFn = (prev: Artifact[]) => {
               const updated = [...prev];
               const idx = updated.findIndex((a) => a.id === finishedScreen.id || a.title === finishedScreen.title);
               if (idx >= 0) {
                 updated[idx] = {
                   ...updated[idx],
                   ...finishedScreen,
                   x: updated[idx].x, // Preserve placeholder X
                   y: updated[idx].y, // Preserve placeholder Y
                   isComplete: true,
                 };
                 setRegeneratingArtifactIds((prevRegen) => {
                   const next = new Set(prevRegen);
                   next.delete(finishedScreen.id);
                   return next;
                 });
               }
               return updated;
             };
             setArtifacts(updateFn);
             setThrottledArtifacts(updateFn);
          }

          if (event.data.isSilent) {
            toast.success("Screen updated successfully!");
            setRegeneratingArtifactIds(new Set()); // Clear all if silent complete
          } else {
            toast.success("Design generation complete!");
          }
        }
        if (event.data.status === "partial_complete" && event.data.screen) {
          setIsGenerating(true);
          const newScreen = event.data.screen;
          const updateFn = (prev: Artifact[]) => {
            const updated = [...prev];
            // Match by ID
            const idx = updated.findIndex((a) => a.id === newScreen.id);
            if (idx >= 0) {
              updated[idx] = {
                ...updated[idx],
                ...newScreen,
                x: updated[idx].x,
                y: updated[idx].y,
                isComplete: true,
              };
              if (newScreen.id) {
                setRegeneratingArtifactIds((prev) => {
                  const next = new Set(prev);
                  next.delete(newScreen.id);
                  return next;
                });
              }
            } else {
              // Fallback to title matching if ID didn't find it (unlikely with new system)
              const titleIdx = updated.findIndex((a) => a.title === newScreen.title);
              if (titleIdx >= 0) {
                updated[titleIdx] = {
                  ...updated[titleIdx],
                  ...newScreen,
                  x: updated[titleIdx].x,
                  y: updated[titleIdx].y,
                  isComplete: true,
                };
              } else {
                const getNewX = (existing: any[], type: string) => {
                  const last = existing[existing.length - 1];
                  const getWidth = (t: string) =>
                    t === "app" ? 380 : t === "web" ? 1024 : 800;
                  return last
                    ? (last.x || 0) + (last.width || getWidth(last.type)) + 120
                    : -(getWidth(type) / 2);
                };
                updated.push({
                  ...newScreen,
                  isComplete: true,
                  x: newScreen.x || getNewX(updated, newScreen.type),
                  y: newScreen.y || 0,
                });
              }
            }
            return updated;
          };
          setArtifacts(updateFn);
          setThrottledArtifacts(updateFn);
        }
      }
    });

    const planEvents = newEvents.filter((e: any) => e.topic === "plan");

    if (planEvents.length > 0) {
      setMessages((prev) => {
        const updated = [...prev];

        planEvents.forEach((planEvent: any) => {
          const {
            plan,
            markdown,
            messageId: eventMessageId,
            websiteUrls: _eventWebsiteUrls,
          } = planEvent.data;

          let targetIndex = eventMessageId
            ? updated.findIndex((m) => m.id === eventMessageId)
            : updated.findIndex((m) => m.id === "assistant-plan");

          // If not found, try to claim a pending message
          if (targetIndex === -1) {
            targetIndex = updated.findIndex(
              (m) =>
                m.role === "assistant" &&
                (m.id?.toString().startsWith("pending-") ||
                  m.id === "assistant-plan"),
            );
            if (targetIndex !== -1 && eventMessageId) {
              updated[targetIndex] = {
                ...updated[targetIndex],
                id: eventMessageId,
              };
            }
          }

          const updatedPlan = plan
            ? { ...plan, _markdown: markdown || plan._markdown }
            : null;


          if (targetIndex !== -1) {
            const existing = updated[targetIndex] as any;
            updated[targetIndex] = {
              ...existing,
              parts: plan?.conclusionText
                ? [{ type: "text", text: plan.conclusionText }]
                : markdown
                  ? [{ type: "text", text: markdown }]
                  : existing.parts,
              plan: updatedPlan || existing.plan,
            };
          } else {
            const last = updated[updated.length - 1] as any;
            if (
              last &&
              last.role === "assistant" &&
              (last.id === "assistant-plan" || !last.id)
            ) {
              updated[updated.length - 1] = {
                ...last,
                id: eventMessageId || last.id,
                parts: plan?.conclusionText
                  ? [{ type: "text", text: plan.conclusionText }]
                  : markdown
                    ? [{ type: "text", text: markdown }]
                    : last.parts,
                plan: updatedPlan || last.plan,
              } as any;
            } else {
              updated.push({
                id: eventMessageId || "assistant-plan",
                role: "assistant",
                parts: plan?.conclusionText
                  ? [{ type: "text", text: plan.conclusionText }]
                  : markdown
                    ? [{ type: "text", text: markdown }]
                    : [],
                plan: updatedPlan,
              } as any);
            }
          }
        });

        return updated;
      });
    }
  }, [
    realtimeData,
    setMessages,
    setDesignPlan,
    setRealtimeStatus,
    setRealtimeStatuses,
    setIsGenerating,
    setArtifacts,
    setThrottledArtifacts,
    projectId,
    setRegeneratingArtifactIds,
    setProject,
  ]);

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
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isGenerating, projectId, setProject]);

  useEffect(() => {
    resetProjectState();
    const fetchProjectAndInitialize = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error("Project not found");
        const data = await res.json();
        setProject(data);
        if (data.messages && data.messages.length > 0)
          setMessages(data.messages);
        if (data.canvasData) {
          if (data.canvasData.zoom) setZoom(data.canvasData.zoom);
          if (data.canvasData.canvasOffset)
            setCanvasOffset(data.canvasData.canvasOffset);
          if (data.canvasData.framePos) setFramePos(data.canvasData.framePos);
          if (data.screens) {
            const fetchedArtifacts = data.screens.map((s: any) => ({
              ...s,
              isComplete: s.status === "completed",
            }));
            setArtifacts(fetchedArtifacts);
            setThrottledArtifacts(fetchedArtifacts);
          }

        } else {
          // New project or no canvas data: Reset to defaults
          setZoom(1);
          setCanvasOffset({ x: 0, y: 0 });
          setFramePos({ x: 0, y: 0 });
        }
        if (data.messages && data.messages.length > 0) {
          const lastAssistant = [...data.messages]
            .reverse()
            .find((m: any) => m.role === "assistant");
          if (lastAssistant?.status === "generating") {
            setIsGenerating(true);
          }
        }


        const pendingPromptRaw = sessionStorage.getItem(
          `pending_prompt_${projectId}`,
        );
        if (pendingPromptRaw) {
          const { content, attachments: initialAttachments } =
            JSON.parse(pendingPromptRaw);
          sessionStorage.removeItem(`pending_prompt_${projectId}`);
          setIsGenerating(true);
          sendMessage({
            text: content,
            files: initialAttachments.map((path: string) => ({
              type: "file" as const,
              path,
              mediaType: "image/*",
            })),
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
  }, [
    projectId,
    sendMessage,
    setMessages,
    router,
    setLoading,
    setProject,
    setZoom,
    setCanvasOffset,
    setFramePos,
    setArtifacts,
    setThrottledArtifacts,
    setDesignPlan,
    setIsGenerating,
    resetProjectState, // Added missing dependency
  ]);

  // Removed redundant artifact extraction from assistant messages.

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data.type === "HEIGHT_UPDATE" &&
        typeof event.data.height === "number"
      ) {
        const sourceWindow = event.source as Window;
        const iframes = document.querySelectorAll("iframe");
        iframes.forEach((iframe) => {
          if (iframe.contentWindow === sourceWindow) {
            const artifactTitle = (iframe as any).dataset.artifactTitle;
            if (artifactTitle) {
              setDynamicFrameHeights((prev) => {
                if (
                  Math.abs((prev[artifactTitle] || 0) - event.data.height) > 10
                )
                  return { ...prev, [artifactTitle]: event.data.height };
                return prev;
              });
            }
          }
        });
      }
      if (event.data.type === "ELEMENT_CLICKED") {
        const sourceWindow = event.source as Window;
        const iframes = document.querySelectorAll("iframe");
        iframes.forEach((iframe, index) => {
          if (iframe.contentWindow === sourceWindow) {
            const art = artifacts[index];
            if (art?.id) setSelectedArtifactIds(new Set([art.id]));
            const doc = iframe.contentDocument;
            if (doc) {
              const el = doc.querySelector(
                ".edit-selected-highlight",
              ) as HTMLElement;
              if (el) setSelectedEl(el);
            }
          }
        });
      }
      if (event.data.type === "SELECTION_CLEARED") setSelectedEl(null);
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    setDynamicFrameHeights,
    setSelectedArtifactIds,
    setSelectedEl,
    artifacts,
  ]);

  const isEditMode = secondarySidebarMode === "properties";
  useEffect(() => {
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((iframe) =>
      iframe.contentWindow?.postMessage(
        { type: "SET_EDIT_MODE", enabled: isEditMode },
        "*",
      ),
    );
  }, [isEditMode, throttledArtifacts]);

  useEffect(() => {
    if (selectedEl === null) {
      const iframes = document.querySelectorAll("iframe");
      iframes.forEach((iframe) =>
        iframe.contentWindow?.postMessage({ type: "CLEAR_SELECTION" }, "*"),
      );
    }
  }, [selectedEl]);

  const commitEdits = useCallback(
    async (screenId?: string) => {
      const targetId = screenId || Array.from(selectedArtifactIds)[0];
      const targetArtifact = artifacts.find((a) => a.id === targetId);
      if (!targetArtifact || !targetId) return;

      const iframe = iframeRefs.current[targetArtifact.title];
      if (!iframe?.contentDocument) return;

      const cleanHtml = sanitizeDocumentHtml(
        iframe.contentDocument,
        targetArtifact.html,
      );

      // Update local state immediately
      const updateFn = (prev: Artifact[]) =>
        prev.map((a) => (a.id === targetId ? { ...a, html: cleanHtml } : a));
      setThrottledArtifacts(updateFn);
      setArtifacts(updateFn);

      // Persist to database
      try {
        const res = await fetch(`/api/screens/${targetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html: cleanHtml }),
        });

        if (!res.ok) throw new Error("Failed to save changes");
        toast.success("Changes saved");
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error("Commit error:", error);
        toast.error("Failed to persist edits");
      }
    },
    [
      selectedArtifactIds,
      artifacts,
      setThrottledArtifacts,
      setArtifacts,
      setHasUnsavedChanges,
    ],
  );

  const commitEditsRef = useRef(commitEdits);
  useEffect(() => {
    commitEditsRef.current = commitEdits;
  }, [commitEdits]);



  const hoveredElRef = useRef<HTMLElement | null>(null);
  const selectedElRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    hoveredElRef.current = selectedEl;
  }, [selectedEl]);
  useEffect(() => {
    selectedElRef.current = selectedEl;
  }, [selectedEl]);

  useEffect(() => {
    const selectedId = Array.from(selectedArtifactIds)[0];
    const currentArtifact = throttledArtifacts.find((a) => a.id === selectedId);
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
      if (!target || target === doc.body || target === doc.documentElement)
        return;
      if (
        hoveredElRef.current &&
        hoveredElRef.current !== target &&
        hoveredElRef.current !== selectedElRef.current
      ) {
        hoveredElRef.current.classList.remove("edit-hover-highlight");
      }
      if (target !== selectedElRef.current) {
        target.classList.add("edit-hover-highlight");
        hoveredElRef.current = target;
      }
    };
    const handlePointerLeave = () => {
      if (
        hoveredElRef.current &&
        hoveredElRef.current !== selectedElRef.current
      ) {
        hoveredElRef.current.classList.remove("edit-hover-highlight");
      }
      hoveredElRef.current = null;
    };
    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      if (!target || target === doc.body || target === doc.documentElement)
        return;
      if (selectedElRef.current)
        selectedElRef.current.classList.remove("edit-selected-highlight");
      setSelectedEl(target);
      target.classList.add("edit-selected-highlight");
      target.classList.remove("edit-hover-highlight");
    };
    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target === doc.body) return;
      target.setAttribute("contenteditable", "true");
      target.focus();
      const handleBlur = () => {
        target.removeAttribute("contenteditable");
        commitEditsRef.current(selectedId);
        target.removeEventListener("blur", handleBlur);
      };
      target.addEventListener("blur", handleBlur);
    };
    doc.body.addEventListener("pointermove", handlePointerMove, true);
    doc.body.addEventListener("pointerleave", handlePointerLeave, true);
    doc.body.addEventListener("click", handleClick, true);
    doc.body.addEventListener("dblclick", handleDoubleClick, true);
    return () => {
      doc.body.removeEventListener("pointermove", handlePointerMove, true);
      doc.body.removeEventListener("pointerleave", handlePointerLeave, true);
      doc.body.removeEventListener("click", handleClick, true);
      doc.body.removeEventListener("dblclick", handleDoubleClick, true);
      if (hoveredElRef.current)
        hoveredElRef.current.classList.remove("edit-hover-highlight");
      if (selectedElRef.current)
        selectedElRef.current.classList.remove("edit-selected-highlight");
    };
  }, [
    isEditMode,
    selectedArtifactIds,
    throttledArtifacts,
    setSelectedEl,
    iframeRefs,
  ]); // Added iframeRefs to dependencies

  const handleSave = useCallback(
    async (_showToast = true) => {
      if (!project) return;
      setIsSaving(true);
      try {
        await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            canvasData: {
              artifacts,
              framePos,
              zoom,
              canvasOffset,
              dynamicFrameHeights,
              artifactPreviewModes,
            },
          }),
        });
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Save error:", error);
        toast.error("Failed to save project");
      } finally {
        setIsSaving(false);
      }
    },
    [
      project,
      projectId,
      messages,
      artifacts,
      framePos,
      zoom,
      canvasOffset,
      dynamicFrameHeights,
      artifactPreviewModes,

      setIsSaving,
      setHasUnsavedChanges,
    ],
  );

  const debouncedSave = useCallback(() => {
    setHasUnsavedChanges(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => handleSave(false), 5000);
  }, [handleSave, setHasUnsavedChanges]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        debouncedSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [debouncedSave]);

  useEffect(() => {
    if (!loading) debouncedSave();
  }, [
    zoom,
    canvasOffset,
    framePos,
    artifacts,
    dynamicFrameHeights,
    artifactPreviewModes,

    loading,
    debouncedSave,
  ]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileList = Array.from(files);
    const newPlaceholders = fileList.map((file) => ({
      url: URL.createObjectURL(file),
      isUploading: true,
    }));
    setAttachments((prev) => [...(prev || []), ...newPlaceholders]);
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const placeholderUrl = newPlaceholders[i].url;
      try {
        const { path } = await uploadFileToS3(file);
        setAttachments((prev) =>
          prev.map((attr) =>
            attr.url === placeholderUrl
              ? { ...attr, path, isUploading: false }
              : attr,
          ),
        );
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
        setAttachments((prev) =>
          prev.filter((attr) => attr.url !== placeholderUrl),
        );
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments?.length === 0) return;


    const text = input.trim();
    setIsGenerating(true);

    sendMessage({
      text,
      files: attachments?.map((a) => ({
        type: "file" as const,
        path: a.path,
        url: a.url, // Keep preview URL
        mediaType: "image/*",
      })),
    });
    setAttachments([]);
    setInput("");
  };

  const handleArtifactAction = (
    action: "more" | "regenerate" | "variations",
    artifact: Artifact,
  ) => {

    let prompt = "";
    if (action === "more")
      prompt = `Analyze the project based on the "${artifact.title}" screen and architect additional screens (you decide how many, e.g., 2-3 or more) to complete the full user journey and application logic. Generate them now.`;
    else if (action === "regenerate") {
      setRegenerateInstructions("");
      setIsRegenerateDialogOpen(true);
      return;
    } else if (action === "variations") {
      const idx = throttledArtifacts.findIndex((a) => a.id === artifact.id);
      setVariationsArtifactIndex(idx);
      setIsVariationsSheetOpen(true);
      return;
    }
    if (prompt) {
      setIsGenerating(true);
      sendMessage({ text: prompt }, { body: { isSilent: false } });
    }
  };

  const handleRegenerateSubmit = async () => {

    const selectedId = Array.from(selectedArtifactIds)[0];
    const artifact = artifacts.find((a) => a.id === selectedId);
    if (!artifact || !artifact.id || isGenerating) return;

    const instructions = regenerateInstructions.trim();
    const content = `Regenerate the **${artifact.title}** screen. ${instructions ? `\n\n**Instructions:** ${instructions}` : ""}`;

    setIsGenerating(true);
    toast.info(`Regenerating "${artifact.title}"...`);

    try {
      await sendMessage(
        { text: content },
        { body: { screenId: artifact.id, instructions } },
      );
    } catch (err) {
      console.error("Regeneration error:", err);
      toast.error("Failed to start regeneration.");
      setIsGenerating(false);
    }

    setIsRegenerateDialogOpen(false);
    setRegenerateInstructions("");
  };

  const handleGenerateVariations = useCallback(async () => {
    const {
      variationsArtifactIndex,
      variationOptions,
      variationCreativeRange,
      variationCustomInstructions,
      variationAspects,
      throttledArtifacts,
    } = useProjectStore.getState();

    const artifact =
      variationsArtifactIndex !== null
        ? throttledArtifacts[variationsArtifactIndex]
        : null;
    if (!artifact || !artifact.id) return;

    const prompt = `Generate ${variationOptions} distinct variations of the "${artifact.title}" screen. 
Variation Focus: ${variationCreativeRange} (Targeting ${variationAspects.join(", ")}).
${variationCustomInstructions ? `\nInstructions: ${variationCustomInstructions}` : ""}
Reference the existing screen code provided in the context.`;

    setIsGenerating(true);
    setIsVariationsSheetOpen(false);

    sendMessage(
      { text: prompt },
      {
        body: {
          isVariations: true,
          originalScreenId: artifact.id,
          optionsCount: variationOptions,
          variationCreativeRange,
          variationCustomInstructions,
          variationAspects,
        },
      },
    );
  }, [sendMessage, setIsGenerating, setIsVariationsSheetOpen]);

  const deleteArtifact = (index: number) => {
    const updateFn = (prev: Artifact[]) => prev.filter((_, i) => i !== index);
    setThrottledArtifacts(updateFn);
    setArtifacts(updateFn);
    setSelectedArtifactIds(new Set());
    toast.success("Screen removed");
  };

  const captureFrameImage = useCallback(
    async (index: number): Promise<string | null> => {
      const artifact = throttledArtifacts[index];
      const iframe = iframeRefs.current[artifact?.title];
      if (!iframe?.contentDocument?.body) return null;
      try {
        if (iframe.contentDocument.fonts)
          await iframe.contentDocument.fonts.ready;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const canvas = await html2canvas(iframe.contentDocument.body, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
        });
        return canvas.toDataURL("image/png");
      } catch (error) {
        console.error("Capture error:", error);
        return null;
      }
    },
    [throttledArtifacts, iframeRefs],
  );

  const handleExportZip = async (index: number) => {
    const artifact = throttledArtifacts[index];
    const dataUrl = await captureFrameImage(index);
    const zip = new JSZip();
    zip.file("code.html", artifact.html);
    if (dataUrl)
      zip.file("screen.png", dataUrl.split(",")[1], { base64: true });
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.download = `${artifact.title.replace(/\s+/g, "_")}_Package.zip`;
    link.href = URL.createObjectURL(content);
    link.click();
  };

  const openCodeViewer = (index: number) => {
    const artifact = throttledArtifacts[index];
    setViewingCode(artifact.html);
    setViewingTitle(artifact.title);
    setIsCodeViewerOpen(true);
  };

  const handleFeedback = async (
    index: number,
    action: "like" | "dislike" | "none",
  ) => {
    const artifact = artifacts[index];
    if (!artifact?.id) return;
    try {
      const res = await fetch(`/api/screens/${artifact.id}/feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      const updateFn = (prev: Artifact[]) =>
        prev.map((a, i) =>
          i === index
            ? { ...a, isLiked: updated.isLiked, isDisliked: updated.isDisliked }
            : a,
        );
      setArtifacts(updateFn);
      setThrottledArtifacts(updateFn);
    } catch (error) {
      console.error(error);
    }
  };

  const session = authClient.useSession();

  const handleDownloadFullProject = useCallback(async () => {
    toast.promise(
      async () => {
        const zip = new JSZip();

        for (let i = 0; i < throttledArtifacts.length; i++) {
          const artifact = throttledArtifacts[i];
          const folderName = artifact.title.replace(/\s+/g, "_");
          const folder = zip.folder(folderName);
          if (folder) {
            folder.file("code.html", artifact.html);
            const dataUrl = await captureFrameImage(i);
            if (dataUrl) {
              folder.file("screen.png", dataUrl.split(",")[1], {
                base64: true,
              });
            }
          }
        }

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.download = `${project?.title.replace(/\s+/g, "_") || "Project"}_Full_Package.zip`;
        link.href = URL.createObjectURL(content);
        link.click();
      },
      {
        loading: "Preparing full project export...",
        success: "Full project processed",
        error: "Failed to download project",
      },
    );
  }, [throttledArtifacts, project?.title, captureFrameImage]);

  const handleDownloadFullProjectRef = useRef(handleDownloadFullProject);
  useEffect(() => {
    handleDownloadFullProjectRef.current = handleDownloadFullProject;
  }, [handleDownloadFullProject]);

  useEffect(() => {
    const handler = () => handleDownloadFullProjectRef.current();
    document.addEventListener("DOWNLOAD_PROJECT", handler);
    return () => document.removeEventListener("DOWNLOAD_PROJECT", handler);
  }, []);

  const handleDuplicateProject = useCallback(async () => {
    toast.promise(
      async () => {
        await axios.post(`/api/projects/${projectId}/duplicate`);
        // User explicitly requested to stay on the current project, so no redirect.
      },
      {
        loading: "Duplicating project...",
        success: "Project duplicated!",
        error: "Failed to duplicate project",
      },
    );
  }, [projectId]);

  const handleDuplicateProjectRef = useRef(handleDuplicateProject);
  useEffect(() => {
    handleDuplicateProjectRef.current = handleDuplicateProject;
  }, [handleDuplicateProject]);

  useEffect(() => {
    const handler = () => handleDuplicateProjectRef.current();
    document.addEventListener("DUPLICATE_PROJECT", handler);
    return () => document.removeEventListener("DUPLICATE_PROJECT", handler);
  }, []);

  const updateProjectTitle = async (title: string) => {
    try {
      await axios.patch(`/api/projects/${projectId}`, { title });
      setProject({ ...project!, title });
      setIsEditTitleDialogOpen(false);
      toast.success("Title updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update title");
    }
  };

  const confirmDeleteProject = async () => {
    toast.promise(
      async () => {
        await axios.delete(`/api/projects/${projectId}`);
        router.push("/");
      },
      {
        loading: "Deleting project...",
        success: "Project deleted",
        error: "Failed to delete project",
      },
    );
  };

  if (loading || !project) {
    return (
      <div className="bg-background flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <span className="text-sm font-medium text-zinc-500">
            Entering Workspace...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground flex h-screen w-full overflow-hidden font-sans">
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
        handleDownloadFullProject={handleDownloadFullProject}
        handleDuplicateProject={handleDuplicateProject}
        handleDeleteProject={() => setIsDeleteDialogOpen(true)}
        handleCustomSubmit={handleCustomSubmit}
        handleFileUpload={handleFileUpload}
        fileInputRef={fileInputRef}
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
        handleDeleteProject={confirmDeleteProject}
        handleExportZip={handleExportZip}
        handleDownloadFullProject={handleDownloadFullProject}
        handleDuplicateProject={handleDuplicateProject}
      />

      <ShareDialog />
      <VariationsSheet handleGenerateVariations={handleGenerateVariations} />
    </div>
  );
}
