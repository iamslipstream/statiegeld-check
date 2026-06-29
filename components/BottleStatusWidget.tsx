"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LOCATIONS,
  STATUS_META,
  STATUS_ORDER,
  type AppData,
  type LocationBoard,
  type StatusKey,
  type StatusMeta,
} from "@/lib/types";
import { timeAgo, clockLabel } from "@/lib/time";

const EMPTY: LocationBoard = { latest: null, reports: [] };
const ONE_HOUR_MS = 60 * 60 * 1000;
/** How many of the most recent reports feed the live confidence signal. */
const RECENT_WINDOW = 6;

interface Signal {
  /** Status accent (colours, emoji) for the computed majority. */
  meta: StatusMeta;
  /** Human summary, e.g. "5 of the last 6 neighbours said working". */
  summary: string;
  /** Freshness dot colour, derived from how recent the newest report is. */
  dot: string;
}

/**
 * Derive a live signal from the most recent reports instead of trusting a
 * single (possibly stale) timestamp. The majority of the last few reports sets
 * the tint and headline; the newest report's age sets the freshness dot.
 */
function computeSignal(board: LocationBoard, now: number): Signal | null {
  const latest = board.latest;
  if (!latest) return null;

  const recent = board.reports.slice(0, RECENT_WINDOW);
  const working = recent.filter((r) => r.status === "working").length;
  const broken = recent.length - working;
  // On a tie the newest report breaks it — the freshest read wins.
  const majority: StatusKey =
    working === broken
      ? latest.status
      : working > broken
        ? "working"
        : "broken";

  const agree = majority === "working" ? working : broken;
  const label = majority === "working" ? "working" : "not working";

  let summary: string;
  if (recent.length === 1) {
    summary = `Last report says ${label}`;
  } else if (agree === recent.length) {
    summary = `All ${recent.length} recent reports say ${label}`;
  } else {
    summary = `${agree} of the last ${recent.length} neighbours said ${label}`;
  }

  const age = now - latest.ts;
  const dot =
    age < ONE_HOUR_MS
      ? "bg-emerald-400"
      : age < 6 * ONE_HOUR_MS
        ? "bg-amber-400"
        : "bg-zinc-500";

  return { meta: STATUS_META[majority], summary, dot };
}

/** Monochrome icon for the report buttons — inherits the button's text colour. */
function ButtonIcon({ status }: { status: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {status === "working" ? (
        <path d="M4 12.5l5 5L20 6.5" />
      ) : (
        <path d="M6 6l12 12M18 6L6 18" />
      )}
    </svg>
  );
}

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
    <div className="flex flex-col gap-3">
      {LOCATIONS.map((loc) => {
        const board = data.boards[loc.id] ?? EMPTY;
        const signal = computeSignal(board, data.now);
        const recentCount = board.reports.filter(
          (r) => data.now - r.ts < ONE_HOUR_MS
        ).length;
        const isOpen = !!expanded[loc.id];

        return (
          <div
            key={loc.id}
            className="flex flex-col gap-2.5 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10"
          >
            {/* Machine name */}
            <p className="text-sm font-bold text-zinc-200">{loc.name}</p>

            {/* Live confidence signal — majority of the most recent reports,
                not a single (possibly stale) report. */}
            <div
              className={`flex items-center justify-center gap-2.5 rounded-xl border-l-2 px-3 py-2.5 text-center ${
                signal
                  ? `${signal.meta.bg} ${signal.meta.border}`
                  : "border-white/10 bg-white/5"
              }`}
              aria-live="polite"
            >
              <span className="text-2xl leading-none" aria-hidden>
                {signal ? signal.meta.emoji : "🤷"}
              </span>
              <div className="text-left">
                <p
                  className={`text-sm font-semibold ${
                    signal ? signal.meta.text : "text-zinc-400"
                  }`}
                >
                  {signal ? signal.summary : "No reports yet"}
                </p>
                {board.latest && signal && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${signal.dot}`}
                      aria-hidden
                    />
                    last report {timeAgo(board.latest.ts, data.now)}
                  </p>
                )}
              </div>
            </div>

            {/* Report prompt + buttons — generous tap targets */}
            <p className="px-0.5 text-xs font-medium text-zinc-400">
              Is it working right now? Tap to report:
            </p>
            <div className="flex gap-2">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => report(loc.id, s)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${STATUS_META[s].button}`}
                >
                  <ButtonIcon status={s} />
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
