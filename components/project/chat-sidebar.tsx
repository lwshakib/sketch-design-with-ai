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
  Lightbulb,
  Palette,
  CopyPlus,
  Link,
  Globe,
  ImageIcon
} from "lucide-react";
import { GenerationStatus } from "./generation-status";
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
    secondarySidebarMode,
    setSecondarySidebarMode,
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
    setEditingTitle,
    isSidebarVisible,
    throttledArtifacts,
    is3xMode,
    setIs3xMode,
    setWebsiteUrl,
    websiteUrl,
    setAttachments
  } = useProjectStore();

  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [urlTemp, setUrlTemp] = React.useState("");

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlTemp.trim()) return;
    
    // Simple validation
    try {
      new URL(urlTemp);
      setWebsiteUrl(urlTemp.trim());
      setUrlTemp("");
      setShowUrlInput(false);
    } catch (e) {
      alert("Please enter a valid URL (e.g., https://google.com)");
    }
  };

  if (!project) return null;

  return (
    <aside className="w-full h-full flex flex-col bg-card z-20 transition-all duration-300">
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

                                          const hasPlan = !!msg.plan;
                                          const isLastMessage = idx === messages.length - 1;
                                          const isComplete = !isGenerating || !isLastMessage;
                                          const plan = msg.plan;
                                          
                                          // Show status if it has a plan OR if it's the latest and still generating
                                          const showStatus = hasPlan || (isLastMessage && isGenerating);

                                          return (
                                            <div className="flex flex-col gap-5">
                                              {!showStatus && (
                                                <div className="text-foreground/90 leading-relaxed text-[15px]">
                                                  <MessageResponse>{stripArtifact(textContent)}</MessageResponse>
                                                </div>
                                              )}
                                              
                                              {showStatus && (
                                                <div className="flex flex-col gap-6">
                                                  <GenerationStatus 
                                                    isComplete={isComplete}
                                                    conclusionText={plan?.conclusionText}
                                                    status={realtimeStatus?.status}
                                                    planScreens={plan?.screens}
                                                    projectArtifacts={throttledArtifacts}
                                                    currentScreenTitle={realtimeStatus?.currentScreen}
                                                  />

                                                  {isComplete && plan?.suggestion && (
                                                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-700 delay-300">
                                                      <div className="flex items-center gap-3">
                                                        <div className="h-[1px] flex-1 bg-border" />
                                                        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] shrink-0">Suggested Reply</span>
                                                      </div>
                                                      
                                                      <button 
                                                        onClick={() => setInput(plan.suggestion)}
                                                        className="group px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:bg-muted hover:border-primary/20 transition-all duration-200 text-left w-fit max-w-[240px] shadow-sm hover:shadow-md"
                                                      >
                                                        <span className="text-[12px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                                                          {plan.suggestion}
                                                        </span>
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
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

                      {isGenerating && !messages.some(m => m.role === 'assistant') && (
                        <div className="flex flex-col gap-4 px-5 py-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20 flex-shrink-0">
                              <LogoIcon className="h-4 w-4 text-primary"/>
                            </div>
                            <span className="text-sm font-bold text-foreground tracking-tight">Sketch AI</span>
                          </div>
                          <GenerationStatus 
                            isComplete={false}
                            status={realtimeStatus?.status}
                          />
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
            <div className="flex flex-col gap-3">
              <div className="bg-[#0F0F0F] rounded-[24px] p-4 border border-white/5 shadow-2xl transition-all focus-within:border-white/10">
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
                  placeholder="Describe your design"
                  className="w-full bg-transparent outline-none resize-none text-[15px] text-foreground placeholder:text-[#525252] min-h-[56px] max-h-[200px] leading-relaxed"
                />

                {(attachments.length > 0 || websiteUrl || showUrlInput) && (
                  <div className="flex flex-wrap gap-2 mb-3 mt-1">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="relative group size-12 rounded-lg overflow-hidden border border-white/10 bg-zinc-900 flex-shrink-0">
                        <img src={att.url} className="w-full h-full object-cover opacity-60" />
                        <button 
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 size-4 bg-black/60 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="size-2 text-white" />
                        </button>
                        {att.isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="size-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    ))}

                    {websiteUrl && !showUrlInput && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 max-w-[200px] group">
                        <Globe className="size-3 shrink-0" />
                        <span className="text-[11px] font-bold truncate">{websiteUrl}</span>
                        <button 
                          onClick={() => setWebsiteUrl(null)}
                          className="size-4 shrink-0 hover:bg-white/10 rounded flex items-center justify-center"
                        >
                          <X className="size-2" />
                        </button>
                      </div>
                    )}

                    {showUrlInput && (
                      <form onSubmit={handleUrlSubmit} className="flex-1 min-w-[200px] flex items-center gap-2 px-2 py-1.5 rounded-xl bg-[#1A1A1A] border border-white/10 animate-in fade-in zoom-in duration-200">
                        <Link className="size-3 text-zinc-500" />
                        <input 
                          autoFocus
                          value={urlTemp}
                          onChange={(e) => setUrlTemp(e.target.value)}
                          placeholder="Paste URL (e.g. google.com)"
                          className="flex-1 bg-transparent outline-none text-[11px] text-zinc-200 placeholder:text-zinc-600"
                        />
                        <button type="submit" className="hidden" />
                        <button 
                          type="button"
                          onClick={() => { setShowUrlInput(false); setUrlTemp(""); }}
                          className="size-4 shrink-0 hover:bg-white/10 rounded flex items-center justify-center"
                        >
                          <X className="size-2 text-zinc-500" />
                        </button>
                      </form>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={status !== 'ready'}
                          className="h-9 w-9 rounded-full bg-[#1A1A1A] text-zinc-400 hover:text-white hover:bg-[#252525] border border-white/5"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48 bg-[#0F0F0F] border-white/10 rounded-xl shadow-2xl p-1.5">
                        <DropdownMenuItem 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg text-zinc-300 transition-colors"
                        >
                          <ImageIcon className="h-4 w-4" />
                          <span className="text-[13px] font-medium">Upload Images</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setShowUrlInput(true)}
                          className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg text-zinc-300 transition-colors"
                        >
                          <Link className="h-4 w-4" />
                          <span className="text-[13px] font-medium">Website URL</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    
                    <button 
                      onClick={() => setIs3xMode(!is3xMode)}
                      className={cn(
                        "flex items-center gap-2 h-9 px-3 rounded-full border transition-all duration-200",
                        is3xMode 
                          ? "bg-primary/20 border-primary/30 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]" 
                          : "bg-[#1A1A1A] border-white/5 text-zinc-400 hover:text-white hover:bg-[#252525]"
                      )}
                    >
                      <CopyPlus className="h-4 w-4" />
                      <span className="text-[13px] font-bold tracking-tight mt-0.5">3x</span>
                    </button>

                    <Button 
                      onClick={() => setSecondarySidebarMode(secondarySidebarMode === 'theme' ? 'none' : 'theme')}
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "h-9 w-9 rounded-full bg-[#1A1A1A] text-zinc-400 hover:text-white hover:bg-[#252525] border border-white/5",
                        secondarySidebarMode === 'theme' && "bg-primary/20 text-primary border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                      )}
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={handleCustomSubmit}
                    disabled={status === 'ready' && (!input.trim() && attachments.length === 0)}
                    className={cn(
                      "h-9 w-9 rounded-full p-0 shadow-lg transition-all border border-white/5",
                      (status === 'streaming' || status === 'submitted') 
                        ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" 
                        : "bg-[#1A1A1A] text-zinc-400 hover:text-white hover:bg-[#252525]"
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
              <p className="text-[12px] text-center text-[#4F4F4F] font-medium leading-relaxed">
                Sketch can make mistakes. Please check its work.
              </p>
            </div>
          </div>
    </aside>
  );
}
