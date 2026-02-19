"use client";

import React from "react";
import { Search, Monitor, Smartphone, Layout } from "lucide-react";

import { useRouter } from "next/navigation";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

const ProjectSkeleton = () => (
  <div className="space-y-4">
    <div className="h-3 w-20 bg-secondary animate-pulse rounded ml-2" />
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3">
           <div className="h-10 w-10 bg-secondary animate-pulse rounded-lg shrink-0" />
           <div className="flex-1 space-y-2">
             <div className="h-3 w-full bg-secondary animate-pulse rounded" />
             <div className="h-2 w-1/3 bg-secondary animate-pulse rounded" />
           </div>
        </div>
      ))}
    </div>
  </div>
);

interface SidebarProps {
  sections: any[];
  loading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function Sidebar({ 
  sections, 
  loading, 
  isLoadingMore,
  hasMore,
  loadMore,
  searchQuery, 
  setSearchQuery 
}: SidebarProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

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
  }, [hasMore, isLoadingMore, loadMore, searchQuery]);

  return (
    <aside className="w-[340px] h-screen bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col transition-colors duration-300">
      {/* Search Header */}
      <div className="p-4 pt-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects"
            className="w-full bg-secondary/50 border border-border rounded-lg py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border transition-all font-medium"
          />
        </div>
      </div>

      {/* Navigation */}
      <div 
        ref={scrollRef}
        className="flex-1 px-4 space-y-8 pb-8 mt-4 overflow-y-auto scrollbar-hide"
      >
        {loading ? (
          <div className="space-y-8">
            <ProjectSkeleton />
            <ProjectSkeleton />
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
             <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <Search className="h-5 w-5 text-muted-foreground" />
             </div>
             <p className="text-xs font-medium text-muted-foreground px-4">No projects found</p>
          </div>
        ) : (
          <>
            {sections.map((section) => (
              <div key={section.title} className="space-y-4">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">
                  {section.title}
                </h3>
                <div className="space-y-1">
                    {section.items.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => router.push(`/project/${item.id}`)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-all text-left group"
                      >
                        {/* Project Preview Square */}
                        <div className="h-10 w-10 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform overflow-hidden shadow-sm relative">
                          {item.firstScreenContent ? (
                            <div className="absolute inset-0 pointer-events-none origin-top-left" style={{ width: '1024px', height: '1024px', transform: 'scale(0.04)' }}>
                              <iframe
                                srcDoc={`
                                  <style>
                                    body { overflow: hidden; margin: 0; padding: 0; zoom: 1; }
                                    /* Hide scrollbars */
                                    ::-webkit-scrollbar { display: none; }
                                  </style>
                                  ${item.firstScreenContent}
                                `}
                                className="w-full h-full border-none pointer-events-none"
                                title="preview"
                                tabIndex={-1}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full h-full bg-zinc-50 dark:bg-zinc-950">
                              {item.firstScreenType === "web" ? (
                                <Monitor className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                              ) : item.firstScreenType === "app" ? (
                                <Smartphone className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                              ) : (
                                <Layout className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-foreground truncate transition-colors">
                            {item.title}
                          </span>
                          <span className="block text-[10px] font-medium text-muted-foreground">
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
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </div>
    </aside>
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
