"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell, Download, Monitor, Moon, Sun, Trash2, Upload } from "lucide-react";
import { Settings, SpendlyState } from "@/types";
import { CURRENCIES, getCurrencyMeta } from "@/lib/constants";
import { CatMark, ConfirmDialog, inputCls } from "./ui";

export function SettingsPage({
  state,
  onUpdateSettings,
  onExport,
  onImport,
  onDeleteAll,
  notify,
}: {
  state: SpendlyState;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onDeleteAll: () => void;
  notify: (msg: string, type?: "success" | "error") => void;
}) {
  const { settings } = state;
  const [budgetInput, setBudgetInput] = useState(String(settings.weeklyBudget));
  const [confirmWipe, setConfirmWipe] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setBudgetInput(String(settings.weeklyBudget)), [settings.weeklyBudget]);

  function saveBudget() {
    const v = parseFloat(budgetInput);
    if (v >= 0) {
      onUpdateSettings({ weeklyBudget: v });
      notify("Weekly budget updated ✓");
    }
  }

  function requestNotifications() {
    if (!("Notification" in window)) {
      notify("Notifications aren't supported in this browser", "error");
      return;
    }
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        onUpdateSettings({ reminder: { ...settings.reminder, enabled: true } });
        notify("Reminders enabled ✓");
      } else {
        notify("Notifications are blocked — enable them in your browser's site settings to get reminders.", "error");
      }
    });
  }

  return (
    <div className="pb-24 sm:pb-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-stone-50 mb-6 font-display">Settings</h1>

      <SettingsSection title="Weekly Budget">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{getCurrencyMeta(settings.currency).symbol}</span>
            <input type="number" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} className={`${inputCls} pl-7`} />
          </div>
          <button onClick={saveBudget} className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium">
            Save
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title="Currency">
        <div className="grid grid-cols-4 gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => onUpdateSettings({ currency: c.code })}
              className={`py-2.5 rounded-xl border text-sm font-medium ${
                settings.currency === c.code ? "border-teal-600 bg-teal-50 dark:bg-teal-950 text-teal-700" : "border-slate-200 dark:border-stone-700 text-slate-500 dark:text-stone-400"
              }`}
            >
              {c.symbol} {c.code}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Reminders">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-900 dark:text-stone-50">Daily reminder to log expenses</span>
          </div>
          <button
            onClick={() => {
              if (!settings.reminder.enabled) requestNotifications();
              else onUpdateSettings({ reminder: { ...settings.reminder, enabled: false } });
            }}
            className={`w-11 h-6 rounded-full relative transition-colors ${settings.reminder.enabled ? "bg-teal-600" : "bg-slate-200 dark:bg-stone-700"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.reminder.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        {settings.reminder.enabled && (
          <div className="grid grid-cols-2 gap-2">
            <input type="time" value={settings.reminder.time} onChange={(e) => onUpdateSettings({ reminder: { ...settings.reminder, time: e.target.value } })} className={inputCls} />
            <select
              value={settings.reminder.frequency}
              onChange={(e) => onUpdateSettings({ reminder: { ...settings.reminder, frequency: e.target.value as Settings["reminder"]["frequency"] } })}
              className={inputCls}
            >
              <option value="daily">Every day</option>
              <option value="weekdays">Weekdays only</option>
              <option value="weekly">Once a week</option>
            </select>
          </div>
        )}
        <p className="text-xs text-slate-400 dark:text-stone-500 mt-2">&quot;Don&apos;t forget to add today&apos;s expenses 📝&quot; — sent as a browser notification.</p>
      </SettingsSection>

      <SettingsSection title="Theme">
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "light" as const, label: "Light", icon: Sun },
            { id: "dark" as const, label: "Dark", icon: Moon },
            { id: "system" as const, label: "System", icon: Monitor },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => onUpdateSettings({ theme: t.id })}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium ${
                settings.theme === t.id ? "border-teal-600 bg-teal-50 dark:bg-teal-950 text-teal-700" : "border-slate-200 dark:border-stone-700 text-slate-500 dark:text-stone-400"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Data">
        <div className="flex flex-col gap-2">
          <button onClick={onExport} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 text-sm font-medium text-slate-900 dark:text-stone-50 hover:bg-slate-50 dark:hover:bg-stone-800">
            <Download className="w-4 h-4" /> Export Data
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 text-sm font-medium text-slate-900 dark:text-stone-50 hover:bg-slate-50 dark:hover:bg-stone-800"
          >
            <Upload className="w-4 h-4" /> Import Data
          </button>
          <input
            type="file"
            ref={fileRef}
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = "";
            }}
          />
          <button onClick={() => setConfirmWipe(true)} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 text-sm font-medium text-rose-600 hover:bg-rose-50">
            <Trash2 className="w-4 h-4" /> Delete All Data
          </button>
        </div>
      </SettingsSection>

      <div className="text-center text-xs text-slate-300 dark:text-stone-600 mt-8 flex flex-col items-center gap-2">
        <CatMark className="w-10 h-10 opacity-60" />
        Spendly · made for tracking the week, not the spreadsheet
      </div>

      <ConfirmDialog
        open={confirmWipe}
        title="Delete all data?"
        message="This permanently removes every transaction, regular expense, and setting. This can't be undone."
        confirmLabel="Delete Everything"
        danger
        onCancel={() => setConfirmWipe(false)}
        onConfirm={() => {
          onDeleteAll();
          setConfirmWipe(false);
        }}
      />
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-sm font-semibold text-slate-900 dark:text-stone-50 mb-2.5">{title}</p>
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-100 dark:border-stone-800 p-4">{children}</div>
    </div>
  );
}
