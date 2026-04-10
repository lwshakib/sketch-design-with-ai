"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Smartphone,
  Monitor,
  Layout,
  Loader2,
  Trash2,
  LayoutGrid,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { UserMenu } from "@/components/user-menu";
import { useDebounce } from "@/hooks/use-debounce";
import { getRelativeTime } from "@/lib/utils/time";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Grouping logic mirrored from Landing Page for consistency
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

export default function ProjectsPage() {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string, title: string } | null>(null);

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/sign-in");
    }
  }, [session, isSessionPending, router]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!session) return;
      try {
        setLoading(true);
        const res = await axios.get("/api/projects", {
          params: { search: debouncedSearch },
        });
        setProjects(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [session, debouncedSearch]);

  const handleDeleteClick = (project: { id: string, title: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      await axios.delete(`/api/projects/${projectToDelete.id}`);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      toast.success("Project deleted");
    } catch (err) {
      toast.error("Failed to delete project");
    } finally {
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  if (isSessionPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  const sections = groupProjectsByDate(projects);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans transition-colors duration-500">
      {/* Unified Header */}
      <header className="z-40 flex w-full items-center justify-between bg-background/50 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Logo />
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col space-y-10">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">My Projects</h1>
            <Button 
              variant="outline"
              onClick={() => router.push("/")} 
              className="rounded-full px-5 h-9 text-sm font-medium border-border/60 hover:bg-secondary transition-colors"
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              New Project
            </Button>
          </div>

          {/* Search Bar matching sidebar style */}
          <div className="group relative">
            <Search className="text-muted-foreground group-focus-within:text-foreground absolute top-1/2 left-4 h-3.5 w-3.5 -translate-y-1/2 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your library..."
              className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 w-full rounded-2xl border py-2.5 pr-4 pl-11 text-sm font-medium transition-all outline-none focus:ring-4 focus:ring-primary/5"
            />
          </div>

          <div className="space-y-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-24 text-center">
                <div className="bg-secondary/50 flex h-14 w-14 items-center justify-center rounded-2xl">
                  <LayoutGrid className="text-muted-foreground/50 h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">No projects found</p>
                </div>
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.title} className="space-y-4">
                  <h4 className="text-muted-foreground px-2 text-[11px] font-bold uppercase tracking-wider">
                    {section.title}
                  </h4>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group relative"
                      >
                        <button
                          onClick={() => router.push(`/project/${item.id}`)}
                          className="hover:bg-secondary/50 group/item hover:border-border/50 flex w-full items-center gap-4 rounded-2xl border border-transparent p-3 text-left transition-all"
                        >
                          {/* Project Preview Square - Exactly like sidebar/mobile menu */}
                          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-transform group-hover/item:scale-105 dark:border-zinc-800 dark:bg-zinc-900">
                            {item.firstScreenHtml ? (
                              <div
                                className="pointer-events-none absolute inset-0 origin-top-left"
                                style={{
                                  width: "1024px",
                                  height: "1024px",
                                  transform: "scale(0.048)", // Exact scale from sidebar
                                }}
                              >
                                <iframe
                                  srcDoc={`
                                    <style>
                                      body { overflow: hidden; margin: 0; padding: 0; }
                                      ::-webkit-scrollbar { display: none; }
                                    </style>
                                    ${item.firstScreenHtml}
                                  `}
                                  className="pointer-events-none h-full w-full border-none"
                                  title="preview"
                                  tabIndex={-1}
                                />
                              </div>
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                                {item.firstScreenType === "web" ? (
                                  <Monitor className="h-6 w-6 text-zinc-400" />
                                ) : item.firstScreenType === "app" ? (
                                  <Smartphone className="h-6 w-6 text-zinc-400" />
                                ) : (
                                  <Layout className="h-6 w-6 text-zinc-400" />
                                )}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className="text-foreground block truncate text-base font-bold leading-none">
                              {item.title}
                            </span>
                            <p className="text-muted-foreground mt-1.5 block text-xs font-medium">
                              {getRelativeTime(item.updatedAt)}
                            </p>
                          </div>

                          {/* Subtle Delete Trigger */}
                          <div className="opacity-0 group-hover/item:opacity-100 transition-opacity pr-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                onClick={(e) => handleDeleteClick({ id: item.id, title: item.title }, e)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-background border-border text-foreground max-w-[400px] rounded-2xl border p-6 shadow-xl">
          <AlertDialogHeader className="space-y-1.5">
            <AlertDialogTitle className="text-lg font-semibold tracking-tight">
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="text-foreground font-medium">
                "{projectToDelete?.title}"
              </span>? This will permanently remove all associated screens and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 flex flex-row items-center gap-2">
            <AlertDialogCancel className="bg-secondary hover:bg-muted text-muted-foreground mt-0 h-9 flex-1 rounded-lg border-none text-xs font-medium transition-colors">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700 h-9 flex-1 rounded-lg border-none text-xs font-medium transition-colors shadow-none"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
