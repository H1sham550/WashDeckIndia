"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Coins, DollarSign, ArrowRight, Receipt } from "lucide-react";

interface DailyFinancial {
  label: string;
  income: number;
  expense: number;
}

interface OwnerProfitLossCardProps {
  currency: string;
  totalIncome: number;
  totalExpense: number;
  chartData: DailyFinancial[];
}

export function OwnerProfitLossCard({
  currency,
  totalIncome,
  totalExpense,
  chartData,
}: OwnerProfitLossCardProps) {
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(d.income, d.expense)),
    100
  );

  const svgWidth = 540;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 20;
  const chartWidth = svgWidth - paddingX - 15;
  const chartHeight = svgHeight - paddingY - 25;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Receipt size={18} />
            </div>
            <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
              Expense & Cash Flow Tracker
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time cash inflow, operational expenses, profit/loss, and margins.
          </p>
        </div>

        <Link
          href="/dashboard/finance"
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition self-start sm:self-auto"
        >
          <span>Full Expense Tracker</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Gross Income */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Gross Inflow</span>
            <TrendingUp size={14} className="text-emerald-500" />
          </div>
          <p className="text-lg font-extrabold text-slate-800 mt-1">
            {currency}{totalIncome.toLocaleString()}
          </p>
        </div>

        {/* Expenses */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Expenses</span>
            <TrendingDown size={14} className="text-rose-500" />
          </div>
          <p className="text-lg font-extrabold text-slate-800 mt-1">
            {currency}{totalExpense.toLocaleString()}
          </p>
        </div>

        {/* Net Profit */}
        <div className={`p-3.5 rounded-xl border ${netProfit >= 0 ? "bg-emerald-50/60 border-emerald-200" : "bg-rose-50/60 border-rose-200"}`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Net Profit</span>
            <Coins size={14} className={netProfit >= 0 ? "text-emerald-600" : "text-rose-600"} />
          </div>
          <p className={`text-lg font-extrabold mt-1 ${netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {netProfit >= 0 ? "+" : ""}{currency}{netProfit.toLocaleString()}
          </p>
        </div>

        {/* Profit Margin */}
        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-[10px] font-black uppercase tracking-wider">Profit Margin</span>
            <DollarSign size={14} />
          </div>
          <p className="text-lg font-extrabold text-blue-900 mt-1">
            {profitMargin}%
          </p>
        </div>
      </div>

      {/* Visual Analyzing SVG Chart */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700">Daily Cashflow (Inflow vs Outflow)</span>
          <div className="flex items-center gap-4 text-[10px] font-bold">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Income
            </span>
            <span className="flex items-center gap-1 text-rose-600">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Expense
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto bg-slate-50/50 rounded-xl p-2 border border-slate-100">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none">
            {/* Gridlines */}
            {[0, 0.5, 1].map((r) => {
              const y = paddingY + chartHeight - r * chartHeight;
              return (
                <line
                  key={r}
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - 10}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                />
              );
            })}

            {/* Bars */}
            {chartData.map((d, i) => {
              const colWidth = chartWidth / chartData.length;
              const x = paddingX + i * colWidth;
              const incH = (d.income / maxVal) * chartHeight;
              const expH = (d.expense / maxVal) * chartHeight;

              const incY = paddingY + chartHeight - incH;
              const expY = paddingY + chartHeight - expH;

              const barW = Math.max(colWidth * 0.3, 4);

              return (
                <g key={i}>
                  {/* Income bar */}
                  {d.income > 0 && (
                    <rect
                      x={x + colWidth / 2 - barW - 1}
                      y={incY}
                      width={barW}
                      height={incH}
                      rx={2}
                      className="fill-emerald-500 hover:fill-emerald-600 transition-colors"
                    />
                  )}
                  {/* Expense bar */}
                  {d.expense > 0 && (
                    <rect
                      x={x + colWidth / 2 + 1}
                      y={expY}
                      width={barW}
                      height={expH}
                      rx={2}
                      className="fill-rose-500 hover:fill-rose-600 transition-colors"
                    />
                  )}
                  {/* Label */}
                  <text
                    x={x + colWidth / 2}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    className="fill-slate-400 font-bold text-[9px]"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
