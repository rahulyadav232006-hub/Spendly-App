"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    // Only register in production. In `next dev`, JS chunk filenames stay
    // stable across recompiles (no content hash), so a cache-first service
    // worker will keep serving an old cached bundle even after the source
    // changes — making code fixes look like they "didn't work". Production
    // builds hash filenames per build, so caching is safe there.
    if (process.env.NODE_ENV !== "production") {
      // Proactively unregister any service worker left over from a previous
      // session (e.g. before this fix), so localhost stops serving stale code.
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((reg) => reg.unregister());
        });
      }
      return;
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal — the app still works fully online without the service worker.
      });
    }
  }, []);
  return null;
}
