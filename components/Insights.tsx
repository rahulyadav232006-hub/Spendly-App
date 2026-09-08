"use client";

import React, { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SpendlyState } from "@/types";
import { MONTHS_SHORT, addWeeks, formatMoney, fromCents, inRange, sumCents } from "@/lib/utils";
import { computeWeekStats, getCategoryTotals, getDailyTotals } from "@/lib/weekStats";
import { Card, EmptyMini, StatCard } from "./ui";

export function Insights({ state, weekStart }: { state: SpendlyState; weekStart: Date }) {
  const { settings, transactions } = state;

  const thisWeek = useMemo(() => computeWeekStats(transactions, weekStart), [transactions, weekStart]);
  const prevWeek = useMemo(() => computeWeekStats(transactions, addWeeks(weekStart, -1)), [transactions, weekStart]);

  const weekTotal = thisWeek.spent;
  const prevWeekTotal = prevWeek.spent;
  const pctChange = prevWeekTotal > 0 ? ((weekTotal - prevWeekTotal) / prevWeekTotal) * 100 : weekTotal > 0 ? 100 : 0;

  const dailyData = useMemo(() => getDailyTotals(thisWeek.weekExpenses, weekStart), [thisWeek.weekExpenses, weekStart]);
  const categoryData = useMemo(() => getCategoryTotals(thisWeek.weekExpenses, settings.categories), [thisWeek.weekExpenses, settings.categories]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const total = fromCents(sumCents(transactions.filter((t) => t.type === "expense" && inRange(t.dateTime, monthStart, monthEnd)).map((t) => t.amount)));
      months.push({ month: MONTHS_SHORT[d.getMonth()], amount: total });
    }
    return months;
  }, [transactions]);

  const avgDaily = weekTotal / 7;
  const topCategory = categoryData[0];
  const monthTotal = monthlyData[monthlyData.length - 1]?.amount || 0;

  return (
    <div className="pb-24 sm:pb-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-stone-50 mb-1 font-display">Insights</h1>
      <p className="text-sm text-slate-500 dark:text-stone-400 mb-6">A quick look at your spending patterns.</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="This week" value={formatMoney(weekTotal, settings.currency)} />
        <StatCard label="This month" value={formatMoney(monthTotal, settings.currency)} />
        <StatCard label="Avg. daily" value={formatMoney(avgDaily, settings.currency)} />
        <StatCard label="Vs. last week" value={`${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(0)}%`} tone={pctChange > 0 ? "rose" : "teal"} icon={pctChange > 0 ? ArrowUpRight : ArrowDownRight} />
      </div>

      <Card title="Weekly spending trend">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyData} margin={{ left: -20, top: 8 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip formatter={(v: number) => formatMoney(v, settings.currency)} contentStyle={{ borderRadius: 12, fontSize: 13, border: "1px solid #e2e8f0" }} />
            <Bar dataKey="amount" fill="#0f766e" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Category breakdown">
        {categoryData.length === 0 ? (
          <EmptyMini text="No expenses to break down yet." />
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={180} className="sm:w-1/2">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="label" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatMoney(v, settings.currency)} contentStyle={{ borderRadius: 12, fontSize: 13, border: "1px solid #e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full sm:w-1/2 space-y-2">
              {categoryData.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-900 dark:text-stone-50">
                    <span>{c.emoji}</span> {c.label}
                  </span>
                  <span className="font-medium text-slate-500 dark:text-stone-400">{formatMoney(c.value, settings.currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card title="Monthly spending">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyData} margin={{ left: -20, top: 8 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip formatter={(v: number) => formatMoney(v, settings.currency)} contentStyle={{ borderRadius: 12, fontSize: 13, border: "1px solid #e2e8f0" }} />
            <Line type="monotone" dataKey="amount" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {topCategory && (
        <p className="text-xs text-center text-slate-400 dark:text-stone-500 mt-2">
          {topCategory.emoji} {topCategory.label} is your top category this week, at {formatMoney(topCategory.value, settings.currency)}.
        </p>
      )}
    </div>
  );
}
