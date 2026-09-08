import { ReminderSettings } from "@/types";

function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Returns the next Date the reminder should fire, strictly after `from`,
 * honoring frequency (daily / weekdays / weekly) — or null if reminders
 * are disabled or the time string is invalid. Always computed fresh from
 * the current wall-clock time rather than a stored "next fire" timestamp,
 * so it self-corrects on every app open (survives refresh/reload) and
 * isn't thrown off by DST shifts or the device clock changing.
 */
export function getNextReminderDate(reminder: ReminderSettings, from: Date = new Date()): Date | null {
  if (!reminder.enabled) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(reminder.time || "");
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const candidate = new Date(from);
  candidate.setHours(hours, minutes, 0, 0);
  if (candidate.getTime() <= from.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }

  if (reminder.frequency === "weekdays") {
    // getDay(): 0 = Sunday, 6 = Saturday
    while (candidate.getDay() === 0 || candidate.getDay() === 6) {
      candidate.setDate(candidate.getDate() + 1);
    }
  } else if (reminder.frequency === "weekly") {
    // Fire once a week, aligned with Spendly's Monday week-start.
    while (candidate.getDay() !== 1) {
      candidate.setDate(candidate.getDate() + 1);
    }
  }

  return candidate;
}

function isValidDay(reminder: ReminderSettings, date: Date): boolean {
  if (reminder.frequency === "weekdays") return date.getDay() !== 0 && date.getDay() !== 6;
  if (reminder.frequency === "weekly") return date.getDay() === 1;
  return true; // daily
}

/**
 * Is a reminder actually due right now? True when: today is a valid day
 * for the configured frequency, the configured time-of-day has already
 * passed, and we haven't already fired one today. This is what lets a
 * reminder "catch up" — if the user opens the app at 9pm with the
 * reminder set for 8pm, it still fires once, rather than only ever firing
 * at the exact second the clock hits the target (which requires the app
 * to be open at that exact instant).
 */
export function isReminderDue(reminder: ReminderSettings, now: Date = new Date()): boolean {
  if (!reminder.enabled) return false;
  if (firedToday(reminder, now)) return false;
  if (!isValidDay(reminder, now)) return false;
  const match = /^(\d{1,2}):(\d{2})$/.exec(reminder.time || "");
  if (!match) return false;
  const target = new Date(now);
  target.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return now.getTime() >= target.getTime();
}

/** Whether a reminder notification has already fired today (local time). */
export function firedToday(reminder: ReminderSettings, now: Date = new Date()): boolean {
  return reminder.lastFiredDate === toDateKey(now);
}

export function dateKeyFor(d: Date): string {
  return toDateKey(d);
}
