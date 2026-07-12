"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, Users, DollarSign, RefreshCw, Award, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";

interface AnalyticsPanelProps {
  mrr: number;
  arr: number;
  arpc: number;
  renewalRate: number;
  trialConversion: number;
  planDistribution: { name: string; count: number; color: string }[];
  statusDistribution: { status: string; count: number; color: string }[];
  growthTrend: { month: string; mrr: number; stations: number }[];
  topRevenueStations: { name: string; slug: string; revenue: number }[];
}

export function AnalyticsPanel({
  mrr,
  arr,
  arpc,
  renewalRate,
  trialConversion,
  planDistribution,
  statusDistribution,
  growthTrend,
  topRevenueStations,
}: AnalyticsPanelProps) {
  return (
    <div className="space-y-6">
      {/* ── Top SaaS KPIs ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Recurring (MRR)</p>
          <p className="text-xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
            {formatCurrencyCompact(mrr, "INR")}
            <span className="text-[10px] font-bold text-emerald-600 flex items-center">+12.4% <ArrowUpRight size={10} /></span>
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Annual Recurring (ARR)</p>
          <p className="text-xl font-black text-slate-900 mt-1">
            {formatCurrencyCompact(arr, "INR")}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Rev / Customer (ARPC)</p>
          <p className="text-xl font-black text-slate-900 mt-1">
            {formatCurrencyCompact(arpc, "INR")}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trial Conversion</p>
          <p className="text-xl font-black text-slate-900 mt-1 text-wd-teal-700">
            {trialConversion}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Renewal Rate</p>
          <p className="text-xl font-black text-slate-900 mt-1 text-emerald-600">
            {renewalRate}%
          </p>
        </div>
      </div>

      {/* ── MRR & Growth Chart ──────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">MRR Revenue Growth & Station Expansion</h3>
            <p className="text-xs text-slate-400">Historical performance over the last 6 months</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F766E" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
              <Tooltip
                formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "MRR"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="mrr" stroke="#0F766E" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ── Plan Distribution Pie Chart ─────────────────────────── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Plan Tier Distribution</h3>
            <p className="text-[11px] text-slate-400">Active tenant subscriptions by tier</p>
          </div>
          <div className="h-48 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val} stations`, "Subscribers"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center text-xs font-semibold pt-2 border-t border-slate-50">
            {planDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-700">{item.name} ({item.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Status Bar Chart ─────────────────────────────────────── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Customer Lifecycle Breakdown</h3>
            <p className="text-[11px] text-slate-400">Current platform accounts status</p>
          </div>
          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistribution} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="status" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val: any) => [`${val} stations`, "Count"]} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Top Revenue Stations ─────────────────────────────────── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Award size={16} className="text-wd-teal-700" />
              Top Revenue Stations
            </h3>
            <p className="text-[11px] text-slate-400">Highest grossing customer accounts</p>
          </div>
          <div className="space-y-3 my-3">
            {topRevenueStations.map((station, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-slate-100 font-black text-slate-500 flex items-center justify-center text-[10px] flex-shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{station.name}</p>
                    <p className="text-[10px] text-slate-400">@{station.slug}</p>
                  </div>
                </div>
                <span className="font-black text-slate-900 flex-shrink-0">
                  {formatCurrency(station.revenue, "INR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
