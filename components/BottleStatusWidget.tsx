"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LOCATIONS,
  STATUS_META,
  STATUS_ORDER,
  type AppData,
  type LocationBoard,
  type StatusMeta,
} from "@/lib/types";
import { timeAgo, clockLabel } from "@/lib/time";

const EMPTY: LocationBoard = { latest: null, reports: [] };
const ONE_HOUR_MS = 60 * 60 * 1000;

interface Signal {
  /** Status accent (colours, emoji) for the latest report. */
  meta: StatusMeta;
  /** Headline, e.g. "Working" or "Not working". */
  summary: string;
  /** Freshness dot colour, derived from how recent the newest report is. */
  dot: string;
}

/**
 * Derive the signal straight from the most recent report — simple and
 * unambiguous. The newest report sets the tint and headline; its age sets the
 * freshness dot.
 */
function computeSignal(board: LocationBoard, now: number): Signal | null {
  const latest = board.latest;
  if (!latest) return null;

  const meta = STATUS_META[latest.status];

  const age = now - latest.ts;
  const dot =
    age < ONE_HOUR_MS
      ? "bg-emerald-400"
      : age < 6 * ONE_HOUR_MS
        ? "bg-amber-400"
        : "bg-zinc-500";

  return { meta, summary: meta.label, dot };
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
  const [syncedAt, setSyncedAt] = useState(initial.now);
  const [clientNow, setClientNow] = useState(initial.now);
  const [refreshing, setRefreshing] = useState(false);
  const [pull, setPull] = useState(0);
  const [pulling, setPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      if (res.ok) {
        setData((await res.json()) as AppData);
        setSyncedAt(Date.now());
      }
    } catch {
      /* keep last good data */
    }
  }, []);

  const triggerRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setClientNow(Date.now());
    setRefreshing(false);
  }, [refresh]);

  // Auto-refresh: poll, refresh on tab focus, and keep the label ticking.
  useEffect(() => {
    const poll = setInterval(refresh, 60_000);
    const tick = setInterval(() => setClientNow(Date.now()), 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // Pull-to-refresh (mobile) — engages only when scrolled to the top.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const THRESHOLD = 64;
    let startY = 0;
    let active = false;
    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      startY = e.touches[0].clientY;
      active = true;
      setPulling(true);
    };
    const onMove = (e: TouchEvent) => {
      if (!active) return;
      if (window.scrollY > 0) {
        active = false;
        setPulling(false);
        setPull(0);
        return;
      }
      const delta = e.touches[0].clientY - startY;
      if (delta <= 0) {
        setPull(0);
        return;
      }
      e.preventDefault();
      setPull(Math.min(delta * 0.5, THRESHOLD + 16));
    };
    const onEnd = () => {
      if (!active) return;
      active = false;
      setPulling(false);
      setPull((p) => {
        if (p >= THRESHOLD) void triggerRefresh();
        return 0;
      });
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [triggerRefresh]);

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
    <div ref={containerRef}>
      {/* Pull-to-refresh indicator (mobile) */}
      <div
        className={`overflow-hidden ${
          pulling ? "" : "transition-[height] duration-200 ease-out"
        }`}
        style={{ height: pull }}
        aria-hidden
      >
        <div className="flex h-full items-center justify-center text-xs text-zinc-400">
          {pull >= 64 ? "↑ Release to refresh" : "↓ Pull to refresh"}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* Freshness + manual refresh */}
        <div className="flex items-center justify-between px-0.5">
          <span className="text-xs text-zinc-400">
            Updated {timeAgo(syncedAt, clientNow)}
          </span>
          <button
            type="button"
            onClick={triggerRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-zinc-300 ring-1 ring-white/10 transition-colors hover:bg-white/5 hover:text-zinc-100 disabled:opacity-50"
          >
            <span
              className={refreshing ? "inline-block animate-spin" : ""}
              aria-hidden
            >
              ↻
            </span>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

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
                  className="flex w-full items-center justify-between py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-300"
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
                          <span className="ml-auto tabular-nums text-zinc-400">
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
    </div>
  );
}
