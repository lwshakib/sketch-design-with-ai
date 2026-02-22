"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import {
  ArrowLeft,
  Coins,
  BarChart3,
  History,
  Info,
  Zap,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";
import NumberFlow from "@number-flow/react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { UserMenu } from "@/components/user-menu";

const chartConfig = {
  credits: {
    label: "Credits Spent",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function SettingsPage() {
  const { credits, fetchCredits } = useWorkspaceStore();
  const [usageData, setUsageData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsageData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchCredits();
    fetchUsageData();
  }, [fetchCredits, fetchUsageData]);

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
    [usageData],
  );

  return (
    <div className="bg-background text-foreground selection:bg-primary/30 min-h-screen font-sans transition-colors duration-500">
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

      <div className="mx-auto max-w-4xl px-8 py-12">
        {/* Simplified Title */}
        <div className="mb-12">
          <div className="mb-2 flex items-center gap-3">
            <Coins className="text-primary h-5 w-5" />
            <h1 className="text-2xl font-bold tracking-tight">
              Usage & credits
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Monitor and fuel your AI engine.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Usage Chart Section */}
          <div className="space-y-10 lg:col-span-2">
            <Card className="border-border/60 bg-secondary/30 relative overflow-hidden rounded-3xl border p-0 shadow-sm backdrop-blur-sm">
              <CardHeader className="border-border/50 flex items-center justify-between border-b px-8 py-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-primary h-4 w-4" />
                  <CardTitle className="text-sm font-bold">
                    Consumption
                  </CardTitle>
                </div>
                <div className="bg-primary/10 border-primary/20 flex items-center gap-2 rounded-full border px-3 py-1">
                  <span className="text-primary text-[10px] font-bold tracking-tight uppercase">
                    Total: {totalCredits.toLocaleString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="h-[280px] w-full">
                  {isLoading ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <Loader2 className="text-muted-foreground/50 h-6 w-6 animate-spin" />
                    </div>
                  ) : usageData.length > 0 ? (
                    <ChartContainer
                      config={chartConfig}
                      className="h-full w-full"
                    >
                      <BarChart
                        accessibilityLayer
                        data={usageData}
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          vertical={false}
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border) / 0.3)"
                        />
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
                              className="border-border bg-background/95 w-[180px] rounded-2xl shadow-2xl backdrop-blur-md"
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
                              fillOpacity={
                                index === usageData.length - 1 ? 1 : 0.3
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-zinc-700">
                      <History className="text-muted-foreground/30 mb-4 h-8 w-8" />
                      <p className="text-muted-foreground text-xs font-bold tracking-wide">
                        No history found
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fair Use Info */}
            <div className="border-border/60 bg-secondary/20 flex items-start gap-5 rounded-3xl border px-8 py-6 shadow-sm">
              <div className="bg-background border-border flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm">
                <Info className="text-primary h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-foreground text-sm font-bold">
                  Fair usage policy
                </h3>
                <p className="text-muted-foreground max-w-md text-xs leading-relaxed">
                  Your daily 50k foundation is enough for ~15 architectures or
                  ~25 regenerations. Unused fuel evaporates at midnight.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-6">
            <div className="border-border bg-secondary/30 group relative overflow-hidden rounded-3xl border p-8 shadow-sm backdrop-blur-md">
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-bold">
                    Current Balance
                  </span>
                  <div className="bg-background border-border rounded-full border px-2 py-0.5 shadow-sm">
                    <span className="text-muted-foreground text-[9px] font-bold">
                      Reset in {resetIn}
                    </span>
                  </div>
                </div>

                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-foreground text-5xl font-bold tracking-tight">
                    <NumberFlow
                      value={credits || 0}
                      format={{ useGrouping: true }}
                    />
                  </span>
                  <span className="text-muted-foreground text-xs font-bold">
                    credits
                  </span>
                </div>

                <div className="bg-secondary border-border mb-8 h-1.5 w-full overflow-hidden rounded-full border">
                  <div
                    className="bg-primary h-full transition-all duration-1000 ease-out"
                    style={{ width: `${((credits || 0) / 50000) * 100}%` }}
                  />
                </div>

                <button
                  onClick={() => {
                    setIsLoading(true);
                    fetchCredits();
                    fetchUsageData();
                  }}
                  disabled={isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/10 flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl text-sm font-bold shadow-xl transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span>Sync balance</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: "Plan generation", val: "1,000", icon: Zap },
                { label: "Screen generation", val: "2,000", icon: History },
                { label: "Image analysis", val: "5,000", icon: History },
              ].map((item, i) => (
                <div
                  key={i}
                  className="border-border bg-secondary/20 group hover:bg-secondary/40 flex items-center justify-between rounded-2xl border px-6 py-4 shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-muted-foreground/30 group-hover:bg-primary h-2 w-2 rounded-full transition-colors" />
                    <span className="text-muted-foreground group-hover:text-foreground text-xs font-bold transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-muted-foreground group-hover:text-primary text-[11px] font-bold transition-colors">
                    {item.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
