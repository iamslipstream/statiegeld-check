"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardData, StatusKey } from "@/lib/types";
import { StatusCard } from "./StatusCard";
import { ReportButtons } from "./ReportButtons";
import { History } from "./History";

const POLL_MS = 30_000;

export function Board({ initial }: { initial: BoardData }) {
  const [data, setData] = useState<BoardData>(initial);
  const [pending, setPending] = useState<StatusKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState(false);
  const thanksTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      if (!res.ok) return;
      const next = (await res.json()) as BoardData;
      setData(next);
    } catch {
      // Network blip — keep showing the last good data, try again next tick.
    }
  }, []);

  // Poll for updates and refresh when the tab regains focus.
  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (thanksTimer.current) clearTimeout(thanksTimer.current);
    };
  }, []);

  const report = useCallback(async (status: StatusKey) => {
    setPending(status);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Request failed");
      const next = (await res.json()) as BoardData;
      setData(next);
      setThanks(true);
      if (thanksTimer.current) clearTimeout(thanksTimer.current);
      thanksTimer.current = setTimeout(() => setThanks(false), 2500);
    } catch {
      setError("Couldn't send your report. Check your connection and try again.");
    } finally {
      setPending(null);
    }
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <StatusCard latest={data.latest} now={data.now} />

      <ReportButtons onReport={report} pending={pending} />

      {thanks && (
        <p
          className="text-center text-sm text-emerald-300"
          role="status"
        >
          🙏 Thanks! Your report is live for the whole building.
        </p>
      )}
      {error && (
        <p className="text-center text-sm text-rose-300" role="alert">
          {error}
        </p>
      )}

      <History reports={data.reports} now={data.now} />
    </div>
  );
}
