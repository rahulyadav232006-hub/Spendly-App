const REMINDER_TITLE = "Spendly";
const REMINDER_BODY = "Don't forget to add today's expenses 📝";

/**
 * Shows the actual reminder notification. Prefers going through the
 * service worker (navigator.serviceWorker.ready → registration.showNotification):
 * this is required on Android Chrome, where calling `new Notification()`
 * directly throws once a service worker is registered for the origin, and
 * it also means the notification can still be shown while the app is
 * backgrounded (not just while the tab has focus). Falls back to the
 * main-thread Notification API when no service worker is available
 * (e.g. localhost in development, where we intentionally don't register
 * one — see components/RegisterSW.tsx).
 */
export async function fireReminderNotification(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  if ("serviceWorker" in navigator) {
    try {
      // navigator.serviceWorker.ready never resolves if no service worker
      // is ever registered for this origin (e.g. localhost in development,
      // where RegisterSW intentionally skips registration — see
      // components/RegisterSW.tsx). Race it against a short timeout so
      // dev mode falls through to the plain Notification API below instead
      // of hanging forever.
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
      ]);
      if (registration) {
        await registration.showNotification(REMINDER_TITLE, {
          body: REMINDER_BODY,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: "spendly-daily-reminder",
        });
        return true;
      }
    } catch {
      // Fall through to the main-thread API below.
    }
  }

  try {
    new Notification(REMINDER_TITLE, { body: REMINDER_BODY, icon: "/icons/icon-192.png" });
    return true;
  } catch {
    return false;
  }
}
