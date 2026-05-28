import { useCallback } from "react";
import { useProjectStore } from "./use-project-store";
import { toast } from "sonner";
import { type Artifact } from "@/lib/types";

export const useChat = (projectId: string) => {
  const {
    messages,
    setMessages,
    isGenerating,
    setIsGenerating,
    setIsTalking,
    setIsAgentLogOpen,
    setSelectedTurnId,
    setIsTurnDetailVisible,
    is3xMode,
    selectedArtifactIds,
    throttledArtifacts,
  } = useProjectStore();

  const sendMessage = useCallback(
    async (params: { text: string; files?: any[] }, options?: any) => {
      // Access current state non-reactively to maintain a stable function reference
      const state = useProjectStore.getState();
      const {
        messages: currentMessages,
        is3xMode: currentIs3xMode,
        selectedArtifactIds: currentSelectedArtifactIds,
        throttledArtifacts: currentThrottledArtifacts,
      } = state;

      const isSilent = options?.body?.isSilent;

      // Inject context about selected screens if any
      let contextualText = params.text;
      const selectedScreens = Array.from(currentSelectedArtifactIds)
        .map((id) => currentThrottledArtifacts.find((a) => a.id === id))
        .filter((a): a is Artifact => !!a);

      if (selectedScreens.length > 0) {
        const screenTitles = selectedScreens
          .map((s) => `"${s.title}"`)
          .join(", ");
        contextualText = `[Context: User has selected the following screens: ${screenTitles}. Please refer to or modify these if applicable.]\n\n${params.text}`;
      }

      const imagePaths =
        params.files?.map((f: any) => f.path || f.url).filter(Boolean) || [];
      
      const newUserMessage = {
        id: `u-${Date.now()}`,
        role: "user" as const,
        parts: params.files?.length
          ? [
              { type: "text" as const, text: contextualText },
              ...params.files.map((f) => ({
                type: "image" as const,
                url: f.url,
                mediaType: f.mediaType || "image/png",
              })),
            ]
          : [{ type: "text" as const, text: contextualText }],
        selectedScreens: selectedScreens.map((s) => ({
          id: s.id,
          title: s.title,
          html: s.html,
        })),
        isSilent,
      };

      const assistantId = `pending-${newUserMessage.id}`;

      // Add messages to store
      if (!isSilent) {
        setMessages((prev) => {
          const assistantPlaceholder = {
            id: assistantId,
            role: "assistant" as const,
            visionText: "",
            parts: [],
            status: "pending" as any,
            isSilent: false,
          };
          return [...prev, newUserMessage, assistantPlaceholder];
        });
      } else {
        setMessages((prev) => [...prev, newUserMessage]);
      }

      setIsTalking(true);
      setIsAgentLogOpen(true);
      setSelectedTurnId(newUserMessage.id);
      setIsTurnDetailVisible(true);

      try {
        const messagesForApi = [...currentMessages, newUserMessage];
        const body = {
          projectId,
          messages: messagesForApi.map((m: any) => ({
            role: m.role,
            content:
              typeof m.content === "string"
                ? m.content
                : m.parts?.find((p: any) => p.type === "text")?.text || "",
          })),
          imagePaths,
          is3xMode: currentIs3xMode,
          ...options?.body,
        };

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error("Failed to connect to chat engine");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Stream not available");

        const decoder = new TextDecoder();
        let assistantContent = "";
        let reasoningContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line) continue;

            if (line.startsWith("0:")) {
              try {
                const text = JSON.parse(line.slice(2));
                assistantContent += text;
                setMessages((prev) => {
                  const updated = [...prev];
                  const idx = updated.findIndex((m) => m.id === assistantId);
                  if (idx !== -1) {
                    const currentParts = updated[idx].parts || [];
                    const filtered = currentParts.filter(
                      (p: any) => p.type !== "text",
                    );
                    updated[idx] = {
                      ...updated[idx],
                      parts: [...filtered, { type: "text", text: assistantContent }],
                      status: "streaming" as any,
                    };
                  }
                  return updated;
                });
              } catch (e) {
                /* skip */
              }
            } else if (line.startsWith("8:")) {
              try {
                const text = JSON.parse(line.slice(2));
                reasoningContent += text;
                setMessages((prev) => {
                  const updated = [...prev];
                  const idx = updated.findIndex((m) => m.id === assistantId);
                  if (idx !== -1) {
                    const currentParts = updated[idx].parts || [];
                    const filtered = currentParts.filter(
                      (p: any) => p.type !== "reasoning",
                    );
                    updated[idx] = {
                      ...updated[idx],
                      parts: [
                        { type: "reasoning", text: reasoningContent },
                        ...filtered,
                      ],
                      status: "streaming" as any,
                    };
                  }
                  return updated;
                });
              } catch (e) {
                /* skip */
              }
            } else if (line.startsWith("2:")) {
              try {
                const data = JSON.parse(line.slice(2));
                // Handle data parts (e.g., tool-result)
                if (data?.[0]?.type === "tool-result") {
                  const result = data[0];
                  if (result.messageId) {
                    setMessages((prev) => {
                      const updated = [...prev];
                      const idx = updated.findIndex((m) => m.id === assistantId);
                      if (idx !== -1) {
                        updated[idx] = { ...updated[idx], id: result.messageId };
                      }
                      return updated;
                    });
                  }
                } else if (data?.[0]?.type === "screen-created") {
                  const screen = data[0].screen;
                  const state = useProjectStore.getState();
                  state.setArtifacts((prev) => {
                    if (prev.some((a) => a.id === screen.id)) return prev;
                    return [...prev, screen];
                  });
                  state.setThrottledArtifacts((prev) => {
                    if (prev.some((a) => a.id === screen.id)) return prev;
                    return [...prev, screen];
                  });
                } else if (data?.[0]?.type === "screen-progress") {
                  const { screenId, html } = data[0];
                  const state = useProjectStore.getState();
                  state.setArtifacts((prev) =>
                    prev.map((a) => (a.id === screenId ? { ...a, html } : a))
                  );
                  state.setThrottledArtifacts((prev) =>
                    prev.map((a) => (a.id === screenId ? { ...a, html } : a))
                  );
                } else if (data?.[0]?.type === "theme-created") {
                  const theme = { ...data[0].theme, isActive: true, isComplete: true };
                  const state = useProjectStore.getState();
                  state.setArtifacts((prev) => {
                    const filtered = prev.map((a) =>
                      a.type === "theme" ? { ...a, isActive: false } : a
                    );
                    if (filtered.some((a) => a.id === theme.id)) {
                      return filtered.map((a) => a.id === theme.id ? theme : a);
                    }
                    return [...filtered, theme];
                  });
                  state.setThrottledArtifacts((prev) => {
                    const filtered = prev.map((a) =>
                      a.type === "theme" ? { ...a, isActive: false } : a
                    );
                    if (filtered.some((a) => a.id === theme.id)) {
                      return filtered.map((a) => a.id === theme.id ? theme : a);
                    }
                    return [...filtered, theme];
                  });
                } else if (data?.[0]?.type === "theme-progress") {
                  const { themeId, variables, title } = data[0];
                  const state = useProjectStore.getState();
                  state.setArtifacts((prev) =>
                    prev.map((a) => {
                      if (a.id === themeId) {
                        return { ...a, title, variables, isActive: true, isComplete: true };
                      }
                      if (a.type === "theme") {
                        return { ...a, isActive: false };
                      }
                      return a;
                    })
                  );
                  state.setThrottledArtifacts((prev) =>
                    prev.map((a) => {
                      if (a.id === themeId) {
                        return { ...a, title, variables, isActive: true, isComplete: true };
                      }
                      if (a.type === "theme") {
                        return { ...a, isActive: false };
                      }
                      return a;
                    })
                  );
                }
              } catch (e) {
                /* skip */
              }
            } else if (line.startsWith("3:")) {
              try {
                // Parse it just to consume the payload, but we won't show raw errors to the user
                JSON.parse(line.slice(2));
                toast.error("AI Engine Failed", {
                  description: "Internal server error. Please try again."
                });
                
                // Immediately set message status to error and stop generation
                setIsGenerating(false);
                setMessages((prev) => {
                  const updated = [...prev];
                  const idx = updated.findIndex((m) => m.id === assistantId);
                  if (idx !== -1) {
                    updated[idx] = { ...updated[idx], status: "error" as any };
                  }
                  return updated;
                });
              } catch (e) {
                /* skip */
              }
            }
          }
        }

        // Finalize assistant message
        setIsGenerating(false);
        setMessages((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((m) => m.id === assistantId);
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              status: "completed" as any,
            };
          }
          return updated;
        });

        // Fetch fresh project status to update the canvas artifacts synchronously
        try {
          const freshRes = await fetch(`/api/projects/${projectId}`);
          if (freshRes.ok) {
            const freshData = await freshRes.json();
            const state = useProjectStore.getState();
            state.setProject(freshData);
            if (freshData.artifacts) {
              const fetchedArtifacts = freshData.artifacts.map((s: any) => ({
                ...s,
                isComplete: s.status === "completed" || s.type === "theme",
              }));
              state.setArtifacts(fetchedArtifacts);
              state.setThrottledArtifacts(fetchedArtifacts);
            }
          }
        } catch (fetchErr) {
          console.error("Failed to sync project artifacts synchronously:", fetchErr);
        }

      } catch (err) {
        console.error("Chat error:", err);
        setIsGenerating(false);
        toast.error("Engine encountered an error.");
      } finally {
        setIsTalking(false);
      }
    },
    [
      projectId,
      setMessages,
      setIsGenerating,
      setIsTalking,
      setIsAgentLogOpen,
      setSelectedTurnId,
      setIsTurnDetailVisible,
    ]
  );

  return {
    sendMessage,
    messages,
    isGenerating,
    chatStatus: isGenerating ? "streaming" : "ready",
    chatError: null as string | null,
  };
};
