"use client";

import React from "react";
import { Search, Monitor, Smartphone, Layout } from "lucide-react";

import { useRouter } from "next/navigation";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

const ProjectSkeleton = () => (
  <div className="space-y-4">
    <div className="bg-secondary ml-2 h-3 w-20 animate-pulse rounded" />
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="bg-secondary h-10 w-10 shrink-0 animate-pulse rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="bg-secondary h-3 w-full animate-pulse rounded" />
            <div className="bg-secondary h-2 w-1/3 animate-pulse rounded" />
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
  setSearchQuery,
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
    <aside className="bg-sidebar border-sidebar-border hidden h-screen w-[340px] flex-col border-r transition-colors duration-300 lg:flex">
      {/* Search Header */}
      <div className="p-4 pt-6">
        <div className="group relative">
          <Search className="text-muted-foreground group-focus-within:text-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects"
            className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-border w-full rounded-lg border py-2 pr-4 pl-10 text-sm font-medium transition-all outline-none"
          />
        </div>
      </div>

      {/* Navigation */}
      <div
        ref={scrollRef}
        className="scrollbar-hide mt-4 flex-1 space-y-8 overflow-y-auto px-4 pb-8"
      >
        {loading ? (
          <div className="space-y-8">
            <ProjectSkeleton />
            <ProjectSkeleton />
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-20 text-center">
            <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full">
              <Search className="text-muted-foreground h-5 w-5" />
            </div>
            <p className="text-muted-foreground px-4 text-xs font-medium">
              No projects found
            </p>
          </div>
        ) : (
          <>
            {sections.map((section) => (
              <div key={section.title} className="space-y-4">
                <h3 className="text-muted-foreground px-2 text-[10px] font-black tracking-widest uppercase">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => router.push(`/project/${item.id}`)}
                      className="hover:bg-secondary group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all"
                    >
                      {/* Project Preview Square */}
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-transform group-hover:scale-110 dark:border-zinc-800 dark:bg-zinc-900">
                        {item.firstScreenContent ? (
                          <div
                            className="pointer-events-none absolute inset-0 origin-top-left"
                            style={{
                              width: "1024px",
                              height: "1024px",
                              transform: "scale(0.04)",
                            }}
                          >
                            <iframe
                              srcDoc={`
                                  <style>
                                    body { overflow: hidden; margin: 0; padding: 0; zoom: 1; }
                                    /* Hide scrollbars */
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
                              <Monitor className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                            ) : item.firstScreenType === "app" ? (
                              <Smartphone className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                            ) : (
                              <Layout className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-foreground block truncate text-sm font-semibold transition-colors">
                          {item.title}
                        </span>
                        <span className="text-muted-foreground block text-[10px] font-medium">
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
                <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
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
