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

      const imageUrls =
        params.files?.map((f: any) => f.url).filter(Boolean) || [];
      
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
          imageUrls,
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
                    updated[idx] = {
                      ...updated[idx],
                      parts: [{ type: "text", text: assistantContent }],
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
                }
              } catch (e) {
                /* skip */
              }
            }
          }
        }

        // Finalize assistant message
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

      } catch (err) {
        console.error("Chat error:", err);
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
