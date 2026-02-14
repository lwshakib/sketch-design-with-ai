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
  ImageIcon,
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
  Zap,
  Search,
  MoreVertical,
  Smartphone,
  Monitor,
  Tablet,
  ArrowUp,
  Loader2,
  Paperclip,
  Send
} from "lucide-react";
import { uploadFileToCloudinary } from "@/lib/cloudinary-client";
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
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { extractArtifacts, stripArtifact } from "@/lib/artifact-renderer";
import { useProjectStore } from "@/hooks/use-project-store";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";

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
  handleFileUpload: propHandleFileUpload, // Renamed to avoid conflict
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
    setAttachments,
    selectedArtifactIds,
    setSelectedArtifactIds,
  } = useProjectStore();

  const { credits, fetchCredits } = useWorkspaceStore();

  React.useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [urlTemp, setUrlTemp] = React.useState("");
  const [isUrlValid, setIsUrlValid] = React.useState(true);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  React.useEffect(() => {
    // Small delay to ensure the DOM has updated (especially for iframes/shimmers)
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages, isGenerating, realtimeStatus]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlTemp.trim()) return;
    
    // Simple validation
    try {
      const urlToTest = urlTemp.startsWith('http') ? urlTemp : `https://${urlTemp}`;
      new URL(urlToTest);
      setWebsiteUrl(urlToTest.trim());
      setUrlTemp("");
      setShowUrlInput(false);
      setIsUrlValid(true);
    } catch (e) {
      setIsUrlValid(false);
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
                <DropdownMenuContent align="start" className="w-64 bg-card border-border text-foreground rounded-2xl shadow-2xl p-1.5 z-[1001]">
                  <DropdownMenuItem 
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer text-[13px]"
                  >
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                    Go to All Projects
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-border/50 my-1.5" />
                  
                  <DropdownMenuItem 
                    onClick={() => document.dispatchEvent(new CustomEvent('DOWNLOAD_PROJECT'))}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer text-[13px]"
                  >
                    <Download className="h-4 w-4 text-muted-foreground" />
                    Download Project
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => document.dispatchEvent(new CustomEvent('DUPLICATE_PROJECT'))}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer text-[13px]"
                  >
                    <Files className="h-4 w-4 text-muted-foreground" />
                    Duplicate Project
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/50 my-1.5" />

                  <DropdownMenuItem 
                    onClick={() => useProjectStore.getState().setIsShareDialogOpen(true)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer text-[13px]"
                  >
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    Share Project
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/50 my-1.5" />

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer text-[13px]">
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                      Edit
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="w-48 bg-card border-border text-foreground rounded-2xl shadow-2xl p-1.5 z-[1005]">
                        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer text-[13px]">
                          <Undo2 className="h-4 w-4 text-muted-foreground" />
                          Undo
                          <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer text-[13px]">
                          <Redo2 className="h-4 w-4 text-muted-foreground" />
                          Redo
                          <DropdownMenuShortcut>Ctrl+Y</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/50 my-1.5" />
                        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer text-[13px]">
                          <Copy className="h-4 w-4 text-muted-foreground" />
                          Copy
                          <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer text-[13px]">
                          <ClipboardPaste className="h-4 w-4 text-muted-foreground" />
                          Paste
                          <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuItem 
                    onClick={() => router.push('/settings')}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer text-[13px]"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    System Settings
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-destructive/10 text-destructive cursor-pointer text-[13px]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/50 my-1.5" />

                  <DropdownMenuItem 
                    onClick={() => useProjectStore.getState().setIsCommandMenuOpen(true)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer text-[13px]"
                  >
                    <div className="flex items-center gap-2">
                      <Command className="h-4 w-4 text-muted-foreground" />
                      Command Menu
                    </div>
                    <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
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
                      {messages
                        .filter((m: any) => !m.isSilent)
                        .filter((m, i, self) => {
                          if (m.role !== 'user' || !m.id.toString().startsWith('temp-')) return true;
                          // It's a temp message. Check if a stable user message with same content exists.
                          const text = m.content || "";
                          const hasStable = self.some((other, j) => 
                            j !== i && 
                            other.role === 'user' && 
                            !other.id.toString().startsWith('temp-') && 
                            (other.content === text || (other.parts && (other.parts as any[]).some(p => p.type === 'text' && p.text === text)))
                          );
                          return !hasStable;
                        })
                        .map((message, idx) => {
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
                                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted border border-border flex-shrink-0">
                                        <User className="h-4 w-4 text-muted-foreground" />
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
                                          const textContent = msg.content || (msg.parts ? (msg.parts as any[]).filter(p => p.type === 'text').map(p => p.text).join('') : "");
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
                                          const isPending = msg.status === 'pending';
                                          const isLastMessage = idx === messages.length - 1;
                                          const isComplete = msg.status === 'completed' || (!isGenerating && isLastMessage);

                                          // Use message-specific status if available, fallback to global if it's the last message
                                          const statuses = (useProjectStore.getState().realtimeStatuses || {}) as any;
                                          const specificStatus = statuses[msg.id] || (isLastMessage ? realtimeStatus : null);
                                          const plan = msg.plan;
                                          const planScreens = plan?.screens || [];
                                          const planScreenIds = (planScreens as any[]).map(s => s.id).filter(Boolean);
                                          
                                          // Only show artifacts generated for this specific message in the generation status grid
                                          // We match by generationMessageId OR if the artifact's ID is in the message's plan
                                          const messageArtifacts = throttledArtifacts.filter(a => 
                                            a.generationMessageId === msg.id || planScreenIds.includes(a.id)
                                          );

                                          // Show status if it has a plan OR if it's pending OR if it's the latest and still generating
                                          const showStatus = hasPlan || isPending || (isLastMessage && isGenerating) || (specificStatus && !isComplete);

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
                                                    status={specificStatus?.status}
                                                    planScreens={plan?.screens}
                                                    projectArtifacts={messageArtifacts}
                                                    currentScreenTitle={specificStatus?.currentScreen}
                                                    error={specificStatus?.status === 'error' ? specificStatus?.message : undefined}
                                                    isCreditError={specificStatus?.isCreditError}
                                                  />

                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()
                                      ) : (
                                          <div className="flex flex-col gap-4">
                                            <div className="text-foreground/90 leading-relaxed text-[15px]">
                                              <MessageResponse>
                                                {msg.content || (msg.parts ? (msg.parts as any[]).filter(p => p.type === 'text').map(p => p.text).join('') : "")}
                                              </MessageResponse>
                                            </div>

                                            {/* Image Attachments */}
                                            {(() => {
                                              const images = msg.imageUrls || 
                                                (msg.parts ? (msg.parts as any[]).filter(p => p.type === 'image' || p.type === 'file').map(p => p.url) : []);
                                              
                                              if (!images || images.length === 0) return null;
                                              
                                              return (
                                                <MessageAttachments>
                                                  {images.map((url: string, imgIdx: number) => (
                                                    <MessageAttachment 
                                                      key={imgIdx}
                                                      data={{ url, mediaType: 'image/png', type: 'file' }} // Simple fallback mediaType
                                                    />
                                                  ))}
                                                </MessageAttachments>
                                              );
                                            })()}
                                          
                                          {/* Selected Screens Preview */}
                                          {(() => {
                                            const selectedScreens = msg.selectedScreens || msg.plan?.selectedScreens;
                                            const websiteUrl = msg.websiteUrl || msg.plan?.websiteUrl;
                                            
                                            if ((!selectedScreens || selectedScreens.length === 0) && !websiteUrl) return null;
                                            
                                            return (
                                              <div className="flex flex-col gap-3">
                                                {websiteUrl && (
                                                   <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 text-primary w-fit max-w-full">
                                                     <Globe className="size-3 shrink-0" />
                                                     <span className="text-[11px] font-bold truncate">{websiteUrl}</span>
                                                   </div>
                                                )}

                                                {selectedScreens && selectedScreens.length > 0 && (
                                                  <div className="flex flex-wrap gap-3">
                                                    {selectedScreens.map((screen: any, sIdx: number) => (
                                                      <div 
                                                        key={screen.id || sIdx} 
                                                        className="relative w-16 h-16 rounded-xl border border-border/60 bg-background overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-primary/20"
                                                      >
                                                        <div className="absolute inset-0 scale-[calc(64/1024)] origin-top-left w-[1024px] h-[2000px] pointer-events-none opacity-100">
                                                          <iframe 
                                                            title={`msg-history-preview-${screen.id || sIdx}`}
                                                            className="w-full h-full border-none"
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
                                                                <body>${screen.content || ''}</body>
                                                              </html>
                                                            `}
                                                          />
                                                        </div>
                                                        <div className="absolute inset-0 bg-transparent pointer-events-none" />
                                                      </div>
                                                    ))}
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

                      {isGenerating && messages[messages.length - 1]?.role === 'user' && !(messages[messages.length - 1] as any).isSilent && (
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
                            statusMessage={realtimeStatus?.message}
                            error={realtimeStatus?.status === 'error' ? realtimeStatus?.message : undefined}
                            isCreditError={realtimeStatus?.isCreditError}
                          />
                        </div>
                      )}

                      {/* Suggested Reply at the absolute bottom */}
                      {(() => {
                        const lastAssistantWithPlan = [...messages].reverse().find(m => (m as any).plan);
                        const plan = (lastAssistantWithPlan as any)?.plan;
                        
                        // Show suggestion if not generating, or if it's the latest and we are silently regenerating
                        const isSilentRegen = isGenerating && (messages[messages.length - 1] as any)?.isSilent;
                        const shouldShow = !isGenerating || isSilentRegen;
                        
                        if (shouldShow && plan?.suggestion) {
                          return (
                            <div className="px-5 py-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-700 delay-300">
                              <div className="flex items-center gap-3">
                                <div className="h-[1px] flex-1 bg-border/50" />
                                <span className="text-[10px] font-bold text-muted-foreground shrink-0">Suggested Reply</span>
                              </div>
                              
                              <button 
                                onClick={() => setInput(plan.suggestion)}
                                className="group px-3 py-1.5 rounded-lg bg-background border border-border hover:border-primary/30 hover:bg-muted/50 transition-all duration-200 text-left w-fit max-w-[240px] shadow-sm hover:shadow-md"
                              >
                                <span className="text-[12px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                  {plan.suggestion}
                                </span>
                              </button>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {error && (
                        <div className="flex justify-center p-6 border-t border-destructive/10 bg-destructive/5 rounded-2xl mx-4 my-2 animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex flex-col items-center gap-3">
                            <p className="text-sm text-destructive font-medium">Message failed to send</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleRetry()}
                              disabled={false}
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
                  <div ref={messagesEndRef} />
                </div>
              </ConversationContent>
            </Conversation>
          </div>

          <div className="p-4 bg-sidebar">
            <div className="flex flex-col gap-3">
              <div className="bg-background rounded-[16px] p-4 border border-input shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary/20 group/input">
                    {selectedArtifactIds.size > 0 && (
                      <div className="flex flex-wrap gap-3 mb-5 animate-in fade-in slide-in-from-bottom-1 duration-300">
                        {Array.from(selectedArtifactIds).map(id => {
                          const art = throttledArtifacts.find(a => a.id === id);
                          if (!art) return null;
                          return (
                            <div 
                              key={id} 
                              className="group relative w-16 h-16 rounded-xl border border-border bg-background overflow-hidden shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                            >
                              {/* Scaled Preview */}
                              <div className="absolute inset-0 scale-[calc(64/1024)] origin-top-left w-[1024px] h-[2000px] pointer-events-none opacity-100 transition-opacity">
                                <iframe 
                                  title={`mini-preview-input-${id}`}
                                  className="w-full h-full border-none"
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
                              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedArtifactIds(prev => {
                                    const next = new Set(prev);
                                    next.delete(id);
                                    return next;
                                  });
                                }}
                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-destructive-foreground shadow-sm z-10"
                              >
                                <X className="size-3 flex-shrink-0" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCustomSubmit(e);
                        }
                      }}
                      placeholder="Describe your design"
                      className="w-full bg-transparent outline-none resize-none text-[15px] text-foreground placeholder:text-muted-foreground min-h-[56px] max-h-[200px] leading-relaxed"
                    />

                {(attachments.length > 0 || websiteUrl || showUrlInput) && (
                  <div className="flex flex-wrap gap-2 mb-3 mt-4">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="relative group size-12 rounded-lg overflow-hidden border border-border bg-muted flex-shrink-0">
                        <img src={att.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <button 
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 size-4 bg-black/50 hover:bg-destructive text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="size-2.5" />
                        </button>
                        {att.isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                            <div className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    ))}

                    {websiteUrl && !showUrlInput && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 text-primary max-w-[200px] group">
                        <Globe className="size-3 shrink-0" />
                        <span className="text-[11px] font-bold truncate">{websiteUrl}</span>
                        <button 
                          onClick={() => setWebsiteUrl(null)}
                          className="size-4 shrink-0 hover:bg-primary/20 rounded-full flex items-center justify-center transition-colors"
                        >
                          <X className="size-2.5" />
                        </button>
                      </div>
                    )}

                    {showUrlInput && (
                      <form 
                        onSubmit={handleUrlSubmit} 
                        className={cn(
                          "flex-1 min-w-[200px] flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border transition-all duration-200 animate-in fade-in zoom-in",
                          isUrlValid ? "border-border focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/20" : "border-destructive/50 ring-1 ring-destructive/20"
                        )}
                      >
                        <Link className={cn("size-3", isUrlValid ? "text-muted-foreground" : "text-destructive")} />
                        <input 
                          autoFocus
                          value={urlTemp}
                          onChange={(e) => {
                            setUrlTemp(e.target.value);
                            if (!isUrlValid) setIsUrlValid(true);
                          }}
                          placeholder="Paste URL (e.g. google.com)"
                          className="flex-1 bg-transparent outline-none text-[11px] text-foreground placeholder:text-muted-foreground"
                        />
                        <button type="submit" className="hidden" />
                        <button 
                          type="button"
                          onClick={() => { setShowUrlInput(false); setUrlTemp(""); }}
                          className="size-4 shrink-0 hover:bg-background/20 rounded flex items-center justify-center"
                        >
                          <X className="size-2 text-muted-foreground" />
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
                          disabled={false}
                          className="h-9 w-9 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/50"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48 bg-popover border-border text-popover-foreground rounded-xl shadow-lg p-1.5">
                        <DropdownMenuItem 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                        >
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-[13px] font-medium">Upload Images</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setShowUrlInput(true)}
                          className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                        >
                          <Link className="h-4 w-4 text-muted-foreground" />
                          <span className="text-[13px] font-medium">Website URL</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                            "flex items-center gap-2 h-9 px-3 rounded-full border transition-all duration-200 shadow-sm",
                            is3xMode 
                              ? "bg-primary text-primary-foreground border-primary" 
                              : "bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <CopyPlus className="h-4 w-4" />
                          <span className="text-[13px] font-bold tracking-tight mt-0.5">3x</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Generate 3 variations</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={() => setSecondarySidebarMode(secondarySidebarMode === 'theme' ? 'none' : 'theme')}
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "h-9 w-9 rounded-full transition-all duration-200 border shadow-sm",
                            secondarySidebarMode === 'theme' 
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border-border/50"
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
                            disabled={(status === 'ready' && (!input.trim() && attachments.length === 0))}
                            className={cn(
                              "h-9 w-9 rounded-full p-0 shadow-md transition-all border",
                              (status === 'ready' && (!input.trim() && attachments.length === 0))
                                ? "bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50"
                                : "bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:scale-105 active:scale-95"
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
              <p className="text-[12px] text-center text-muted-foreground font-medium leading-relaxed">
                Sketch can make mistakes. Please check its work.
              </p>
            </div>
          </div>
    </aside>
  );
}
