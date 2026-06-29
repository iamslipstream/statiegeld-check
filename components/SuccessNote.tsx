"use client";

import { useEffect } from "react";

/**
 * A short-lived confirmation shown after a successful post. Auto-dismisses so
 * it never lingers, and is announced to assistive tech via role="status".
 */
export function SuccessNote({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 6000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200 ring-1 ring-emerald-400/25"
    >
      <span aria-hidden>🎉</span>
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-emerald-300/80 transition-colors hover:text-emerald-100"
      >
        ✕
      </button>
    </div>
  );
}
