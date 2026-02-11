"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Copy, 
  RotateCcw, 
  Check, 
  Link
} from "lucide-react";
import { useProjectStore } from "@/hooks/use-project-store";
import { toast } from "sonner";
import axios from "axios";

export function ShareDialog() {
  const { 
    isShareDialogOpen, 
    setIsShareDialogOpen, 
    project, 
    setProject 
  } = useProjectStore();
  const [isResetting, setIsResetting] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  if (!project) return null;

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/preview/project/${project.id}/${project.shareToken || 'generating...'}`
    : '';

  const handleCopy = () => {
    if (!project.shareToken) {
      handleReset();
      return;
    }
    navigator.clipboard.writeText(shareUrl);
    setHasCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      const res = await axios.post(`/api/projects/${project.id}/share/reset`);
      setProject(res.data);
      toast.success("Link regenerated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate link");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
      <DialogContent className="sm:max-w-[420px] bg-background border-border">
        <DialogHeader>
          <DialogTitle>Preview Project</DialogTitle>
          <DialogDescription>
            Anyone with this link can preview the project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {!project.shareToken ? (
             <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-lg bg-muted/50">
                <Button 
                  onClick={handleReset} 
                  disabled={isResetting}
                  size="sm"
                >
                  {isResetting ? "Generating..." : "Generate Preview Link"}
                </Button>
             </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  readOnly 
                  value={shareUrl} 
                  className="pl-9 pr-2 h-10 bg-muted/50 font-mono text-xs"
                />
              </div>
              <Button 
                onClick={handleCopy}
                size="icon"
                variant="outline"
                className="h-10 w-10 shrink-0"
              >
                {hasCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {project.shareToken && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isResetting}
                className="h-auto p-0 text-muted-foreground hover:text-foreground text-xs"
              >
                <RotateCcw className={cn("mr-1.5 h-3 w-3", isResetting && "animate-spin")} />
                Regenerate link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper to avoid adding standard shadcn/ui cn dependency if not already present in this file,
// though it likely is in the project. If `cn` isn't imported, I'll add the import or simple implementation.
// Looking at previous file content, `cn` was imported from "@/lib/utils". I should include that import.

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
