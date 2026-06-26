"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The heatwave reminder auto-retires at 8 PM Amsterdam time on Mon 29 Jun 2026
 * (CEST = UTC+2). After this instant the toast never shows again, so the
 * feature switches itself off with no deploy needed.
 */
const EXPIRES_AT = Date.parse("2026-06-29T20:00:00+02:00");

/**
 * A playful heat-advisory toast that slides in every time the app opens,
 * reminding neighbours to stay cool during the Amsterdam heat. Auto-dismisses
 * and can be closed manually. Stops showing for good after EXPIRES_AT.
 */
export function HeatGreeting() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const dismiss = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => setShow(false), 350);
  }, []);

  useEffect(() => {
    if (Date.now() >= EXPIRES_AT) return;

    setShow(true);
    const t = window.setTimeout(dismiss, 11000);
    return () => window.clearTimeout(t);
  }, [dismiss]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3">
      <div
        role="status"
        className={`pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-rose-500/15 px-4 py-3 shadow-lg shadow-amber-900/30 backdrop-blur-md ${
          leaving ? "heat-leaving" : "heat-drop-in"
        }`}
      >
        {/* moving sheen across the card */}
        <span className="heat-shimmer pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative flex items-center gap-3">
          <span className="heat-spin-slow shrink-0 text-2xl" aria-hidden>
            ☀️
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-100">
              It&apos;s a scorcher in Amsterdam{" "}
              <span className="heat-wiggle" aria-hidden>
                🥵
              </span>
            </p>
            <p className="text-xs text-amber-200/80">
              Keep hydrated, stay cool, and take care of yourself.
              <span className="heat-bob ml-1 inline-block" aria-hidden>
                💧
              </span>
            </p>
          </div>

          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-full p-1 text-amber-200/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
