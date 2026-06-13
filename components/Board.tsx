"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LOCATIONS,
  locationName,
  type AppData,
  type LocationBoard,
  type StatusKey,
} from "@/lib/types";
import { LocationSwitcher } from "./LocationSwitcher";
import { StatusCard } from "./StatusCard";
import { ReportButtons } from "./ReportButtons";
import { History } from "./History";

const POLL_MS = 30_000;
const EMPTY_BOARD: LocationBoard = { latest: null, reports: [] };

export function Board({ initial }: { initial: AppData }) {
  const [data, setData] = useState<AppData>(initial);
  const [selected, setSelected] = useState<string>(LOCATIONS[0].id);
  const [pending, setPending] = useState<StatusKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState(false);
  const thanksTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      if (!res.ok) return;
      const next = (await res.json()) as AppData;
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

  const report = useCallback(
    async (status: StatusKey) => {
      setPending(status);
      setError(null);
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location: selected, status }),
        });
        if (!res.ok) throw new Error("Request failed");
        const next = (await res.json()) as AppData;
        setData(next);
        setThanks(true);
        if (thanksTimer.current) clearTimeout(thanksTimer.current);
        thanksTimer.current = setTimeout(() => setThanks(false), 2500);
      } catch {
        setError(
          "Couldn't send your report. Check your connection and try again."
        );
      } finally {
        setPending(null);
      }
    },
    [selected]
  );

  const board = data.boards[selected] ?? EMPTY_BOARD;

  // Clear any transient messages when switching supermarket.
  const handleSelect = (id: string) => {
    setSelected(id);
    setError(null);
    setThanks(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <LocationSwitcher
        selected={selected}
        boards={data.boards}
        onSelect={handleSelect}
      />

      <StatusCard latest={board.latest} now={data.now} />

      <ReportButtons
        onReport={report}
        pending={pending}
        locationName={locationName(selected)}
      />

      {thanks && (
        <p className="text-center text-sm text-emerald-300" role="status">
          🙏 Thanks! Your report is live for your neighbours.
        </p>
      )}
      {error && (
        <p className="text-center text-sm text-rose-300" role="alert">
          {error}
        </p>
      )}

      <History reports={board.reports} now={data.now} />
    </div>
  );
}
