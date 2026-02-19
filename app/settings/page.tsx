"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { 
  ArrowLeft, 
  Coins, 
  BarChart3, 
  History, 
  Info,
  Zap,
  Clock,
  RefreshCw,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";

const chartConfig = {
  credits: {
    label: "Credits Spent",
    color: "hsl(var(--primary))",
  }
} satisfies ChartConfig;

export default function SettingsPage() {
  const { credits, fetchCredits } = useWorkspaceStore();
  const [usageData, setUsageData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const res = await fetch("/api/user/credits/usage");
      const data = await res.json();
      if (data.usage) {
        setUsageData(data.usage);
      }
    } catch (err) {
      console.error("Failed to fetch usage data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getResetTimeString = () => {
    const now = new Date();
    const tonight = new Date(now);
    tonight.setHours(24, 0, 0, 0);
    const diff = tonight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const [resetIn, setResetIn] = useState(getResetTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setResetIn(getResetTimeString());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const totalCredits = useMemo(
    () => usageData.reduce((acc, curr) => acc + curr.credits, 0),
    [usageData]
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans transition-colors duration-500">
      <header className="sticky top-0 w-full flex items-center justify-between px-6 py-2 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-all group py-1"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-8 py-12">
        {/* Simplified Title */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Coins className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Usage & credits</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Monitor and fuel your AI engine.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Usage Chart Section */}
          <div className="lg:col-span-2 space-y-10">
            <Card className="rounded-3xl border border-border/60 bg-secondary/30 backdrop-blur-sm relative overflow-hidden shadow-sm p-0">
              <CardHeader className="flex items-center justify-between px-8 py-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold">Consumption</CardTitle>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-tight">Total: {totalCredits.toLocaleString()}</span>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="h-[280px] w-full">
                  {isLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
                    </div>
                  ) : usageData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <BarChart
                        accessibilityLayer
                        data={usageData}
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false}
                          dy={15}
                          fontWeight={600}
                        />
                        <ChartTooltip 
                          content={
                            <ChartTooltipContent 
                              indicator="dashed" 
                              className="w-[180px] rounded-2xl shadow-2xl border-border bg-background/95 backdrop-blur-md"
                            />
                          } 
                        />
                        <Bar 
                          dataKey="credits" 
                          fill="var(--color-credits)"
                          radius={[6, 6, 0, 0]}
                          barSize={32}
                        >
                          {usageData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fillOpacity={index === usageData.length - 1 ? 1 : 0.3}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-zinc-700">
                      <History className="h-8 w-8 mb-4 text-muted-foreground/30" />
                      <p className="text-xs font-bold tracking-wide text-muted-foreground">No history found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fair Use Info */}
            <div className="px-8 py-6 rounded-3xl border border-border/60 bg-secondary/20 flex items-start gap-5 shadow-sm">
              <div className="h-10 w-10 rounded-2xl bg-background border border-border flex items-center justify-center shrink-0 shadow-sm">
                <Info className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Fair usage policy</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                  Your daily 50k foundation is enough for ~15 architectures or ~25 regenerations. Unused fuel evaporates at midnight.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-6">
            <div className="p-8 rounded-3xl border border-border bg-secondary/30 backdrop-blur-md relative overflow-hidden group shadow-sm">
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-bold text-muted-foreground">Current Balance</span>
                    <div className="px-2 py-0.5 rounded-full bg-background border border-border shadow-sm">
                       <span className="text-[9px] font-bold text-muted-foreground">Reset in {resetIn}</span>
                    </div>
                  </div>
                 
                  <div className="mb-6 flex items-baseline gap-2">
                    <span className="text-5xl font-bold tracking-tight text-foreground">
                      <NumberFlow 
                         value={credits || 0} 
                         format={{ useGrouping: true }}
                      />
                    </span>
                    <span className="text-muted-foreground font-bold text-xs">credits</span>
                  </div>
                 
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-8 border border-border">
                     <div 
                       className="h-full bg-primary transition-all duration-1000 ease-out"
                       style={{ width: `${(credits || 0) / 50000 * 100}%` }}
                     />
                  </div>

                  <button 
                   onClick={() => {
                     setIsLoading(true);
                     fetchCredits();
                     fetchUsageData();
                   }}
                   disabled={isLoading}
                   className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-primary/10"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    <span>Sync balance</span>
                  </button>
               </div>
            </div>

            <div className="space-y-3">
                {[
                  { label: 'Plan generation', val: '1,000', icon: Zap },
                  { label: 'Screen generation', val: '2,000', icon: History },
                  { label: 'Image analysis', val: '5,000', icon: History }
                ].map((item, i) => (
                  <div key={i} className="px-6 py-4 rounded-2xl border border-border bg-secondary/20 flex items-center justify-between group transition-all hover:bg-secondary/40 shadow-sm">
                     <div className="flex items-center gap-3">
                       <div className="h-2 w-2 rounded-full bg-muted-foreground/30 group-hover:bg-primary transition-colors" />
                       <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
                     </div>
                     <span className="text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">{item.val}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
