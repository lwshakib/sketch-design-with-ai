"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  Plus,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Search,
  MoreVertical,
  Smartphone,
  Monitor,
  CheckCircle2,
  Globe,
  X,
  Loader2,
  Edit2,
  Columns,
  Share2,
  Maximize2,
  Download,
  RotateCcw,
  MousePointer2,
  SearchIcon,
  Layout,
  MessageSquareIcon,
  Menu,
  Pencil,
  Hand,
  Image as ImageIcon,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DefaultChatTransport } from "ai";
import { extractArtifact, stripArtifact } from "@/lib/artifact-renderer";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageAttachments,
  MessageAttachment,
} from "@/components/ai-elements/message";

interface Project {
  id: string;
  title: string;
  messages: any[];
}



export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const previewRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<{ url: string; isUploading: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [currentArtifact, setCurrentArtifact] = useState<{ content: string, type: 'web' | 'app' | 'general' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'hand'>('select');
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [framePos, setFramePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingFrame, setIsDraggingFrame] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [dynamicFrameHeight, setDynamicFrameHeight] = useState<number>(800);

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        projectId,
      },
    }),
    onError: (error) => {
      console.error(error);
      toast.error("Failed to connect to design engine");
    },
    onFinish: (message) => {
      const textContent = (message.parts?.find((p: any) => p.type === 'text') as any)?.text || message.content;
      if (typeof textContent === 'string') {
        const artifactData = extractArtifact(textContent);
        if (artifactData) {
          setCurrentArtifact(artifactData);
        }
      }
    },
  });

  useEffect(() => {
    const fetchProjectAndInitialize = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error("Project not found");
        const data = await res.json();
        setProject(data);
        
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }

        const pendingPromptRaw = sessionStorage.getItem(`pending_prompt_${projectId}`);
        if (pendingPromptRaw) {
          const { content, attachments: initialAttachments } = JSON.parse(pendingPromptRaw);
          sessionStorage.removeItem(`pending_prompt_${projectId}`);
          
          sendMessage({
            text: content,
            files: initialAttachments.map((url: string) => ({ type: "file" as const, url, mediaType: "image/*" })),
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
  }, [projectId, sendMessage, setMessages, router]);

  useEffect(() => {
    const lastAssistantMessage = (messages as any[]).filter(m => m.role === 'assistant').at(-1);
    if (lastAssistantMessage) {
      const textContent = lastAssistantMessage.parts?.find((p: any) => p.type === 'text')?.text || lastAssistantMessage.content;
      if (typeof textContent === 'string') {
        const artifactData = extractArtifact(textContent);
        if (artifactData) {
          setCurrentArtifact(artifactData);
        }
      }
    }
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'hand') {
      setIsPanning(true);
      dragStart.current = { x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y };
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'HEIGHT_UPDATE' && typeof event.data.height === 'number') {
        setDynamicFrameHeight(event.data.height);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const getInjectedHTML = (html: string) => {
    const script = `
      <script>
        const sendHeight = () => {
          window.parent.postMessage({ type: 'HEIGHT_UPDATE', height: document.documentElement.scrollHeight }, '*');
        };
        window.onload = sendHeight;
        new ResizeObserver(sendHeight).observe(document.body);
      </script>
      <style>
        ::-webkit-scrollbar { display: none; }
        body { -ms-overflow-style: none; scrollbar-width: none; overflow-x: hidden; }
      </style>
    `;
    return html.replace('</body>', `${script}</body>`);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && activeTool === 'hand') {
      setCanvasOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    } else if (isDraggingFrame && activeTool === 'select') {
      setFramePos({
        x: (e.clientX - dragStart.current.x) / zoom,
        y: (e.clientY - dragStart.current.y) / zoom
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingFrame(false);
  };

  const startDraggingFrame = (e: React.MouseEvent) => {
    if (activeTool === 'select') {
      e.stopPropagation();
      setIsDraggingFrame(true);
      dragStart.current = { x: e.clientX - framePos.x * zoom, y: e.clientY - framePos.y * zoom };
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.min(Math.max(prev * delta, 0.1), 5));
    } else {
      setCanvasOffset(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    const newPlaceholders = fileList.map(file => ({
      url: URL.createObjectURL(file),
      isUploading: true
    }));
    
    setAttachments(prev => [...prev, ...newPlaceholders]);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const placeholderUrl = newPlaceholders[i].url;

      try {
        const sigRes = await fetch("/api/cloudinary-signature");
        const sigData = await sigRes.json();
        const uploadApi = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/upload`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", sigData.apiKey);
        formData.append("timestamp", sigData.timestamp.toString());
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder || "sketch-wireframe-to-design");

        const uploadRes = await fetch(uploadApi, { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        
        setAttachments(prev => prev.map(attr => 
          attr.url === placeholderUrl 
            ? { url: uploadData.secure_url, isUploading: false } 
            : attr
        ));
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
        setAttachments(prev => prev.filter(attr => attr.url !== placeholderUrl));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    
    sendMessage({
      text: input,
      files: attachments.map(a => ({ type: "file" as const, url: a.url, mediaType: "image/*" }))
    });
    
    setAttachments([]);
    setInput("");
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <span className="text-zinc-500 text-sm font-medium">Entering Workspace...</span>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      
      {/* Left Sidebar - Chat History */}
      <aside className="w-[380px] flex flex-col border-r bg-sidebar z-20">
        <header className="flex items-center justify-between px-4 py-2 h-14 border-b bg-sidebar">
           <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                <Menu className="h-5 w-5" />
              </Button>
              <span className="font-semibold text-[15px] text-foreground tracking-tight">{project.title}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white ml-2">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
           </div>
           <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
              <Columns className="h-4 w-4" />
           </Button>
        </header>

        <div className="flex-1 relative overflow-hidden bg-sidebar">
          <Conversation className="relative h-full">
            <ConversationContent className="p-4 gap-8 scrollbar-hide">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  title="Initialize Workspace"
                  description="Describe your vision to generate the first high-fidelity prototype."
                  icon={<MessageSquareIcon className="size-6 text-primary" />}
                />
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                       {message.role === 'user' ? (
                         <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                            <User className="h-4 w-4 text-zinc-400" />
                         </div>
                       ) : (
                         <div className="h-8 w-8 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20">
                            <Logo iconSize={14} showText={false} showBadge={false} />
                         </div>
                       )}
                       <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-zinc-100 uppercase tracking-wide">
                               {message.role === 'user' ? 'Professor' : 'Stitch'}
                            </span>
                            {message.role === 'assistant' && (
                              <div className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-full border shadow-sm">
                                <span className="text-[10px] font-medium text-muted-foreground">Thinking with 3 Pro</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2 pl-0">
                            <MessageContent className="p-0 bg-transparent text-foreground leading-relaxed text-[14px]">
                              {message.parts?.map((part: any, i: number) => {
                                if (part.type === 'text') {
                                  const textContent = typeof part.text === 'string' ? part.text : part.text?.text;
                                  if (!textContent) return null;
                                  return (
                                    <div key={i} className="whitespace-pre-wrap">
                                       {message.role === 'assistant' ? (
                                         <MessageResponse>{stripArtifact(textContent)}</MessageResponse>
                                       ) : (
                                         textContent
                                       )}
                                    </div>
                                  );
                                }
                                if (part.type === 'file') {
                                  const fileUrl = typeof part.file === 'string' ? part.file : part.file?.url;
                                  if (!fileUrl) return null;
                                  return (
                                    <div key={i} className="mt-3 rounded-xl overflow-hidden border border-zinc-800 shadow-xl max-w-[200px]">
                                       <img src={fileUrl} alt="Design Reference" className="w-full h-auto object-cover" />
                                    </div>
                                  );
                                }
                                return null;
                              })}
                              
                              {!message.parts && (
                                <div className="whitespace-pre-wrap">
                                   {message.role === 'assistant' ? (
                                     <MessageResponse>{stripArtifact((message as any).content)}</MessageResponse>
                                   ) : (
                                     (message as any).content
                                   )}
                                </div>
                              )}
                            </MessageContent>
                          </div>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </ConversationContent>
          </Conversation>
        </div>

        {/* Bottom Chat Input */}
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
                  placeholder="Describe your design"
                  className="w-full bg-transparent outline-none resize-none text-[14px] text-foreground placeholder:text-muted-foreground min-h-[40px] max-h-[200px]"
                />

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/50">
                  <div className="flex items-center gap-1.5">
                    <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800">
                      <Plus className="h-5 w-5" />
                    </Button>
                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800">
                      <div className="flex items-center justify-center font-bold text-[10px] bg-zinc-800 rounded px-1 min-w-[20px] h-5 border border-zinc-700">3x</div>
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" className="h-8 px-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 flex items-center gap-1.5 text-[11px] font-bold">
                      3.0 Pro <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                       onClick={handleCustomSubmit}
                       disabled={(!input.trim() && attachments.length === 0) || status === 'streaming'}
                       className="h-8 w-8 rounded-lg p-0 bg-white hover:bg-zinc-200 text-black shadow-lg"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
           </div>
           <p className="text-[10px] text-center mt-3 text-zinc-600 font-medium">
              Stitch can make mistakes. Please check its work.
           </p>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main 
        ref={previewRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={cn(
          "flex-1 flex flex-col bg-muted relative overflow-hidden",
          activeTool === 'hand' ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        )}
      >
         {/* Grid Background */}
         <div 
           className="absolute inset-0 pointer-events-none opacity-[0.03]"
           style={{
             backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
             backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
             transform: `translate(${canvasOffset.x % (20 * zoom)}px, ${canvasOffset.y % (20 * zoom)}px)`
           }}
         />

         {/* Preview Header */}
         <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-30 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
               <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {Math.round(zoom * 100)}%
                  </span>
               </div>
            </div>
            
            <div className="flex items-center gap-4 pointer-events-auto">
               <button className="flex items-center h-9 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[13px] font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all gap-2">
                 <Share2 className="h-4 w-4" />
                 Share
               </button>
               <UserMenu />
            </div>
         </header>

         {/* Content Layer */}
         <div 
           className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out select-none"
           style={{
             transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`
           }}
         >
            {currentArtifact ? (
               <div 
                 onMouseDown={startDraggingFrame}
                 className={cn(
                   "transition-shadow duration-300 ease-in-out shadow-[0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden border border-border/50 relative bg-white select-none",
                   activeTool === 'select' ? "cursor-move hover:border-primary/50" : "pointer-events-auto",
                   isDraggingFrame && "shadow-[0_60px_120px_rgba(0,0,0,0.5)] border-primary",
                   currentArtifact.type === 'app' 
                     ? "w-[375px] aspect-[9/19.5] rounded-[3rem] border-[12px] border-zinc-900" 
                     : currentArtifact.type === 'web'
                       ? "w-[1200px] rounded-sm"
                       : "w-[800px] aspect-square rounded-sm"
                 )}
                 style={{
                   transform: `translate(${framePos.x}px, ${framePos.y}px)`,
                   height: currentArtifact.type === 'web' ? `${dynamicFrameHeight}px` : undefined
                 }}
               >
                  {/* Phone Notch for App Design */}
                  {currentArtifact.type === 'app' && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-zinc-900 rounded-b-[1.5rem] z-50 flex items-center justify-center">
                      <div className="w-10 h-1 bg-zinc-800 rounded-full" />
                    </div>
                  )}
                  
                  <iframe 
                    srcDoc={getInjectedHTML(currentArtifact.content)}
                    className={cn(
                      "w-full h-full border-none bg-white",
                      isDraggingFrame || activeTool === 'hand' ? "pointer-events-none" : "pointer-events-auto"
                    )}
                    title="Design Preview"
                    sandbox="allow-scripts"
                  />
               </div>
            ) : (
               <div className="flex flex-col items-center gap-6 opacity-20 pointer-events-none">
                  <Logo iconSize={80} showText={false} />
                  <p className="text-xl font-medium tracking-tight">Generate your first design to see it here</p>
               </div>
            )}
         </div>

         {/* Bottom Floating Toolbar */}
         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 p-1.5 bg-card/90 backdrop-blur-xl rounded-2xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-1 z-30">
            <Button 
              onClick={() => setActiveTool('select')}
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-10 w-10 rounded-xl transition-all",
                activeTool === 'select' ? "bg-primary text-background shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
               <MousePointer2 className="h-5 w-5" />
            </Button>
            <Button 
              onClick={() => setActiveTool('hand')}
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-10 w-10 rounded-xl transition-all",
                activeTool === 'hand' ? "bg-primary text-background shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
               <Hand className="h-5 w-5" />
            </Button>
            <div className="w-[1px] h-6 bg-border mx-1" />
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted">
               <Search className="h-5 w-5" />
            </Button>
            <Button 
              onClick={() => {
                setCanvasOffset({ x: 0, y: 0 });
                setFramePos({ x: 0, y: 0 });
                setZoom(1);
              }}
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Reset View"
            >
               <RotateCcw className="h-5 w-5" />
            </Button>
         </div>
      </main>
    </div>
  );
}
