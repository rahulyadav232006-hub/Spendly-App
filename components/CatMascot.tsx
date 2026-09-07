"use client";

import Image from "next/image";
import React from "react";

// Actual pixel dimensions of /public/spendly-cat.png — used so next/image
// can reserve the right space up front (no layout shift) without needing
// a webpack static import of a file that lives in /public.
const CAT_WIDTH = 400;
const CAT_HEIGHT = 410;

/**
 * The Spendly mascot — the cat image provided for branding, wired through
 * next/image so it's automatically optimized (resized/served as needed)
 * without shipping a large source file on every page.
 *
 * `decorative` (default) sets alt="" so screen readers skip it wherever
 * it's just flavor next to a message that already says the same thing
 * (empty states, onboarding). Pass `decorative={false}` for the one place
 * it acts as the actual brand mark (header logo) so it announces "Spendly".
 */
export function CatMascot({
  size = 64,
  className = "",
  decorative = true,
  priority = false,
}: {
  size?: number;
  className?: string;
  decorative?: boolean;
  priority?: boolean;
}) {
  const height = Math.round((size * CAT_HEIGHT) / CAT_WIDTH);
  return (
    <Image
      src="/spendly-cat.png"
      alt={decorative ? "" : "Spendly"}
      width={size}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
