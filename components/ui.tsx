"use client";

import React from "react";
import { AlertTriangle, Check, X } from "lucide-react";

export function IconBubble({ emoji, size = "w-10 h-10", tone }: { emoji?: string; size?: string; tone?: string }) {
  return (
    <div className={`${size} rounded-full flex items-center justify-center text-lg shrink-0`} style={{ backgroundColor: tone ? `${tone}1f` : "#f4f4f5" }}>
      {emoji}
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-md bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-sheet-up"
        style={{ maxHeight: "88vh" }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-stone-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-stone-800">
            <X className="w-5 h-5 text-slate-900 dark:text-stone-50" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 dark:border-stone-800">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center px-4" style={{ zIndex: 60 }}>
      <div className="absolute inset-0 bg-slate-900/50" onClick={onCancel} />
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-full ${danger ? "bg-rose-100" : "bg-teal-100"}`}>
            <AlertTriangle className={`w-5 h-5 ${danger ? "text-rose-600" : "text-teal-600"}`} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-stone-50">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-stone-400 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-medium text-white ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-teal-700 hover:bg-teal-800"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface ToastState {
  message: string;
  type: "success" | "error";
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <div
      className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 px-4 py-3 rounded-2xl bg-slate-900 text-white text-sm font-medium shadow-xl flex items-center gap-2 animate-toast-in"
      style={{ zIndex: 70 }}
    >
      {toast.type === "success" && <Check className="w-4 h-4 text-emerald-400" />}
      {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
      <span>{toast.message}</span>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-slate-600 dark:text-stone-400 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-rose-500 mt-1">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400";

export function BudgetRing({ percent, size = 132 }: { percent: number; size?: number }) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(percent, 100);
  const over = percent > 100;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={stroke} fill="none" className="text-slate-100 dark:text-stone-800" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={over ? "#e11d48" : "#0f766e"}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c - (clamped / 100) * c}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 p-4 mb-4">
      <p className="text-sm font-semibold text-slate-900 dark:text-stone-50 mb-3">{title}</p>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone?: "rose" | "teal";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 p-4">
      <p className="text-xs text-slate-400 dark:text-stone-500 mb-1">{label}</p>
      <p className={`text-lg font-bold flex items-center gap-1 text-slate-900 dark:text-stone-50 ${tone === "rose" ? "!text-rose-600" : tone === "teal" ? "!text-teal-700" : ""}`}>
        {Icon && <Icon className="w-4 h-4" />}
        {value}
      </p>
    </div>
  );
}

export function EmptyMini({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 dark:text-stone-500 text-center py-8">{text}</p>;
}
