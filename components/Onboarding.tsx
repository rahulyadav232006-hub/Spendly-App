"use client";

import React, { useState } from "react";
import { INCOME_SOURCES } from "@/lib/constants";
import { CatMark } from "./ui";

export function Onboarding({
  onFinish,
}: {
  onFinish: (data: { weeklyBudget: number; initialAmount: number; source: string }) => void;
}) {
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState("4000");
  const [initialAmount, setInitialAmount] = useState("");
  const [source, setSource] = useState(INCOME_SOURCES[0].id);

  const steps = [
    { title: "Welcome to Spendly", body: "A simple way to see what's left of your money this week — nothing more complicated than that." },
    { title: "Set your weekly budget", body: "How much do you usually plan to spend in a week? You can change this anytime." },
    { title: "Add your available money", body: "Got money on hand already? Add it now so your balance starts accurate." },
  ];

  function finish() {
    onFinish({ weeklyBudget: parseFloat(budget) || 0, initialAmount: parseFloat(initialAmount) || 0, source });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-teal-50 to-white dark:from-stone-950 dark:to-stone-900">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <CatMark className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-stone-50 font-display">
            {steps[step].title} {step === 0 && "🐱"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-stone-400 mt-2">{steps[step].body}</p>
        </div>

        {step === 1 && (
          <div className="mb-6">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
              <input
                autoFocus
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full text-center text-3xl font-bold py-4 pl-8 rounded-2xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-50 font-display"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mb-6">
            <div className="relative mb-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
              <input
                autoFocus
                type="number"
                placeholder="0"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="w-full text-center text-3xl font-bold py-4 pl-8 rounded-2xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-50 font-display"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {INCOME_SOURCES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSource(s.id)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium ${
                    source === s.id ? "border-teal-600 bg-teal-50 dark:bg-teal-950 text-teal-700" : "border-slate-200 dark:border-stone-700 text-slate-500 dark:text-stone-400"
                  }`}
                >
                  <span>{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 justify-center mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-teal-700" : "w-1.5 bg-slate-200 dark:bg-stone-700"}`} />
          ))}
        </div>

        <button onClick={() => (step < steps.length - 1 ? setStep(step + 1) : finish())} className="w-full py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium">
          {step < steps.length - 1 ? "Continue" : "Start Tracking"}
        </button>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="w-full py-3 text-sm text-slate-400 dark:text-stone-500 mt-1">
            Back
          </button>
        )}
      </div>
    </div>
  );
}
