"use client";

import React, { RefObject } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  X,
  RotateCcw,
  ArrowRight,
  Menu,
  Palette,
  CopyPlus,
  LayoutGrid,
  Download,
  Files,
  Share2,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  Settings,
  Command,
  User,
} from "lucide-react";

import { GenerationStatus } from "./generation-status";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/logo";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  MessageContent,
  MessageResponse,
  MessageAttachment,
  MessageAttachments,
} from "@/components/ai-elements/message";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { stripArtifact } from "@/lib/artifact-renderer";
import { useProjectStore } from "@/hooks/use-project-store";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ChatSidebarProps {
  // Logic Handlers (passed from page.tsx)
  handleCustomSubmit: (e: React.FormEvent) => void;
  handleRetry: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  applyTheme: (theme: any) => void;
  session: any;
  status: string; // from useChat
  messages: any[]; // from useChat
  error: any; // from useChat
}

export function ChatSidebar({
  handleCustomSubmit,
  handleRetry,
  handleFileUpload: propHandleFileUpload, // Renamed to avoid conflict
  fileInputRef,
  applyTheme: _applyTheme,
  session,
  status,
  messages,
  error,
}: ChatSidebarProps) {
  const router = useRouter();
  const {
    secondarySidebarMode,
    setSecondarySidebarMode,
    project,
    input,
    setInput,
    attachments,
    isGenerating,
    realtimeStatus,
    setIsDeleteDialogOpen,
    setIsEditTitleDialogOpen,
    setEditingTitle,
    throttledArtifacts,
    is3xMode,
    setIs3xMode,
    setAttachments,
    selectedArtifactIds,
    setSelectedArtifactIds,
  } = useProjectStore();

  const { fetchCredits } = useWorkspaceStore();

  React.useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  React.useEffect(() => {
    // Small delay to ensure the DOM has updated (especially for iframes/shimmers)
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages, isGenerating, realtimeStatus]);

  if (!project) return null;

  return (
    <aside className="bg-card z-20 flex h-full w-full flex-col transition-all duration-300">
      <header className="bg-sidebar flex h-14 items-center justify-between border-b px-4 py-2 transition-all">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-card border-border text-foreground z-[1001] w-64 rounded-2xl p-1.5 shadow-2xl"
            >
              <DropdownMenuItem
                onClick={() => router.push("/")}
                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[13px]"
              >
                <LayoutGrid className="text-muted-foreground h-4 w-4" />
                Go to All Projects
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border/50 my-1.5" />

              <DropdownMenuItem
                onClick={() =>
                  document.dispatchEvent(new CustomEvent("DOWNLOAD_PROJECT"))
                }
                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[13px]"
              >
                <Download className="text-muted-foreground h-4 w-4" />
                Download Project
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  document.dispatchEvent(new CustomEvent("DUPLICATE_PROJECT"))
                }
                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[13px]"
              >
                <Files className="text-muted-foreground h-4 w-4" />
                Duplicate Project
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border/50 my-1.5" />

              <DropdownMenuItem
                onClick={() =>
                  useProjectStore.getState().setIsShareDialogOpen(true)
                }
                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[13px]"
              >
                <Share2 className="text-muted-foreground h-4 w-4" />
                Share Project
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border/50 my-1.5" />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[13px]">
                  <Pencil className="text-muted-foreground h-4 w-4" />
                  Edit
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-card border-border text-foreground z-[1005] w-48 rounded-2xl p-1.5 shadow-2xl">
                    <DropdownMenuItem className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[13px]">
                      <Undo2 className="text-muted-foreground h-4 w-4" />
                      Undo
                      <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[13px]">
                      <Redo2 className="text-muted-foreground h-4 w-4" />
                      Redo
                      <DropdownMenuShortcut>Ctrl+Y</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50 my-1.5" />
                    <DropdownMenuItem className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[13px]">
                      <Copy className="text-muted-foreground h-4 w-4" />
                      Copy
                      <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[13px]">
                      <ClipboardPaste className="text-muted-foreground h-4 w-4" />
                      Paste
                      <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[13px]"
              >
                <Settings className="text-muted-foreground h-4 w-4" />
                System Settings
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="hover:bg-destructive/10 text-destructive flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[13px]"
              >
                <Trash2 className="h-4 w-4" />
                Delete Project
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border/50 my-1.5" />

              <DropdownMenuItem
                onClick={() =>
                  useProjectStore.getState().setIsCommandMenuOpen(true)
                }
                className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-[13px]"
              >
                <div className="flex items-center gap-2">
                  <Command className="text-muted-foreground h-4 w-4" />
                  Command Menu
                </div>
                <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-foreground text-[15px] font-semibold tracking-tight">
            {project.title}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary h-8 w-8"
            onClick={() => {
              setEditingTitle(project.title);
              setIsEditTitleDialogOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <div className="bg-sidebar relative flex-1 overflow-hidden">
        <Conversation className="relative h-full">
          <ConversationContent className="scrollbar-hide p-0">
            <div className="flex min-h-full flex-col pb-8">
              {messages.length === 0 &&
              attachments.length === 0 &&
              !isGenerating ? (
                <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center p-8 text-center">
                  <div className="relative mb-6">
                    <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-2xl" />
                    <div className="bg-primary/10 border-primary/20 relative flex h-16 w-16 items-center justify-center rounded-2xl border">
                      <Sparkles className="text-primary size-8 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-foreground mb-2 text-xl font-black tracking-tight uppercase">
                    Initialize Workspace
                  </h3>
                  <p className="text-muted-foreground max-w-[240px] text-sm leading-relaxed">
                    Describe your vision to generate the first high-fidelity
                    prototype.
                  </p>
                </div>
              ) : (
                <div className="">
                  {messages
                    .filter((m: any) => !m.isSilent)
                    .filter((m, i, self) => {
                      const text = m.introductoryText || "";
                      const hasStable = self.some(
                        (other, j) =>
                          j !== i &&
                          other.role === "user" &&
                          !other.id.toString().startsWith("temp-") &&
                          (other.introductoryText === text ||
                            (other.parts &&
                              (other.parts as any[]).some(
                                (p) => p.type === "text" && p.text === text,
                              ))),
                      );
                      return !hasStable;
                    })
                    .map((message, idx) => {
                      const msg = message as any;
                      return (
                        <React.Fragment key={message.id}>
                          <div className="group transition-colors duration-300">
                            <div className="flex flex-col gap-4 px-5 py-6">
                              <div className="flex items-center gap-3">
                                {message.role === "user" ? (
                                  <Avatar className="h-8 w-8 shrink-0 border">
                                    <AvatarImage
                                      src={(session.data?.user as any)?.image}
                                      alt={session.data?.user?.name || "User"}
                                    />
                                    <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold">
                                      {session.data?.user?.name ? (
                                        session.data.user.name
                                          .split(" ")
                                          .map((n: string) => n[0])
                                          .join("")
                                          .toUpperCase()
                                      ) : (
                                        <User className="h-4 w-4" />
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="bg-primary/10 border-primary/20 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border">
                                    <LogoIcon className="text-primary h-4 w-4" />
                                  </div>
                                )}
                                <span className="text-foreground text-sm font-bold tracking-tight">
                                  {message.role === "user"
                                    ? session.data?.user?.name || "User"
                                    : "Sketch AI"}
                                </span>
                              </div>

                              <div className="min-w-0 flex-1">
                                <MessageContent className="text-foreground bg-transparent p-0 text-[15px] leading-relaxed">
                                  <div className="whitespace-pre-wrap">
                                    {message.role === "assistant" ? (
                                      (() => {
                                        const parts =
                                          (msg.parts as any[]) || [];
                                        const textPart =
                                          parts.find((p) => p.type === "text")
                                            ?.text || "";
                                        const images = parts.filter(
                                          (p) => p.type === "image",
                                        );
                                        const plan = msg.plan as any;

                                        const hasPlan = !!msg.plan;
                                        const isPending =
                                          msg.status === "pending";
                                        const isLastMessage =
                                          idx === messages.length - 1;
                                        const isComplete =
                                          msg.status === "completed" ||
                                          (!isGenerating && isLastMessage);

                                        // Use message-specific status if available, fallback to global if it's the last message
                                        const statuses =
                                          (useProjectStore.getState()
                                            .realtimeStatuses || {}) as any;
                                        const specificStatus =
                                          statuses[msg.id] ||
                                          (isLastMessage
                                            ? realtimeStatus
                                            : null);
                                        const planScreens = plan?.screens || [];
                                        const planScreenIds = (
                                          planScreens as any[]
                                        )
                                          .map((s) => s.id)
                                          .filter(Boolean);

                                        const messageArtifacts =
                                          throttledArtifacts.filter(
                                            (a) =>
                                              a.generationMessageId ===
                                                msg.id ||
                                              planScreenIds.includes(a.id),
                                          );

                                        const showStatus =
                                          hasPlan ||
                                          isPending ||
                                          (isLastMessage && isGenerating) ||
                                          (specificStatus && !isComplete);

                                        return (
                                          <div className="flex flex-col gap-5">
                                            {/* Main text content - only show at the top for chat (no plan) */}
                                            {!hasPlan && textPart && (
                                              <div className="text-foreground/90 text-[15px] leading-relaxed">
                                                <MessageResponse>
                                                  {stripArtifact(textPart)}
                                                </MessageResponse>
                                              </div>
                                            )}

                                            {/* Images in assistant chat */}
                                            {images.length > 0 && (
                                              <MessageAttachments>
                                                {images.map((p, imgIdx) => (
                                                  <MessageAttachment
                                                    key={imgIdx}
                                                    data={{
                                                      url: p.url,
                                                      mediaType:
                                                        p.mediaType ||
                                                        "image/png",
                                                      type: "file",
                                                    }}
                                                  />
                                                ))}
                                              </MessageAttachments>
                                            )}

                                            {showStatus && (
                                              <div className="flex flex-col gap-6">
                                                <GenerationStatus
                                                  isComplete={isComplete}
                                                  conclusionText={textPart} // Use textPart as the "summary"
                                                  status={
                                                    specificStatus?.status
                                                  }
                                                  planScreens={plan?.screens}
                                                  projectArtifacts={
                                                    messageArtifacts
                                                  }
                                                  currentScreenTitle={
                                                    specificStatus?.currentScreen
                                                  }
                                                  error={
                                                    specificStatus?.status ===
                                                    "error"
                                                      ? specificStatus?.message
                                                      : undefined
                                                  }
                                                  isCreditError={
                                                    specificStatus?.isCreditError
                                                  }
                                                />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()
                                    ) : (
                                      <div className="flex flex-col gap-4">
                                        <div className="text-foreground/90 text-[15px] leading-relaxed">
                                          <MessageResponse>
                                            {(msg.parts as any[])
                                              ?.filter((p) => p.type === "text")
                                              .map((p) => p.text)
                                              .join("\n\n")}
                                          </MessageResponse>
                                        </div>

                                        {/* Image Attachments */}
                                        {(() => {
                                          const parts =
                                            (msg.parts as any[]) || [];
                                          const images = parts.filter(
                                            (p) =>
                                              p.type === "image" ||
                                              p.type === "file",
                                          );

                                          if (images.length === 0) return null;

                                          return (
                                            <MessageAttachments>
                                              {images.map(
                                                (p: any, imgIdx: number) => (
                                                  <MessageAttachment
                                                    key={imgIdx}
                                                    data={{
                                                      url: p.url,
                                                      mediaType:
                                                        p.mediaType ||
                                                        "image/png",
                                                      type: "file",
                                                    }}
                                                  />
                                                ),
                                              )}
                                            </MessageAttachments>
                                          );
                                        })()}

                                        {/* Selected Screens Preview */}
                                        {(() => {
                                          const selectedScreens =
                                            msg.selectedScreens ||
                                            msg.plan?.selectedScreens;

                                          if (
                                            !selectedScreens ||
                                            selectedScreens.length === 0
                                          )
                                            return null;

                                          return (
                                            <div className="flex flex-col gap-3">
                                              {selectedScreens &&
                                                selectedScreens.length > 0 && (
                                                  <div className="flex flex-wrap gap-3">
                                                    {selectedScreens.map(
                                                      (
                                                        screen: any,
                                                        sIdx: number,
                                                      ) => (
                                                        <Tooltip
                                                          key={
                                                            screen.id || sIdx
                                                          }
                                                        >
                                                          <TooltipTrigger
                                                            asChild
                                                          >
                                                            <div className="border-border bg-muted/50 hover:border-primary/20 relative h-16 w-16 cursor-help overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md">
                                                              <div className="pointer-events-none absolute inset-0 h-[2000px] w-[1024px] origin-top-left scale-[calc(64/1024)] opacity-100">
                                                                <iframe
                                                                  title={`msg-history-preview-${screen.id || sIdx}`}
                                                                  className="h-full w-full border-none"
                                                                  srcDoc={`
                                                                  <!DOCTYPE html>
                                                                  <html>
                                                                    <head>
                                                                      <script src="https://cdn.tailwindcss.com"></script>
                                                                      <style>
                                                                        body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
                                                                        ::-webkit-scrollbar { display: none; }
                                                                      </style>
                                                                    </head>
                                                                    <body>${screen.content || ""}</body>
                                                                  </html>
                                                                `}
                                                                />
                                                              </div>
                                                              <div className="pointer-events-none absolute inset-0 bg-transparent" />
                                                            </div>
                                                          </TooltipTrigger>
                                                          <TooltipContent
                                                            side="top"
                                                            className="px-3 py-1.5 text-[11px] font-bold"
                                                          >
                                                            Reference:{" "}
                                                            {screen.title ||
                                                              "Untitled Screen"}
                                                          </TooltipContent>
                                                        </Tooltip>
                                                      ),
                                                    )}
                                                  </div>
                                                )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                </MessageContent>
                              </div>
                            </div>
                          </div>
                          {idx < messages.length - 1 && (
                            <div className="px-5">
                              <Separator className="bg-border/50" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}

                  {isGenerating &&
                    messages[messages.length - 1]?.role === "user" &&
                    !(messages[messages.length - 1] as any).isSilent && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-4 px-5 py-6 duration-500">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 border-primary/20 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border">
                            <LogoIcon className="text-primary h-4 w-4" />
                          </div>
                          <span className="text-foreground text-sm font-bold tracking-tight">
                            Sketch AI
                          </span>
                        </div>
                        <GenerationStatus
                          isComplete={false}
                          status={realtimeStatus?.status}
                          statusMessage={realtimeStatus?.message}
                          error={
                            realtimeStatus?.status === "error"
                              ? realtimeStatus?.message
                              : undefined
                          }
                          isCreditError={realtimeStatus?.isCreditError}
                        />
                      </div>
                    )}

                  {/* Suggested Reply at the absolute bottom */}
                  {(() => {
                    const lastAssistantWithPlan = [...messages]
                      .reverse()
                      .find((m) => (m as any).plan);
                    const plan = (lastAssistantWithPlan as any)?.plan;

                    // Show suggestion if not generating, or if it's the latest and we are silently regenerating
                    const isSilentRegen =
                      isGenerating &&
                      (messages[messages.length - 1] as any)?.isSilent;
                    const shouldShow = !isGenerating || isSilentRegen;

                    if (shouldShow && plan?.suggestion) {
                      return (
                        <div className="animate-in fade-in slide-in-from-top-2 flex flex-col gap-4 px-5 py-4 delay-300 duration-700">
                          <div className="flex items-center gap-3">
                            <div className="bg-border/50 h-[1px] flex-1" />
                            <span className="text-muted-foreground shrink-0 text-[10px] font-bold">
                              Suggested Reply
                            </span>
                          </div>

                          <button
                            onClick={() => setInput(plan.suggestion)}
                            className="group bg-background border-border hover:border-primary/30 hover:bg-muted/50 w-fit max-w-[240px] rounded-lg border px-3 py-1.5 text-left shadow-sm transition-all duration-200 hover:shadow-md"
                          >
                            <span className="text-muted-foreground group-hover:text-foreground text-[12px] font-medium transition-colors">
                              {plan.suggestion}
                            </span>
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {error && (
                    <div className="border-destructive/10 bg-destructive/5 animate-in fade-in slide-in-from-bottom-2 mx-4 my-2 flex justify-center rounded-2xl border-t p-6">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-destructive text-sm font-medium">
                          Message failed to send
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetry()}
                          disabled={false}
                          className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive gap-2 transition-all"
                        >
                          <RotateCcw className="size-3" />
                          Retry sending now
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ConversationContent>
        </Conversation>
      </div>

      <div className="bg-sidebar p-4">
        <div className="flex flex-col gap-3">
          <div className="bg-background border-input focus-within:ring-primary/20 group/input rounded-[16px] border p-4 shadow-sm transition-all focus-within:ring-1">
            {selectedArtifactIds.size > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-1 mb-5 flex flex-wrap gap-3 duration-300">
                {Array.from(selectedArtifactIds).map((id) => {
                  const art = throttledArtifacts.find((a) => a.id === id);
                  if (!art) return null;
                  return (
                    <Tooltip key={id}>
                      <TooltipTrigger asChild>
                        <div className="group border-border bg-muted/50 hover:border-primary/50 relative h-16 w-16 cursor-help overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md">
                          {/* Scaled Preview */}
                          <div className="pointer-events-none absolute inset-0 h-[2000px] w-[1024px] origin-top-left scale-[calc(64/1024)] opacity-100 transition-opacity">
                            <iframe
                              title={`mini-preview-input-${id}`}
                              className="h-full w-full border-none"
                              srcDoc={`
                                        <!DOCTYPE html>
                                        <html>
                                          <head>
                                            <script src="https://cdn.tailwindcss.com"></script>
                                            <style>
                                              body { margin: 0; padding: 0; overflow: hidden; background: transparent; height: auto; }
                                              ::-webkit-scrollbar { display: none; }
                                            </style>
                                          </head>
                                          <body>${art.content}</body>
                                        </html>
                                      `}
                            />
                          </div>

                          {/* Hover Selection Overlay */}
                          <div className="bg-primary/0 group-hover:bg-primary/5 absolute inset-0 transition-colors" />

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedArtifactIds((prev) => {
                                const next = new Set(prev);
                                next.delete(id);
                                return next;
                              });
                            }}
                            className="bg-background border-border text-foreground hover:bg-destructive hover:text-destructive-foreground absolute top-1 right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border opacity-0 shadow-sm transition-all group-hover:opacity-100"
                          >
                            <X className="size-3 flex-shrink-0" />
                          </button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="px-3 py-1.5 text-[11px] font-bold"
                      >
                        Reference: {art.title || "Untitled Screen"}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCustomSubmit(e);
                }
              }}
              placeholder="Describe your design"
              className="text-foreground placeholder:text-muted-foreground max-h-[200px] min-h-[56px] w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none"
            />

            {attachments.length > 0 && (
              <div className="mt-4 mb-3 flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="group border-border bg-muted relative size-12 flex-shrink-0 overflow-hidden rounded-lg border"
                  >
                    <Image
                      src={att.url}
                      alt={`attachment-${idx}`}
                      className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                      width={48}
                      height={48}
                      unoptimized
                    />
                    <button
                      onClick={() =>
                        setAttachments((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="hover:bg-destructive absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-md bg-black/50 text-white opacity-0 transition-all group-hover:opacity-100"
                    >
                      <X className="size-2.5" />
                    </button>
                    {att.isUploading && (
                      <div className="bg-background/40 absolute inset-0 flex items-center justify-center">
                        <div className="border-primary size-3 animate-spin rounded-full border-2 border-t-transparent" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="ghost"
                  size="icon"
                  disabled={false}
                  className="bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted/80 border-border/50 h-9 w-9 rounded-full border"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={propHandleFileUpload}
                />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIs3xMode(!is3xMode)}
                      className={cn(
                        "flex h-9 items-center gap-2 rounded-full border px-3 shadow-sm transition-all duration-200",
                        is3xMode
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <CopyPlus className="h-4 w-4" />
                      <span className="mt-0.5 text-[13px] font-bold tracking-tight">
                        3x
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Generate 3 variations</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() =>
                        setSecondarySidebarMode(
                          secondarySidebarMode === "theme" ? "none" : "theme",
                        )
                      }
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-9 w-9 rounded-full border shadow-sm transition-all duration-200",
                        secondarySidebarMode === "theme"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border-border/50",
                      )}
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Theme Settings</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex flex-col items-end gap-2.5">
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleCustomSubmit}
                        disabled={
                          status === "ready" &&
                          !input.trim() &&
                          attachments.length === 0
                        }
                        className={cn(
                          "h-9 w-9 rounded-full border p-0 shadow-md transition-all",
                          status === "ready" &&
                            !input.trim() &&
                            attachments.length === 0
                            ? "bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50"
                            : "bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 hover:shadow-lg active:scale-95",
                        )}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send Message</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground mt-3 text-center text-[12px] leading-relaxed font-medium">
            Sketch can make mistakes. Please check its work.
          </p>
        </div>
      </div>
    </aside>
  );
}
