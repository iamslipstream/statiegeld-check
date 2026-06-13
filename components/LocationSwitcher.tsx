"use client";

import {
  LOCATIONS,
  STATUS_META,
  type LocationBoard,
} from "@/lib/types";

export function LocationSwitcher({
  selected,
  boards,
  onSelect,
}: {
  selected: string;
  boards: Record<string, LocationBoard>;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="grid gap-2 rounded-2xl bg-white/5 p-1.5 ring-1 ring-white/10"
      style={{ gridTemplateColumns: `repeat(${LOCATIONS.length}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label="Choose a supermarket"
    >
      {LOCATIONS.map((loc) => {
        const isActive = loc.id === selected;
        const latest = boards[loc.id]?.latest ?? null;
        const dot = latest ? STATUS_META[latest.status].dot : "bg-zinc-600";
        return (
          <button
            key={loc.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(loc.id)}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-white/10 text-zinc-50 shadow-sm ring-1 ring-white/15"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`}
              aria-hidden
            />
            {loc.name}
          </button>
        );
      })}
    </div>
  );
}
