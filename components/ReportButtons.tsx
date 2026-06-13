"use client";

import { STATUS_META, STATUS_ORDER, type StatusKey } from "@/lib/types";

export function ReportButtons({
  onReport,
  pending,
}: {
  onReport: (status: StatusKey) => void;
  pending: StatusKey | null;
}) {
  return (
    <section>
      <h3 className="mb-3 text-center text-sm font-medium text-zinc-400">
        At the machine right now? Tap what you see:
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {STATUS_ORDER.map((key) => {
          const meta = STATUS_META[key];
          const isPending = pending === key;
          const disabled = pending !== null;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onReport(key)}
              className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl px-4 py-5 text-sm font-semibold transition ${meta.button} disabled:opacity-50`}
              aria-label={`Report: ${meta.label}`}
            >
              <span className="text-3xl" aria-hidden>
                {isPending ? "…" : meta.emoji}
              </span>
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
