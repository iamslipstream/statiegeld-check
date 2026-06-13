"use client";

import {
  STATUS_META,
  STALE_AFTER_MS,
  type Report,
} from "@/lib/types";
import { timeAgo } from "@/lib/time";

export function StatusCard({
  latest,
  now,
}: {
  latest: Report | null;
  now: number;
}) {
  if (!latest) {
    return (
      <section className="rounded-3xl bg-white/5 p-8 text-center ring-1 ring-white/10">
        <div className="text-5xl" aria-hidden>
          🤷
        </div>
        <h2 className="mt-4 text-xl font-semibold text-zinc-100">
          No reports yet
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Be the first to let your neighbours know how the machine is doing.
        </p>
      </section>
    );
  }

  const meta = STATUS_META[latest.status];
  const isStale = now - latest.ts > STALE_AFTER_MS;

  return (
    <section
      className={`rounded-3xl ${meta.bg} p-8 text-center ring-1 ${meta.ring} transition-colors`}
      aria-live="polite"
    >
      <div className="text-6xl leading-none" aria-hidden>
        {meta.emoji}
      </div>
      <h2 className={`mt-4 text-2xl font-bold ${meta.text}`}>
        {meta.headline}
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        Last report {timeAgo(latest.ts, now)}
      </p>

      {isStale && (
        <p className="mx-auto mt-4 max-w-xs rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-300 ring-1 ring-amber-400/20">
          ⚠️ This was a while ago — it might be outdated. If you check it,
          tap a status below to refresh it for everyone.
        </p>
      )}
    </section>
  );
}
