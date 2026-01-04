"use client";

import React, { useState, useEffect } from "react";
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

const PROMPTS = [
  "Quiz page in a language learning app with a progress bar at the top. The title challenges you to match a Spanish word with the correct answer, offering four possible options.",
  "Mobile-responsive ecommerce home page for a bird watching gear store",
];

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

export default function Home() {
  const [activeTab, setActiveTab] = useState("app");
  const [inputValue, setInputValue] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
            <div className="relative group">
              {/* Outer Glow Overlay */}
              <div className="absolute -inset-[1px] rounded-[24px] bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 blur-md pointer-events-none" />
              
              <div className="relative bg-card rounded-[24px] p-6 space-y-4 border border-border group-focus-within:border-purple-500/30 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] transition-all">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Describe your design"
                  className="w-full h-32 bg-transparent outline-none resize-none text-lg text-foreground placeholder:text-muted-foreground/50 font-medium leading-relaxed"
                />

                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/50">
                    <Plus className="h-5 w-5" />
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {/* Tiny Extension Icons */}
                    <div className="flex items-center gap-1.5 mr-2">
                       <div className="h-6 w-11 bg-secondary rounded-full flex items-center justify-around px-1 border border-border">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <Globe className="h-3 w-3 text-emerald-500" />
                       </div>
                    </div>

                    {/* Model Switcher */}
                    <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full border border-border hover:bg-secondary/80 transition-colors cursor-pointer group/model">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-[12px] font-bold text-muted-foreground group-hover/model:text-foreground">3.0 Pro</span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
                    </div>

                    <Button 
                       disabled={!inputValue.trim()}
                       className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-30 p-0 border border-border/10"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Try these prompts */}
            <div className="space-y-4">
               <h3 className="text-[11px] font-black text-muted-foreground ml-1 uppercase tracking-widest">Try these prompts</h3>
               <div className="flex flex-col gap-3">
                  {PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      className="w-full p-4 rounded-xl bg-card border border-border text-left text-sm text-muted-foreground font-medium hover:bg-secondary hover:border-border transition-all leading-snug shadow-sm"
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
        <DrawerHeader className="border-b border-border px-6 py-5 flex items-center justify-between">
          <DrawerTitle className="text-left font-black text-xl uppercase tracking-tighter">
            Design History
          </DrawerTitle>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full text-muted-foreground hover:text-foreground">
             <X className="h-5 w-5" />
          </Button>
        </DrawerHeader>

        {/* Search Bar matching Sidebar style */}
        <div className="p-6 pb-2 border-b border-border/50">
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

// End of file cleanup
