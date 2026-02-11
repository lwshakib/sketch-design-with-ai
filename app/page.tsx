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
  Zap
} from "lucide-react";
import NumberFlow from "@number-flow/react";
import Link from "next/link";
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
    "Food delivery App UI home screen with categorized restaurant listings and deals.",
    "Fitness tracker App UI with heart rate graph and daily step goal ring.",
    "Language learning App UI quiz page with a progress bar and multiple choice options.",
    "E-commerce App UI product detail page with image gallery and 'Add to Cart' button.",
    "Social media App UI profile page with post grid, follower count, and bio.",
    "Banking App UI dashboard showing account balance, recent transactions, and quick pay.",
    "Travel booking App UI search results with flight filters and price comparisons.",
    "Music streaming App UI player screen with album art, playback controls, and playlist.",
    "Meditation App UI home screen with calming background, daily session, and mood tracker.",
    "Crypto wallet App UI with asset list, balance chart, and send/receive buttons.",
    "Weather App UI forecast screen with hourly temperature, wind speed, and humidity.",
    "Recipe App UI discovery page with high-quality food photography and difficulty filters.",
    "Task management App UI board view with draggable cards and priority labels.",
    "Real estate App UI map view showing property pins and price cards.",
    "Appointment booking App UI calendar for a hair salon or doctor's office.",
    "Expense tracker App UI with pie chart breakdown and budget progress.",
    "Dating App UI discovery screen with swipe cards and user interest tags.",
    "Smart home control App UI with toggle switches for lights and temperature.",
    "Podcast player App UI screen with episode description and speed controls.",
    "Online course App UI dashboard with lesson progress and certificate preview.",
    "Car rental App UI checkout screen with insurance options and price breakdown.",
    "Event ticket booking App UI with QR code and seat selection.",
    "Job search App UI listing page with salary filters and easy apply button.",
    "Pet adoption App UI profile for a dog including health stats and personality traits.",
    "Personal journal App UI writing screen with mood icons and photo attachments.",
    "Coffee shop loyalty App UI with point balance and reward tiers.",
    "Parking finder App UI map showing available spots and hourly rates.",
    "Inventory management App UI scanner for warehouse workers.",
    "Gamified habit tracker App UI with streak icons and level-up rewards.",
    "Public transport App UI route planner with bus/train arrival times.",
  ],
  web: [
    "Web design for a luxury furniture e-commerce store.",
    "SaaS landing page with feature grid, pricing cards, and customer testimonials.",
    "Modern portfolio website for a freelance developer showcasing project case studies.",
    "Corporate marketing website for a green energy startup with interactive infographics.",
    "Online magazine layout with featured articles, categories, and newsletter signup.",
    "Admin dashboard for an analytics platform with sidebar and data tables.",
    "Non-profit organization homepage with donation goals and upcoming events.",
    "Real estate landing page with large hero image and property search bar.",
    "B2B software pricing page with multi-tier plans and FAQ section.",
    "Luxury travel agency website with curated destination galleries.",
    "Tech blog home page with latest posts, trending topics, and social links.",
    "Online learning platform landing page with course categories and instructor bios.",
    "Health and wellness blog with wellness tips and a shop for organic products.",
    "Law firm website with practice area icons and attorney profiles.",
    "Creative agency showcase with full-screen video background and project grid.",
    "Restaurant website with menu sections and reservation button.",
    "Software documentation site with sidebar navigation and search.",
    "Community forum landing page with category list and active thread previews.",
    "Web app login and signup page with social auth and background illustration.",
    "Cloud storage dashboard with file grid, folder navigation, and upload status.",
    "Digital marketing agency landing page with service icons and client logos.",
    "Event conference website with speaker lineup, schedule, and ticket links.",
    "Photography portfolio with masonry grid and lightbox preview.",
    "E-learning student dashboard with course cards and upcoming assignments.",
    "Finance news portal with stock ticker and top headlines.",
    "Portfolio for a UI/UX designer with process steps and before/after shots.",
    "Modern barber shop website with service price list and booking link.",
    "Gaming news site with game reviews, trailers, and platform filters.",
    "Architect firm portfolio with high-res project photos and blueprints.",
    "Yoga studio website with class schedule and instructor introductions.",
  ]
};

// Helper to group projects by date
const groupProjectsByDate = (projects: any[]) => {
  const sections: { title: string; items: any[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayItems = projects.filter(p => new Date(p.updatedAt) >= today);
  const yesterdayItems = projects.filter(p => {
    const d = new Date(p.updatedAt);
    return d >= yesterday && d < today;
  });
  const olderItems = projects.filter(p => new Date(p.updatedAt) < yesterday);

  if (todayItems.length > 0) sections.push({ title: "Today", items: todayItems });
  if (yesterdayItems.length > 0) sections.push({ title: "Yesterday", items: yesterdayItems });
  if (olderItems.length > 0) sections.push({ title: "Previous", items: olderItems });

  return sections;
};

const ProjectSkeleton = () => (
  <div className="space-y-4">
    <div className="h-3 w-20 bg-secondary animate-pulse rounded ml-2" />
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex flex-col gap-1.5 p-3">
           <div className="h-4 w-full bg-secondary animate-pulse rounded" />
           <div className="h-3 w-1/3 bg-secondary animate-pulse rounded" />
        </div>
      ))}
    </div>
  </div>
);

import { useRouter } from "next/navigation";

interface Attachment {
  url: string;
  isUploading: boolean;
}

import { useWorkspaceStore } from "@/hooks/use-workspace-store";

export default function Home() {
  const { credits, fetchCredits } = useWorkspaceStore();
  const [inputValue, setInputValue] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const fetchProjects = async (isLoadMore = false) => {
    if (isLoadMore && (isLoadingMore || !hasMore)) return;
    
    if (isLoadMore) setIsLoadingMore(true);
    else setLoadingProjects(true);

    try {
      const skip = isLoadMore ? projects.length : 0;
      const res = await fetch(`/api/projects?limit=20&skip=${skip}`);
      if (res.ok) {
        const data = await res.json();
        
        if (data.length < 20) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        if (isLoadMore) {
          setProjects(prev => [...prev, ...data]);
        } else {
          setProjects(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      if (isLoadMore) setIsLoadingMore(false);
      else setLoadingProjects(false);
    }
  };

  const [shuffledPrompts, setShuffledPrompts] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
    fetchProjects();
    fetchCredits();
  }, []);

  useEffect(() => {
    if (isMounted) {
      const allPrompts = [...PROMPTS.app, ...PROMPTS.web];
      const shuffled = allPrompts
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      setShuffledPrompts(shuffled);
    }
  }, [isMounted]);

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
        formData.append("folder", sigData.folder || "sketch-design-with-ai");

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

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const sections = groupProjectsByDate(filteredProjects);

  if (!isMounted) return null;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-500">
      <Sidebar 
        sections={sections} 
        loading={loadingProjects} 
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        loadMore={() => fetchProjects(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 z-40 bg-transparent">
          <div className="flex items-center gap-4">
            <Logo textSize="1.6rem" />
          </div>

          <div className="flex items-center gap-4">
            <Link href="/settings" className="flex items-center px-4 py-2 rounded-2xl bg-zinc-900/40 border border-white/5 transition-all hover:bg-zinc-900/80 shadow-sm group">
              <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                <NumberFlow 
                  value={(credits || 0) / 1000} 
                  format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                />
                <span className="text-zinc-500">k credits remaining</span>
              </span>
            </Link>
            <UserMenu />
          </div>
        </header>

        {/* Mobile Page Header */}
        <div className="lg:hidden absolute top-20 right-6 z-50">
          <MobileMenu 
            sections={sections} 
            loading={loadingProjects}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            loadMore={() => fetchProjects(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>

        {/* Center Workspace */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto pb-20">
          <div className="w-full max-w-2xl space-y-12 mb-12 pt-10">
            
            {/* Main Title Row */}
            <div className="flex items-center justify-center gap-4 flex-wrap text-center">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground whitespace-nowrap uppercase italic translate-y-2">
                Start a new design
              </h1>
            </div>

            {/* Premium Chat Input */}
            <div className="relative group w-full">
              {/* Outer Glow Overlay */}
              <div className="absolute -inset-[1px] rounded-[32px] opacity-0 group-focus-within:opacity-100 transition-all duration-700 blur-xl pointer-events-none bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
              
              <div className="relative bg-card rounded-[32px] p-8 space-y-4 border border-white/5 transition-all duration-500 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] group-focus-within:border-primary/20 group-focus-within:shadow-[0_0_60px_-10px_rgba(var(--primary-rgb),0.2)]">
                
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
                  {shuffledPrompts.map((prompt: string, i: number) => (
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

interface MobileMenuProps {
  sections: any[];
  loading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

function MobileMenu({ 
  sections, 
  loading, 
  isLoadingMore,
  hasMore,
  loadMore,
  searchQuery, 
  setSearchQuery 
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      if (!hasMore || isLoadingMore || searchQuery) return;
      
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        loadMore();
      }
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasMore, isLoadingMore, loadMore, searchQuery, open]);

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects"
              className="w-full bg-secondary/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border transition-all font-medium"
            />
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="px-4 py-8 space-y-8 overflow-y-auto min-h-[300px]"
        >
          {loading ? (
            <div className="space-y-8">
               <ProjectSkeleton />
               <ProjectSkeleton />
            </div>
          ) : sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
               <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                  <Search className="h-6 w-6 text-muted-foreground" />
               </div>
               <p className="text-sm font-medium text-muted-foreground">No projects found</p>
            </div>
          ) : (
            <>
              {sections.map((section) => (
                 <div key={section.title} className="space-y-4">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">{section.title}</h4>
                    <div className="space-y-2">
                       {section.items.map((item: any) => (
                          <button 
                            key={item.id} 
                            onClick={() => {
                              setOpen(false);
                              router.push(`/project/${item.id}`);
                            }}
                            className="w-full flex flex-col gap-1 p-4 rounded-2xl hover:bg-secondary transition-all text-left group border border-transparent hover:border-border"
                          >
                            <span className="text-base font-bold text-foreground truncate">{item.title}</span>
                            <span className="text-xs font-medium text-muted-foreground">{getRelativeTime(item.updatedAt)}</span>
                          </button>
                       ))}
                    </div>
                 </div>
              ))}
              
              {isLoadingMore && (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Helper function to get relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}
