"use client";

import React, { useEffect, useState } from "react";
import { Mic, MessageSquare, Pencil } from "lucide-react";
import { Category, Transaction } from "@/types";
import { formatMoney, formatDayLabel, parseQuickPrompt, ParsedExpense } from "@/lib/utils";
import { getCurrencyMeta } from "@/lib/constants";
import { Field, Sheet, inputCls } from "./ui";

// Minimal ambient types for the Web Speech API (not in default TS DOM lib).
interface SpeechRecognitionResultEvent extends Event {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  onresult: ((e: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type AddExpenseData = Omit<Transaction, "id" | "createdAt">;

export function AddExpenseModal({
  open,
  onClose,
  onSave,
  categories,
  currency,
  notify,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: AddExpenseData) => void;
  categories: Category[];
  currency: string;
  notify: (msg: string) => void;
}) {
  const [mode, setMode] = useState<"manual" | "prompt" | "voice">("manual");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "other");
  const [dateTime, setDateTime] = useState(() => toLocalInputValue(new Date()));
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; description?: string; dateTime?: string }>({});

  const [promptText, setPromptText] = useState("");
  const [parsed, setParsed] = useState<ParsedExpense | null>(null);
  const [missingField, setMissingField] = useState<"amount" | "description" | null>(null);

  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  useEffect(() => {
    if (open) {
      setMode("manual");
      setAmount("");
      setDescription("");
      setCategoryId(categories[0]?.id || "other");
      setDateTime(toLocalInputValue(new Date()));
      setNote("");
      setErrors({});
      setPromptText("");
      setParsed(null);
      setMissingField(null);
      setVoiceTranscript("");
      setListening(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toLocalInputValue(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function submitManual() {
    const amt = parseFloat(amount);
    const errs: typeof errors = {};
    if (!amt || amt <= 0) errs.amount = "Enter an amount greater than 0";
    if (!description.trim()) errs.description = "Give it a short name";
    if (!dateTime) errs.dateTime = "Pick a date";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ type: "expense", amount: amt, description: description.trim(), category: categoryId, dateTime: new Date(dateTime).toISOString(), note: note.trim() });
    notify("Expense added successfully ✓");
    onClose();
  }

  function runParse(text: string) {
    const result = parseQuickPrompt(text, categories);
    setParsed(result);
    if (result.missing.amount) setMissingField("amount");
    else if (result.missing.description) setMissingField("description");
    else setMissingField(null);
  }

  function confirmParsed() {
    if (!parsed || !parsed.amount || parsed.amount <= 0 || !parsed.description) return;
    onSave({ type: "expense", amount: parsed.amount, description: parsed.description, category: parsed.categoryId || "other", dateTime: parsed.date.toISOString(), note: "" });
    notify("Expense added successfully ✓");
    onClose();
  }

  function startVoice() {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setVoiceSupported(false);
      return;
    }
    try {
      const rec = new SR();
      rec.lang = "en-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      setListening(true);
      setVoiceTranscript("");
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setVoiceTranscript(text);
        const result = parseQuickPrompt(text, categories);
        setParsed(result);
        setMissingField(result.missing.amount ? "amount" : result.missing.description ? "description" : null);
        setListening(false);
      };
      rec.onerror = () => {
        setListening(false);
        setVoiceSupported(false);
      };
      rec.onend = () => setListening(false);
      rec.start();
    } catch {
      setVoiceSupported(false);
      setListening(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add expense">
      <div className="flex gap-2 mb-5 bg-slate-100 dark:bg-stone-800 p-1 rounded-xl">
        {[
          { id: "manual" as const, label: "Manual", icon: Pencil },
          { id: "prompt" as const, label: "Quick Prompt", icon: MessageSquare },
          { id: "voice" as const, label: "Voice", icon: Mic },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === t.id ? "bg-white dark:bg-stone-700 shadow text-teal-700" : "text-slate-500 dark:text-stone-400"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {mode === "manual" && (
        <div>
          <Field label="Amount" hint={errors.amount}>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{getCurrencyMeta(currency).symbol}</span>
              <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={`${inputCls} pl-7`} />
            </div>
          </Field>
          <Field label="Expense name" hint={errors.description}>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Lunch" className={inputCls} />
          </Field>
          <Field label="Category">
            <div className="grid grid-cols-4 gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                    categoryId === c.id ? "border-teal-600 bg-teal-50 dark:bg-teal-950 text-teal-700" : "border-slate-200 dark:border-stone-700 text-slate-500 dark:text-stone-400"
                  }`}
                >
                  <span className="text-lg">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Date & time" hint={errors.dateTime}>
            <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Note (optional)">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" className={inputCls} />
          </Field>
          <button onClick={submitManual} className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm mt-1">
            Save Expense
          </button>
        </div>
      )}

      {mode === "prompt" && (
        <div>
          <Field label="Describe your expense">
            <input
              autoFocus
              value={promptText}
              onChange={(e) => {
                setPromptText(e.target.value);
                if (e.target.value.trim()) runParse(e.target.value);
                else setParsed(null);
              }}
              placeholder='Try "₹120 lunch" or "spent 250 on dinner"'
              className={inputCls}
            />
          </Field>
          {parsed && (
            <div className="rounded-2xl border border-slate-200 dark:border-stone-700 p-4 mt-2 bg-slate-50 dark:bg-stone-800">
              <p className="text-xs font-semibold text-slate-500 dark:text-stone-400 uppercase tracking-wide mb-3">Detected</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-stone-400">Amount</span>
                  {missingField === "amount" ? (
                    <input
                      autoFocus
                      type="number"
                      placeholder="Enter amount"
                      className="w-32 px-2 py-1 rounded-lg border border-rose-300 text-right text-sm"
                      onChange={(e) => setParsed((p) => (p ? { ...p, amount: parseFloat(e.target.value) || null } : p))}
                    />
                  ) : (
                    <span className="font-semibold text-slate-900 dark:text-stone-50">{formatMoney(parsed.amount || 0, currency)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-stone-400">Description</span>
                  {missingField === "description" ? (
                    <input
                      autoFocus={missingField === "description"}
                      placeholder="What was it for?"
                      className="w-40 px-2 py-1 rounded-lg border border-rose-300 text-right text-sm"
                      onChange={(e) => setParsed((p) => (p ? { ...p, description: e.target.value } : p))}
                    />
                  ) : (
                    <span className="font-semibold text-slate-900 dark:text-stone-50">{parsed.description}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-stone-400">Category</span>
                  <span className="font-semibold text-slate-900 dark:text-stone-50">
                    {(categories.find((c) => c.id === parsed.categoryId) || categories.find((c) => c.id === "other"))?.emoji}{" "}
                    {(categories.find((c) => c.id === parsed.categoryId) || categories.find((c) => c.id === "other"))?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-stone-400">Date</span>
                  <span className="font-semibold text-slate-900 dark:text-stone-50">{formatDayLabel(parsed.date)}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-stone-300 border border-slate-200 dark:border-stone-700">
                  Cancel
                </button>
                <button
                  onClick={confirmParsed}
                  disabled={!parsed.amount || !parsed.description}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-40"
                >
                  Save Expense
                </button>
              </div>
            </div>
          )}
          {!parsed && (
            <div className="text-center py-8 text-slate-400 dark:text-stone-500 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Type naturally — we'll figure out the rest.
            </div>
          )}
        </div>
      )}

      {mode === "voice" && (
        <div className="flex flex-col items-center py-4">
          {voiceSupported ? (
            <>
              <button
                onClick={startVoice}
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all ${listening ? "bg-rose-100 animate-pulse" : "bg-teal-100 dark:bg-teal-950"}`}
              >
                <Mic className={`w-8 h-8 ${listening ? "text-rose-600" : "text-teal-700"}`} />
              </button>
              <p className="text-sm text-slate-500 dark:text-stone-400 mb-4 text-center">
                {listening ? "Listening…" : voiceTranscript ? "Tap to try again" : 'Tap and say something like "Spent 120 rupees on lunch"'}
              </p>
              {voiceTranscript && !parsed && <p className="text-sm italic text-slate-400">&quot;{voiceTranscript}&quot;</p>}
              {parsed && (
                <div className="w-full rounded-2xl border border-slate-200 dark:border-stone-700 p-4 bg-slate-50 dark:bg-stone-800">
                  <p className="text-xs font-semibold text-slate-500 dark:text-stone-400 uppercase tracking-wide mb-3">Heard: &quot;{voiceTranscript}&quot;</p>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-stone-400">Amount</span>
                      <span className="font-semibold text-slate-900 dark:text-stone-50">{parsed.amount ? formatMoney(parsed.amount, currency) : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-stone-400">Description</span>
                      <span className="font-semibold text-slate-900 dark:text-stone-50">{parsed.description || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-stone-400">Category</span>
                      <span className="font-semibold text-slate-900 dark:text-stone-50">
                        {(categories.find((c) => c.id === parsed.categoryId) || categories.find((c) => c.id === "other"))?.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-stone-300 border border-slate-200 dark:border-stone-700">
                      Cancel
                    </button>
                    <button
                      onClick={confirmParsed}
                      disabled={!parsed.amount || !parsed.description}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-40"
                    >
                      Save Expense
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3">
                <Mic className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-stone-50 mb-1">Voice input isn&apos;t available here</p>
              <p className="text-xs text-slate-500 dark:text-stone-400 mb-4">Your browser doesn&apos;t support speech recognition, or the mic is blocked. Use Quick Prompt instead.</p>
              <button onClick={() => setMode("prompt")} className="px-4 py-2 rounded-xl bg-teal-700 text-white text-sm font-medium">
                Switch to Quick Prompt
              </button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
