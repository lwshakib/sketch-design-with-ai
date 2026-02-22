"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  ArrowRight,
  List,
  Search,
  Smartphone,
  Monitor,
  X,
  Loader2,
  RotateCcw,
  Layout,
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
import Image from "next/image";
import { uploadFileToCloudinary } from "@/lib/cloudinary-client";
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
  ],
};

// Helper to group projects by date
const groupProjectsByDate = (projects: any[]) => {
  const sections: { title: string; items: any[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayItems = projects.filter((p) => new Date(p.updatedAt) >= today);
  const yesterdayItems = projects.filter((p) => {
    const d = new Date(p.updatedAt);
    return d >= yesterday && d < today;
  });
  const olderItems = projects.filter((p) => new Date(p.updatedAt) < yesterday);

  if (todayItems.length > 0)
    sections.push({ title: "Today", items: todayItems });
  if (yesterdayItems.length > 0)
    sections.push({ title: "Yesterday", items: yesterdayItems });
  if (olderItems.length > 0)
    sections.push({ title: "Previous", items: olderItems });

  return sections;
};

const ProjectSkeleton = () => (
  <div className="space-y-4">
    <div className="bg-secondary ml-2 h-3 w-20 animate-pulse rounded" />
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <div className="bg-secondary h-12 w-12 shrink-0 animate-pulse rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="bg-secondary h-4 w-full animate-pulse rounded" />
            <div className="bg-secondary h-3 w-1/3 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

import { useRouter } from "next/navigation";

interface Attachment {
  url: string;
  isUploading: boolean;
  file?: File; // Add file property for the actual File object
  type?: string; // Add type property for file type
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

  const fetchProjects = React.useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore && (isLoadingMore || !hasMore)) return;

      if (isLoadMore) setIsLoadingMore(true);
      else setLoadingProjects(true);

      try {
        const skip = isLoadMore ? projects.length : 0;
        const res = await fetch(
          `/api/projects?limit=20&skip=${skip}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`,
        );
        if (res.ok) {
          const data = await res.json();

          if (data.length < 20) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }

          if (isLoadMore) {
            setProjects((prev) => [...prev, ...data]);
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
    },
    [hasMore, isLoadingMore, projects.length, searchQuery],
  );

  const [shuffledPrompts, setShuffledPrompts] = useState<string[]>([]);

  const refreshPrompts = React.useCallback(() => {
    const allPrompts = [...PROMPTS.app, ...PROMPTS.web];
    const shuffled = allPrompts.sort(() => Math.random() - 0.5).slice(0, 3);
    setShuffledPrompts(shuffled);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchCredits();
  }, [fetchCredits, fetchProjects]);

  useEffect(() => {
    if (isMounted) {
      refreshPrompts();
    }
  }, [isMounted, refreshPrompts]);

  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => {
      fetchProjects();
    }, 400);

    return () => clearTimeout(timer);
  }, [fetchProjects, isMounted, searchQuery]);

  const onSubmit = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    if (credits !== null && credits < 10000) {
      toast.error("Insufficient credits (10k required)");
      return;
    }

    if (attachments.some((a) => a.isUploading)) {
      toast.error("Please wait for images to finish uploading");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: inputValue.slice(0, 30) || "Untitled Design",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const project = await response.json();

      // Store initial prompt for the project page to pick up
      if (inputValue.trim() || attachments.length > 0) {
        sessionStorage.setItem(
          `pending_prompt_${project.id}`,
          JSON.stringify({
            content: inputValue,
            attachments: attachments.map((a) => a.url),
          }),
        );
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

    if (attachments.length + files.length > 3) {
      toast.error("Maximum 3 images allowed");
      return;
    }

    const newAttachments = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type,
      isUploading: true,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);

    // Process uploads
    for (let i = 0; i < newAttachments.length; i++) {
      const attachment = newAttachments[i];
      try {
        const result = await uploadFileToCloudinary(attachment.file);
        setAttachments((prev) =>
          prev.map((a) =>
            a.url === attachment.url
              ? { ...a, url: result.secureUrl, isUploading: false }
              : a,
          ),
        );
      } catch (error) {
        console.error("Upload failed", error);
        toast.error(`Failed to upload ${attachment.file.name}`);
        setAttachments((prev) => prev.filter((a) => a.url !== attachment.url));
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const sections = groupProjectsByDate(projects);

  if (!isMounted) return null;

  return (
    <div className="bg-background text-foreground flex h-screen w-full overflow-hidden font-sans transition-colors duration-500">
      <Sidebar
        sections={sections}
        loading={loadingProjects}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        loadMore={() => fetchProjects(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="bg-background relative flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="z-40 flex items-center justify-between bg-transparent px-6 py-4">
          <div className="flex items-center gap-4">
            <Logo textSize="1.6rem" />
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="group flex items-center rounded-2xl border border-zinc-200 bg-zinc-100/50 px-4 py-2 shadow-sm transition-all hover:bg-zinc-200/50 dark:border-white/10 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/80"
            >
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                <NumberFlow
                  value={(credits || 0) / 1000}
                  className="font-bold text-zinc-900 dark:text-zinc-100"
                  format={{
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }}
                />
                <span className="text-zinc-500 dark:text-zinc-500">
                  k credits remaining
                </span>
              </span>
            </Link>
            <UserMenu />
          </div>
        </header>

        {/* Mobile Page Header */}
        <div className="absolute top-20 right-6 z-50 lg:hidden">
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

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Center Workspace */}
          <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-20">
            <div className="mb-12 w-full max-w-2xl space-y-12 pt-10">
              {/* Main Title Row */}
              <div className="flex flex-col items-center space-y-4 text-center">
                <h1 className="text-foreground text-4xl leading-tight font-black tracking-tight md:text-5xl">
                  Start a new UI design
                </h1>
                <p className="text-muted-foreground max-w-md text-sm font-medium">
                  Transform your ideas into high-fidelity prototypes instantly
                  using our neural design engine.
                </p>
              </div>

              {/* Premium Chat Input */}
              <div className="group relative w-full">
                {/* Outer Glow Overlay */}
                <div className="from-primary/10 via-accent/10 to-primary/10 pointer-events-none absolute -inset-[1px] rounded-[24px] bg-gradient-to-r opacity-0 blur-2xl transition-all duration-700 group-focus-within:opacity-100" />

                <div className="group-focus-within:border-primary/20 relative space-y-4 rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 group-focus-within:shadow-[0_0_60px_-10px_rgba(var(--primary-rgb),0.2)] dark:border-white/5 dark:bg-zinc-950 dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]">
                  {/* Image Previews & Website URL */}
                  <AnimatePresence>
                    {attachments.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-wrap gap-3 pb-2"
                      >
                        {attachments.map((attr, i) => (
                          <div
                            key={i}
                            className="group/img relative h-20 w-20 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-white/10 dark:bg-zinc-900"
                          >
                            <Image
                              src={attr.url}
                              alt="Attachment"
                              fill
                              className={cn(
                                "h-full w-full object-cover",
                                attr.isUploading && "opacity-40 blur-[2px]",
                              )}
                            />
                            {attr.isUploading && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                              </div>
                            )}
                            <button
                              onClick={() => removeAttachment(i)}
                              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover/img:opacity-100"
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSubmit();
                      }
                    }}
                    placeholder="Describe your design vision..."
                    className="text-foreground hide-scrollbar h-24 w-full resize-none bg-transparent text-lg leading-relaxed font-medium outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  />

                  <div className="flex flex-col items-end gap-3 pt-2">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                        />

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 transition-colors outline-none hover:text-zinc-900 dark:border-white/5 dark:bg-zinc-900/50 dark:hover:text-white"
                        >
                          <Plus className="h-5 w-5" />
                        </button>

                        <div className="mx-1 h-4 w-[1px] bg-zinc-200 dark:bg-white/10" />

                        <p className="hidden text-[10px] font-bold tracking-widest text-zinc-400 uppercase sm:block dark:text-zinc-600">
                          Press Enter to Generate
                        </p>
                      </div>

                      <Button
                        onClick={onSubmit}
                        disabled={
                          (!inputValue.trim() && attachments.length === 0) ||
                          attachments.some((a) => a.isUploading) ||
                          isSubmitting
                        }
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-full border border-black/5 px-5 shadow-xl transition-all disabled:opacity-30 dark:border-white/10"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold tracking-tight">
                              Generate
                            </span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prompt Suggestions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="dark:text-muted-foreground text-sm font-medium text-zinc-500 capitalize">
                    Try these prompts
                  </h3>
                  <button
                    onClick={refreshPrompts}
                    className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-white/5 dark:hover:text-zinc-300"
                    title="Refresh prompts"
                  >
                    <RotateCcw className="size-4" />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {shuffledPrompts.map((prompt: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputValue(prompt);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="dark:hover:border-primary/20 group rounded-xl border border-zinc-200 bg-white p-4 text-left text-xs leading-relaxed font-medium text-zinc-500 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] dark:border-white/5 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900/50"
                    >
                      <span className="transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-200">
                        {prompt}
                      </span>
                    </button>
                  ))}
                </div>
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
  setSearchQuery,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isMobile && open) {
    setOpen(false);
  }

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
        <div className="bg-secondary border-border hover:bg-secondary/80 cursor-pointer rounded-lg border p-2 shadow-lg transition-all lg:hidden">
          <List className="text-foreground h-6 w-6" />
        </div>
      </DrawerTrigger>
      <DrawerContent className="bg-background border-border text-foreground max-h-[90vh]">
        <DrawerHeader className="flex flex-row items-center justify-between border-none px-6 py-5">
          <DrawerTitle className="text-left text-xl font-black tracking-tighter uppercase">
            Design History
          </DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </DrawerHeader>

        {/* Search Bar matching Sidebar style */}
        <div className="p-6 pb-2">
          <div className="group relative">
            <Search className="text-muted-foreground group-focus-within:text-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects"
              className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-border w-full rounded-lg border py-2.5 pr-4 pl-10 text-sm font-medium transition-all outline-none"
            />
          </div>
        </div>

        <div
          ref={scrollRef}
          className="min-h-[300px] space-y-8 overflow-y-auto px-4 py-8"
        >
          {loading ? (
            <div className="space-y-8">
              <ProjectSkeleton />
              <ProjectSkeleton />
            </div>
          ) : sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-20 text-center">
              <div className="bg-secondary flex h-12 w-12 items-center justify-center rounded-full">
                <Search className="text-muted-foreground h-6 w-6" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                No projects found
              </p>
            </div>
          ) : (
            <>
              {sections.map((section) => (
                <div key={section.title} className="space-y-4">
                  <h4 className="text-muted-foreground px-2 text-[10px] font-black tracking-widest uppercase">
                    {section.title}
                  </h4>
                  <div className="space-y-2">
                    {section.items.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setOpen(false);
                          router.push(`/project/${item.id}`);
                        }}
                        className="hover:bg-secondary group hover:border-border flex w-full items-center gap-4 rounded-2xl border border-transparent p-4 text-left transition-all"
                      >
                        {/* Project Preview Square */}
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-transform group-hover:scale-110 dark:border-zinc-800 dark:bg-zinc-900">
                          {item.firstScreenContent ? (
                            <div
                              className="pointer-events-none absolute inset-0 origin-top-left"
                              style={{
                                width: "1024px",
                                height: "1024px",
                                transform: "scale(0.048)",
                              }}
                            >
                              <iframe
                                srcDoc={`
                                      <style>
                                        body { overflow: hidden; margin: 0; padding: 0; }
                                        ::-webkit-scrollbar { display: none; }
                                      </style>
                                      ${item.firstScreenContent}
                                    `}
                                className="pointer-events-none h-full w-full border-none"
                                title="preview"
                                tabIndex={-1}
                              />
                            </div>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                              {item.firstScreenType === "web" ? (
                                <Monitor className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
                              ) : item.firstScreenType === "app" ? (
                                <Smartphone className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
                              ) : (
                                <Layout className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-foreground block truncate text-base font-bold">
                            {item.title}
                          </span>
                          <span className="text-muted-foreground block text-xs font-medium">
                            {getRelativeTime(item.updatedAt)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {isLoadingMore && (
                <div className="flex justify-center p-4">
                  <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
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
  if (diffMins < 60)
    return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24)
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
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
