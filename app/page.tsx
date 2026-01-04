"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  ArrowRight,
  List,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/custom-sidebar";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const PROMPTS = {
  app: [
    "Quiz page in a language learning app with a progress bar at the top and four options.",
    "Fitness tracker dashboard with heart rate graph and daily step goal ring.",
    "Food delivery app home screen with categorized restaurant listings and deals.",
  ],
  web: [
    "Mobile-responsive ecommerce home page for a bird watching gear store.",
    "SaaS landing page with feature grid, pricing cards, and customer testimonials.",
    "Modern portfolio website for a 3D artist showcasing a gallery of work.",
  ]
};

const SECTIONS = [
  {
    title: "Today",
    items: [
      { id: "1", title: "Daily Check-In", type: "App", color: "bg-emerald-500/20 text-emerald-500" },
    ],
  },
  {
    title: "Last year",
    items: [
      { id: "2", title: "Edge Dashboard", type: "Desktop", color: "bg-blue-500/20 text-blue-500" },
      { id: "3", title: "Edge Deployment Platform Dashboard", type: "Desktop", color: "bg-blue-500/10 text-blue-400" },
      { id: "4", title: "Personal Portfolio for a Full-Stack Developer", type: "Desktop", color: "bg-orange-500/20 text-orange-500" },
    ],
  },
  {
    title: "Examples",
    items: [
      { id: "5", title: "Indoor Plant Care Dashboard", type: "Desktop", color: "bg-zinc-700/50 text-zinc-500" },
      { id: "6", title: "Alps skiing guide", type: "App", color: "bg-zinc-700/50 text-zinc-500" },
      { id: "7", title: "Ceramic & Pottery Marketplace", type: "App", color: "bg-zinc-700/50 text-zinc-500" },
      { id: "8", title: "Board game club planner", type: "App", color: "bg-zinc-700/50 text-zinc-500" },
      { id: "9", title: "Homemade Pizza Cooking Elite Class", type: "Desktop", color: "bg-zinc-700/50 text-zinc-500" },
      { id: "10", title: "Personal photo library", type: "Desktop", color: "bg-zinc-700/50 text-zinc-500" },
      { id: "11", title: "Employee Feedback Dashboard", type: "Desktop", color: "bg-zinc-700/50 text-zinc-500" },
    ],
  },
];

import { useRouter } from "next/navigation";

interface Attachment {
  url: string;
  isUploading: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'app' | 'web'>("app");
  const [inputValue, setInputValue] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onSubmit = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    if (attachments.some(a => a.isUploading)) {
      toast.error("Please wait for images to finish uploading");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: inputValue.slice(0, 30) || "Untitled Design",
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const project = await response.json();
      
      // Store initial prompt for the project page to pick up
      if (inputValue.trim() || attachments.length > 0) {
        sessionStorage.setItem(`pending_prompt_${project.id}`, JSON.stringify({
          content: inputValue,
          attachments: attachments.map(a => a.url)
        }));
      }

      router.push(`/project/${project.id}`);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    
    // Add temporary uploading placeholders
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
        if (!sigRes.ok) throw new Error("Failed to get upload signature");
        
        const sigData = await sigRes.json();
        const uploadApi = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/upload`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", sigData.apiKey);
        formData.append("timestamp", sigData.timestamp.toString());
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder || "sketch-wireframe-to-design");

        const uploadRes = await fetch(uploadApi, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Cloudinary upload failed");

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

  if (!isMounted) return null;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-500">
      <Sidebar />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 z-40 bg-transparent">
          <div className="flex items-center gap-4">
            <Logo textSize="1.6rem" />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground transition-colors">
              <MoreVertical className="h-5 w-5" />
            </Button>
            <UserMenu />
          </div>
        </header>

        {/* Mobile Page Header */}
        <div className="lg:hidden absolute top-20 right-6 z-50">
          <MobileMenu />
        </div>

        {/* Center Workspace */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto pb-20">
          <div className="w-full max-w-2xl space-y-12 mb-12">
            
            {/* Main Title Row */}
            <div className="flex items-center justify-center gap-4 flex-wrap text-center">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground whitespace-nowrap">
                Start a new
              </h1>
              
              {/* Custom Toggle */}
              <div className="bg-secondary p-1 rounded-xl flex items-center border border-border shadow-2xl transition-colors">
                <button
                  onClick={() => setActiveTab("app")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                    activeTab === "app" ? "bg-card text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground/80"
                  )}
                >
                  <Smartphone className="h-4 w-4" />
                  App
                </button>
                <button
                  onClick={() => setActiveTab("web")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                    activeTab === "web" ? "bg-card text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground/80"
                  )}
                >
                   <Monitor className="h-4 w-4" />
                  Web
                </button>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground whitespace-nowrap">
                design
              </h1>
            </div>

            {/* Premium Chat Input */}
            <div className="relative group w-full">
              {/* Outer Glow Overlay */}
              <div className={cn(
                "absolute -inset-[1px] rounded-[32px] opacity-0 group-focus-within:opacity-100 transition-all duration-700 blur-xl pointer-events-none",
                activeTab === 'app' ? "bg-purple-500/20" : "bg-blue-500/20"
              )} />
              
              <div className={cn(
                "relative bg-card rounded-[32px] p-8 space-y-4 border transition-all duration-500 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]",
                activeTab === 'app' 
                  ? "border-purple-500/10 group-focus-within:border-purple-500/40 group-focus-within:shadow-[0_0_40px_-5px_rgba(168,85,247,0.15)]" 
                  : "border-blue-500/10 group-focus-within:border-blue-500/40 group-focus-within:shadow-[0_0_40px_-5px_rgba(59,130,246,0.15)]"
              )}>
                
                {/* Image Previews */}
                <AnimatePresence>
                  {attachments.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-wrap gap-3 pb-2"
                    >
                      {attachments.map((attr, i) => (
                        <div key={i} className="relative group/img h-20 w-20 rounded-xl overflow-hidden border border-border bg-secondary shadow-sm">
                          <img src={attr.url} alt="Attachment" className={cn("h-full w-full object-cover", attr.isUploading && "opacity-40 blur-[2px]")} />
                          {attr.isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 text-white animate-spin" />
                            </div>
                          )}
                          <button 
                            onClick={() => removeAttachment(i)}
                            className="absolute top-1 right-1 h-5 w-5 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Describe your design"
                  className="w-full h-32 bg-transparent outline-none resize-none text-lg text-foreground placeholder:text-muted-foreground/50 font-medium leading-relaxed hide-scrollbar"
                />

                <div className="flex items-center justify-between">
                  {/* Hidden File Input */}
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 w-10 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/50"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                       onClick={onSubmit}
                       disabled={(!inputValue.trim() && attachments.length === 0) || attachments.some(a => a.isUploading) || isSubmitting}
                       className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-30 p-0 border border-border/10"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ArrowRight className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Try these prompts */}
            <div className="space-y-4">
               <h3 className="text-[11px] font-black text-muted-foreground ml-1 uppercase tracking-widest">Try these prompts</h3>
               <div className="flex flex-col gap-3">
                  {PROMPTS[activeTab].map((prompt: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputValue(prompt);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full p-4 rounded-xl bg-card border border-border text-left text-sm text-muted-foreground font-medium hover:bg-secondary hover:border-border transition-all leading-snug shadow-sm active:scale-[0.98]"
                    >
                      {prompt}
                    </button>
                  ))}
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div className="lg:hidden p-2 bg-secondary rounded-lg border border-border cursor-pointer hover:bg-secondary/80 transition-all shadow-lg">
          <List className="h-6 w-6 text-foreground" />
        </div>
      </DrawerTrigger>
      <DrawerContent className="bg-background border-border text-foreground max-h-[90vh]">
        <DrawerHeader className="px-6 py-5 flex flex-row items-center justify-between border-none">
          <DrawerTitle className="text-left font-black text-xl uppercase tracking-tighter">
            Design History
          </DrawerTitle>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full text-muted-foreground hover:text-foreground">
             <X className="h-5 w-5" />
          </Button>
        </DrawerHeader>

        {/* Search Bar matching Sidebar style */}
        <div className="p-6 pb-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <input
              type="text"
              placeholder="Search projects"
              className="w-full bg-secondary/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border transition-all font-medium"
            />
          </div>
        </div>

        <div className="px-4 py-8 space-y-8 overflow-y-auto">
          {SECTIONS.map((section) => (
             <div key={section.title} className="space-y-4">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">{section.title}</h4>
                <div className="space-y-2">
                   {section.items.map((item) => (
                      <button key={item.id} className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-secondary transition-all text-left group border border-transparent hover:border-border">
                        <div className={cn("h-12 w-12 shrink-0 rounded-xl flex items-center justify-center border border-border shadow-sm", item.color)}>
                            <div className="w-6 h-6 rounded bg-current opacity-20" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                           <span className="text-base font-bold text-foreground truncate">{item.title}</span>
                           <span className="text-xs font-black text-muted-foreground uppercase tracking-tight">{item.type}</span>
                        </div>
                      </button>
                   ))}
                </div>
             </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
