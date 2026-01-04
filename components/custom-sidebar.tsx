"use client";

import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function Sidebar() {
  return (
    <aside className="w-[300px] h-screen bg-sidebar border-r border-sidebar-border overflow-y-auto hidden lg:flex flex-col transition-colors duration-300">
      {/* Search Header */}
      <div className="p-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <input
            type="text"
            placeholder="Search projects"
            className="w-full bg-secondary/50 border border-border rounded-lg py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border transition-all font-medium"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 space-y-6 pb-8">
        {SECTIONS.map((section) => (
          <div key={section.title} className="space-y-4">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary transition-all text-left group"
                >
                  <div className={cn("h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border border-border shadow-sm", item.color)}>
                     <div className="w-6 h-6 rounded bg-current opacity-20" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold text-foreground truncate transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                      {item.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
