"use client";

import React from "react";
import { BarChart3, Home, List, Plus, Repeat, Settings as SettingsIcon } from "lucide-react";
import { CatMascot } from "./CatMascot";

export type PageId = "dashboard" | "insights" | "transactions" | "regular" | "settings";

export const NAV_ITEMS: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "transactions", label: "Transactions", icon: List },
  { id: "regular", label: "Regular", icon: Repeat },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar({ page, setPage }: { page: PageId; setPage: (p: PageId) => void }) {
  return (
    <aside className="hidden sm:flex flex-col w-60 shrink-0 border-r border-slate-100 dark:border-stone-800 px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <CatMascot size={32} decorative={false} priority />
        <span className="font-bold text-lg text-slate-900 dark:text-stone-50 font-display">Spendly</span>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              page === item.id ? "bg-teal-50 dark:bg-teal-950 text-teal-700" : "text-slate-500 dark:text-stone-400 hover:bg-slate-50 dark:hover:bg-stone-800"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="sm:hidden flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-stone-800 bg-white dark:bg-stone-900 sticky top-0 z-20">
      <CatMascot size={28} decorative={false} priority />
      <span className="font-bold text-base text-slate-900 dark:text-stone-50 font-display">Spendly</span>
    </header>
  );
}

export function BottomNav({ page, setPage, onAdd }: { page: PageId; setPage: (p: PageId) => void; onAdd: () => void }) {
  const left = NAV_ITEMS.slice(0, 2);
  const right = NAV_ITEMS.slice(2);
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-stone-900 border-t border-slate-100 dark:border-stone-800 px-2 pt-1.5 pb-3 z-40">
      <div className="flex items-center justify-between">
        {left.map((item) => (
          <NavBtn key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} />
        ))}
        <button onClick={onAdd} className="w-14 h-14 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-lg -mt-6 shrink-0" aria-label="Add expense">
          <Plus className="w-6 h-6" />
        </button>
        {right.map((item) => (
          <NavBtn key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} />
        ))}
      </div>
    </nav>
  );
}

function NavBtn({
  item,
  active,
  onClick,
}: {
  item: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 px-2 py-1.5" style={{ minWidth: 54 }}>
      <item.icon className={`w-5 h-5 ${active ? "text-teal-700" : "text-slate-400"}`} />
      <span className={`text-[10px] font-medium ${active ? "text-teal-700" : "text-slate-400"}`}>{item.label}</span>
    </button>
  );
}
