"use client";

import { STATUS_META, type Report } from "@/lib/types";
import { timeAgo, clockLabel } from "@/lib/time";

export function History({
  reports,
  now,
}: {
  reports: Report[];
  now: number;
}) {
  // Skip the first one — it's already shown big in the status card.
  const rest = reports.slice(1, 11);
  if (rest.length === 0) return null;

  return (
    <section>
      <h3 className="mb-3 text-sm font-medium text-zinc-400">Recent reports</h3>
      <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
        {rest.map((report) => {
          const meta = STATUS_META[report.status];
          return (
            <li
              key={report.id}
              className="flex items-center gap-3 px-4 py-3 text-sm"
            >
              <span className="text-xl" aria-hidden>
                {meta.emoji}
              </span>
              <span className={`font-medium ${meta.text}`}>{meta.label}</span>
              <span className="ml-auto text-right text-xs text-zinc-500">
                <span className="block">{timeAgo(report.ts, now)}</span>
                <span className="block tabular-nums text-zinc-600">
                  {clockLabel(report.ts)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
