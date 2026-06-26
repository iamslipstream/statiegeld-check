"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LOCATIONS,
  STATUS_META,
  STATUS_ORDER,
  type AppData,
  type LocationBoard,
} from "@/lib/types";
import { timeAgo, clockLabel } from "@/lib/time";

const EMPTY: LocationBoard = { latest: null, reports: [] };
const ONE_HOUR_MS = 60 * 60 * 1000;

export function BottleStatusWidget({ initial }: { initial: AppData }) {
  const [data, setData] = useState<AppData>(initial);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      if (res.ok) setData((await res.json()) as AppData);
    } catch {
      /* keep last good data */
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const report = async (locationId: string, status: string) => {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: locationId, status }),
      });
      if (res.ok) setData((await res.json()) as AppData);
    } catch {
      /* ignore */
    }
  };

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="flex flex-col gap-4">
      {LOCATIONS.map((loc) => {
        const board = data.boards[loc.id] ?? EMPTY;
        const meta = board.latest ? STATUS_META[board.latest.status] : null;
        const recentCount = board.reports.filter(
          (r) => data.now - r.ts < ONE_HOUR_MS
        ).length;
        const isOpen = !!expanded[loc.id];

        return (
          <div
            key={loc.id}
            className="flex flex-col gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
          >
            {/* Machine name */}
            <p className="text-sm font-bold text-zinc-200">{loc.name}</p>

            {/* Current status */}
            <div
              className={`rounded-xl p-3 text-center ring-1 ${
                meta
                  ? `${meta.bg} ${meta.ring}`
                  : "bg-white/5 ring-white/10"
              }`}
            >
              <span className="text-3xl" aria-hidden>
                {meta ? meta.emoji : "🤷"}
              </span>
              <p
                className={`mt-1 text-sm font-semibold ${
                  meta ? meta.text : "text-zinc-500"
                }`}
              >
                {meta ? meta.headline : "No reports yet"}
              </p>
              {board.latest && (
                <p className="mt-0.5 text-xs text-zinc-500">
                  {timeAgo(board.latest.ts, data.now)}
                </p>
              )}
            </div>

            {/* Report buttons — generous tap targets */}
            <div className="flex gap-2">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => report(loc.id, s)}
                  className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl py-4 text-sm font-semibold transition-colors ${STATUS_META[s].button}`}
                >
                  <span className="text-2xl" aria-hidden>
                    {STATUS_META[s].emoji}
                  </span>
                  <span>{STATUS_META[s].label}</span>
                </button>
              ))}
            </div>

            {/* History — collapsed by default */}
            {board.reports.length > 0 && (
              <div>
                <button
                  onClick={() => toggle(loc.id)}
                  className="flex w-full items-center justify-between py-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  <span>
                    {recentCount > 0
                      ? `${recentCount} report${recentCount !== 1 ? "s" : ""} in the last hour`
                      : `${board.reports.length} report${board.reports.length !== 1 ? "s" : ""} (older)`}
                  </span>
                  <span className="font-medium">
                    {isOpen ? "↑ Hide" : "↓ Show history"}
                  </span>
                </button>

                {isOpen && (
                  <ul className="mt-1 divide-y divide-white/5 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                    {board.reports.slice(0, 5).map((r) => {
                      const rm = STATUS_META[r.status];
                      return (
                        <li
                          key={r.id}
                          className="flex items-center gap-2 px-3 py-2 text-xs"
                        >
                          <span aria-hidden>{rm.emoji}</span>
                          <span className={`font-medium ${rm.text}`}>
                            {rm.label}
                          </span>
                          <span className="ml-auto tabular-nums text-zinc-600">
                            {clockLabel(r.ts)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
