"use client";

import React, { RefObject } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronLeft,
  Trash2,
  Pencil,
  Sparkles,
  User,
  X,
  RotateCcw,
  Square,
  ArrowRight,
  Menu,
} from "lucide-react";
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
} from "@/components/ai-elements/message";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ElementSettings } from "./element-settings";
import { ThemeSettings } from "./theme-settings";
import { extractArtifacts, stripArtifact } from "@/lib/artifact-renderer";
import { useProjectStore } from "@/hooks/use-project-store";

interface ChatSidebarProps {
  // Logic Handlers (passed from page.tsx)
  handleCustomSubmit: (e: React.FormEvent) => void;
  handleRetry: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  commitEdits: () => void;
  applyTheme: (theme: any) => void;
  session: any;
  status: string; // from useChat
  messages: any[]; // from useChat
  error: any; // from useChat
}

export function ChatSidebar({
  handleCustomSubmit,
  handleRetry,
  handleFileUpload,
  fileInputRef,
  commitEdits,
  applyTheme,
  session,
  status,
  messages,
  error
}: ChatSidebarProps) {
  const router = useRouter();
  const {
    leftSidebarMode,
    setLeftSidebarMode,
    project,
    input,
    setInput,
    attachments,
    isGenerating,
    realtimeStatus,
    activeThemeId,
    appliedTheme,
    selectedEl,
    setSelectedEl,
    setIsDeleteDialogOpen,
    setIsEditTitleDialogOpen,
    setEditingTitle
  } = useProjectStore();

  if (!project) return null;

  return (
    <aside className="w-[380px] flex flex-col border-r bg-card z-20 transition-all duration-300">
      {leftSidebarMode === 'properties' ? (
        <ElementSettings 
          selectedEl={selectedEl} 
          setSelectedEl={setSelectedEl}
          clearSelection={() => setSelectedEl(null)}
          onUpdate={commitEdits}
        />
      ) : leftSidebarMode === 'theme' ? (
        <ThemeSettings 
          activeThemeId={activeThemeId}
          onApplyTheme={applyTheme}
          appliedTheme={appliedTheme}
        />
      ) : (
        <>
          <header className="flex items-center justify-between px-4 py-2 h-14 border-b bg-sidebar transition-all">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => router.push('/')}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Go to all projects
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="font-semibold text-[15px] text-foreground tracking-tight">
                {project.title}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-primary"
                onClick={() => {
                  setEditingTitle(project.title);
                  setIsEditTitleDialogOpen(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          </header>

          <div className="flex-1 relative overflow-hidden bg-sidebar">
            <Conversation className="relative h-full">
              <ConversationContent className="p-0 scrollbar-hide">
                <div className="flex flex-col min-h-full pb-8">
                  {messages.length === 0 && attachments.length === 0 && !isGenerating ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                        <div className="relative h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Sparkles className="size-8 text-primary animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-foreground tracking-tight mb-2 uppercase">Initialize Workspace</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">
                        Describe your vision to generate the first high-fidelity prototype.
                      </p>
                    </div>
                  ) : (
                    <div className="">
                      {messages.map((message, idx) => {
                        const msg = message as any;
                        return (
                          <React.Fragment key={message.id}>
                            <div className="group transition-colors duration-300">
                              <div className="px-5 py-6 flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                  {message.role === 'user' ? (
                                    (session.data?.user as any)?.image ? (
                                      <img 
                                        src={(session.data?.user as any).image} 
                                        alt={session.data?.user?.name || 'User'}
                                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-zinc-900 border border-white/5 flex-shrink-0">
                                        <User className="h-4 w-4 text-zinc-400" />
                                      </div>
                                    )
                                  ) : (
                                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20 flex-shrink-0">
                                      <LogoIcon className="h-4 w-4 text-primary"/>
                                    </div>
                                  )}
                                  <span className="text-sm font-bold text-foreground tracking-tight">
                                    {message.role === 'user' ? (session.data?.user?.name || 'User') : 'Sketch AI'}
                                  </span>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <MessageContent className="p-0 bg-transparent text-foreground leading-relaxed text-[15px]">
                                    <div className="whitespace-pre-wrap">
                                      {message.role === 'assistant' ? (
                                        (() => {
                                          const textContent = msg.content || "";
                                          const isRawHtml = textContent.toLowerCase().includes('<!doctype') || textContent.toLowerCase().includes('<html');
                                          if (isRawHtml && extractArtifacts(textContent).length === 0) {
                                            return (
                                              <div className="flex flex-col gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl mt-2">
                                                <div className="flex items-center gap-2 text-destructive font-bold text-[10px] uppercase tracking-wide">
                                                  <X className="size-3" />
                                                  Error
                                                </div>
                                                <p className="text-destructive/80 text-sm leading-relaxed">Engine error occurred. Please try a different prompt.</p>
                                              </div>
                                            );
                                          }
                                          return (
                                            <div className="flex flex-col">
                                              <div className="text-foreground/90 leading-relaxed text-[15px]">
                                                <MessageResponse>{stripArtifact(textContent)}</MessageResponse>
                                              </div>
                                            </div>
                                          );
                                        })()
                                      ) : (
                                        <div className="text-foreground/90 leading-relaxed text-[15px]">
                                          {msg.content}
                                        </div>
                                      )}
                                    </div>
                                  </MessageContent>
                                </div>
                              </div>
                            </div>
                            {idx < messages.length - 1 && (
                              <div className="px-5">
                                <Separator className="bg-border" />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}

                      {isGenerating && (
                        <div className="flex gap-4 p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <div className="size-16 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden relative shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite_linear]" />
                            <style>{`
                              @keyframes shimmer {
                                0% { transform: translateX(-100%); }
                                100% { transform: translateX(100%); }
                              }
                            `}</style>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Sparkles className="size-6 text-primary animate-pulse" />
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col justify-center gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">Sketch AI</span>
                            </div>
                            {realtimeStatus?.message ? (
                              <div className="space-y-3">
                                <p className="text-sm text-foreground/70 font-medium italic">
                                  {realtimeStatus.message.replace(/\s*\.*$/, '')}...
                                </p>
                                <div className="flex gap-1.5">
                                  <div className={cn("h-1 rounded-full transition-all duration-700", (realtimeStatus.status === 'vision' || realtimeStatus.status === 'planning') ? "w-12 bg-primary animate-pulse" : "w-12 bg-emerald-500")} />
                                  <div className={cn("h-1 rounded-full transition-all duration-700", realtimeStatus.status === 'planning' ? "w-12 bg-primary animate-pulse" : (realtimeStatus.status === 'generating' || realtimeStatus.status === 'partial_complete' || realtimeStatus.status === 'complete') ? "w-12 bg-emerald-500" : "w-2 bg-muted")} />
                                  <div className={cn("h-1 rounded-full transition-all duration-700", realtimeStatus.status === 'generating' ? "w-12 bg-primary animate-pulse" : realtimeStatus.status === 'complete' ? "w-12 bg-emerald-500" : "w-2 bg-muted")} />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="h-3 bg-white/5 rounded-full w-[80%] animate-pulse" />
                                <div className="h-3 bg-white/5 rounded-full w-[40%] animate-pulse" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {error && (
                        <div className="flex justify-center p-6 border-t border-destructive/10 bg-destructive/5 rounded-2xl mx-4 my-2 animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex flex-col items-center gap-3">
                            <p className="text-sm text-destructive font-medium">Message failed to send</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleRetry()}
                              className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive transition-all"
                            >
                              <RotateCcw className="size-3" />
                              Retry sending now
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ConversationContent>
            </Conversation>
          </div>

          <div className="p-4 bg-sidebar">
            <div className="relative">
              <div className="bg-muted/50 rounded-2xl p-4 border border-border shadow-2xl transition-all focus-within:border-primary/50">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCustomSubmit(e);
                    }
                  }}
                  readOnly={status !== 'ready'}
                  placeholder={status === 'ready' ? "Describe your design" : "Processing vision..."}
                  className="w-full bg-transparent outline-none resize-none text-[14px] text-foreground placeholder:text-muted-foreground min-h-[40px] max-h-[200px]"
                />

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/50">
                  <div className="flex items-center gap-1.5">
                    <Button 
                      onClick={() => fileInputRef.current?.click()} 
                      variant="ghost" 
                      size="icon" 
                      disabled={status !== 'ready'}
                      className="h-8 w-8 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={handleCustomSubmit}
                      disabled={status === 'ready' && (!input.trim() && attachments.length === 0)}
                      className={cn(
                        "h-8 w-8 rounded-lg p-0 shadow-lg transition-all",
                        (status === 'streaming' || status === 'submitted') 
                          ? "bg-red-500 hover:bg-red-600 text-white" 
                          : "bg-white hover:bg-zinc-200 text-black"
                      )}
                    >
                      {(status === 'streaming' || status === 'submitted') ? (
                        <Square className="h-3 w-3 fill-current" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-center mt-3 text-zinc-600 font-medium tracking-wide uppercase">
              Sketch can make mistakes. Please check its work.
            </p>
          </div>
        </>
      )}
    </aside>
  );
}
