"use client";

import { useEffect, useState } from "react";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";

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

  const chartColors = {
    bar: "#6366f1",
    barBg: "#1e1b4b",
    axis: "#71717a",
    grid: "#18181b",
    tooltip: {
      bg: "#09090b",
      border: "#27272a",
      text: "#fafafa"
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 font-sans pb-20">
      <div className="mx-auto max-w-4xl px-8 py-16">
        {/* Navigation */}
        <Link 
          href="/" 
          className="mb-12 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-200 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Usage & credits</h1>
            <p className="text-zinc-500 text-[15px] max-w-lg leading-relaxed">
              Monitor your engine consumption. Your credits reset daily at midnight to ensure fair access for everyone.
            </p>
          </div>

          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-zinc-900/30 border border-white/5 backdrop-blur-sm">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-400">Reset in {resetIn}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Usage Chart Section */}
          <div className="lg:col-span-2 space-y-10">
            <div className="p-10 rounded-[2.5rem] border border-white/5 bg-zinc-900/20 relative overflow-hidden">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-zinc-300">Daily consumption</h2>
                </div>
                <span className="text-[11px] font-medium text-zinc-500">Last 7 days</span>
              </div>

              <div className="h-[280px] w-full">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-800" />
                  </div>
                ) : usageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usageData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke={chartColors.grid} vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke={chartColors.axis} 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false}
                        dy={15}
                        fontWeight={500}
                        tickFormatter={(v) => v}
                      />
                      <YAxis 
                        stroke={chartColors.axis} 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(v) => `${v / 1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: chartColors.tooltip.bg, 
                          border: `1px solid ${chartColors.tooltip.border}`,
                          borderRadius: '16px',
                          fontSize: '12px',
                          padding: '12px 16px',
                          color: chartColors.tooltip.text,
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)'
                        }}
                        itemStyle={{ color: '#818cf8', fontWeight: 600 }}
                        cursor={{ fill: '#ffffff03' }}
                        labelStyle={{ marginBottom: '4px', opacity: 0.5, fontWeight: 500 }}
                      />
                      <Bar 
                        dataKey="credits" 
                        radius={[8, 8, 8, 8]} 
                        barSize={32}
                      >
                        {usageData.map((entry, index) => (
                           <Cell 
                              key={`cell-${index}`} 
                              fill={index === usageData.length - 1 ? '#818cf8' : '#312e81'} 
                              fillOpacity={index === usageData.length - 1 ? 1 : 0.4}
                           />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-zinc-700">
                    <History className="h-8 w-8 mb-4 opacity-20" />
                    <p className="text-xs font-medium tracking-wide">No history found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Fair Use Info */}
            <div className="px-8 py-6 rounded-3xl border border-white/5 bg-zinc-900/10 flex items-start gap-5">
              <div className="h-10 w-10 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-center shrink-0">
                <Info className="h-4 w-4 text-zinc-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-300">Fair usage policy</h3>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-md">
                  Your daily 50k foundation is enough for ~15 architectures or ~25 regenerations. Unused fuel evaporates at midnight.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-8">
            <div className="p-10 rounded-[2.5rem] border border-white/5 bg-zinc-900/20 backdrop-blur-md relative overflow-hidden group">
               <div className="relative z-10 flex flex-col h-full">
                 <div className="flex items-center gap-2 mb-10">
                   <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                   <span className="text-[11px] font-semibold text-zinc-500">Balance</span>
                 </div>
                 
                 <div className="mb-6 flex items-baseline gap-2">
                   <span className="text-5xl font-bold tracking-tight">
                     <NumberFlow 
                        value={credits || 0} 
                        format={{ useGrouping: true }}
                     />
                   </span>
                   <span className="text-zinc-600 font-medium text-xs">credits</span>
                 </div>
                 
                 <div className="h-1.5 w-full bg-zinc-900/50 rounded-full overflow-hidden mb-10 border border-white/5">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
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
                  className="w-full h-12 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2.5"
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
                 <div key={i} className="px-6 py-4 rounded-2xl border border-white/5 bg-zinc-900/10 flex items-center justify-between group transition-colors hover:bg-zinc-900/20">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-zinc-800 group-hover:bg-indigo-500/50 transition-colors" />
                      <span className="text-xs font-semibold text-zinc-400">{item.label}</span>
                    </div>
                    <span className="text-[11px] font-medium text-zinc-600 group-hover:text-zinc-400 transition-colors">{item.val}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
