"use client";

import { useEffect, useRef } from "react";
import { ReminderSettings } from "@/types";
import { dateKeyFor, getNextReminderDate, isReminderDue } from "@/lib/reminders";
import { fireReminderNotification } from "@/lib/notify";

// setTimeout is capped at ~24.8 days and can drift or get throttled while a
// tab is backgrounded, so on top of scheduling the "exact" timeout we also
// re-check every minute — whichever fires first wins, and firedToday()
// guards against firing twice.
const SAFETY_CHECK_MS = 60_000;

/**
 * Schedules Spendly's daily reminder notification. Re-runs whenever the
 * reminder settings change (enabled/time/frequency). Because the next fire
 * time is always recomputed from the current settings + current clock —
 * never stored as an absolute timestamp — reloading the page, closing and
 * reopening the app, or the settings changing all "just work" without any
 * special resume logic.
 */
export function useReminderScheduler(reminder: ReminderSettings, onFired: (dateKey: string) => void) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFiredRef = useRef(onFired);
  onFiredRef.current = onFired;

  useEffect(() => {
    if (!reminder.enabled) return;

    let cancelled = false;

    const tryFire = async () => {
      if (cancelled) return;
      const now = new Date();
      // isReminderDue re-checks everything from scratch (enabled, correct
      // weekday for the frequency, time-of-day has passed, not already
      // fired today) — tryFire gets invoked far more often than "exactly
      // when due" (capped timeout, 60s safety interval, tab refocus), so
      // firing must be gated on the real due-check, not just "has it fired
      // today", or it would go off as soon as any of those wake-ups happen.
      if (isReminderDue(reminder, now)) {
        const ok = await fireReminderNotification();
        if (ok) onFiredRef.current(dateKeyFor(now));
      }
      scheduleNext();
    };

    const scheduleNext = () => {
      if (cancelled) return;
      const next = getNextReminderDate(reminder, new Date());
      if (!next) return;
      const delay = Math.max(1000, next.getTime() - Date.now());
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(tryFire, Math.min(delay, SAFETY_CHECK_MS * 30));
    };

    scheduleNext();
    // Catch up immediately if the reminder time already passed earlier
    // today (e.g. set for 8am, user opens the app at 9pm) — without this,
    // a due reminder would sit unfired until the next capped timeout or
    // safety-interval tick, up to 30 minutes later.
    tryFire();

    const safetyInterval = setInterval(() => {
      const next = getNextReminderDate(reminder, new Date());
      if (next && next.getTime() - Date.now() <= 0) tryFire();
    }, SAFETY_CHECK_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") tryFire();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      clearInterval(safetyInterval);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminder.enabled, reminder.time, reminder.frequency]);
}
