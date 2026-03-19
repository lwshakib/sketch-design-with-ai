"use client";

import React from "react";
import {
  ArrowLeft,
  Coins,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";


export default function SettingsPage() {
  return (
    <div className="bg-background text-foreground min-h-screen font-sans flex flex-col">
      <header className="bg-background/80 border-border/50 sticky top-0 z-50 flex w-full items-center justify-between border-b px-6 py-2 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground group inline-flex items-center gap-2 py-1 text-sm font-bold transition-all"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-secondary/30 border-border/60 max-w-md space-y-6 rounded-3xl border p-12 shadow-sm backdrop-blur-sm">
          <div className="bg-background border-border mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border shadow-lg">
            <Coins className="text-primary h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Usage & credits</h1>
            <p className="text-muted-foreground text-sm">
              This feature is not available now. Our credit system is currently undergoing maintenance as we transition to a more flexible model.
            </p>
          </div>
          <Button asChild className="rounded-xl px-8 font-bold">
            <Link href="/">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

