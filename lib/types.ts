export type StatusKey = "working" | "broken";

export interface Report {
  id: string;
  status: StatusKey;
  /** Unix epoch milliseconds when the report was submitted. */
  ts: number;
}

/** The status board for a single supermarket location. */
export interface LocationBoard {
  /** Most recent report for this location, or null if nobody has reported yet. */
  latest: Report | null;
  /** Most recent reports for this location, newest first (capped). */
  reports: Report[];
}

/** Everything the client needs: one board per location plus a trusted clock. */
export interface AppData {
  /** Server time (epoch ms) so the client computes "x min ago" against a trusted clock. */
  now: number;
  /** Board keyed by location id. */
  boards: Record<string, LocationBoard>;
}

export interface LocationMeta {
  id: string;
  /** Display name, e.g. "Jumbo". */
  name: string;
  /** Short hint shown under the name, e.g. "in the building". */
  hint?: string;
}

/**
 * The supermarkets covered by the app. Add a new entry here and it shows up
 * everywhere automatically — switcher, status card, reporting and history.
 * The first entry is the default selection.
 */
export const LOCATIONS: LocationMeta[] = [
  { id: "jumbo", name: "Jumbo", hint: "in the building" },
  { id: "vomar", name: "Vomar", hint: "nearby" },
];

export const LOCATION_IDS: string[] = LOCATIONS.map((l) => l.id);

export function isLocationId(value: unknown): value is string {
  return typeof value === "string" && LOCATION_IDS.includes(value);
}

export function locationName(id: string): string {
  return LOCATIONS.find((l) => l.id === id)?.name ?? id;
}

export const STATUS_ORDER: StatusKey[] = ["working", "broken"];

export interface StatusMeta {
  key: StatusKey;
  emoji: string;
  /** Short label shown on the report button. */
  label: string;
  /** Sentence shown on the big status card. */
  headline: string;
  /** Tailwind classes for the status accent. */
  ring: string;
  /** Left-border accent for the passive status panel. */
  border: string;
  bg: string;
  text: string;
  button: string;
  /** Small dot colour used in the location switcher. */
  dot: string;
}

export const STATUS_META: Record<StatusKey, StatusMeta> = {
  working: {
    key: "working",
    emoji: "✅",
    label: "Working",
    headline: "The machine is working",
    ring: "ring-emerald-400/40",
    border: "border-emerald-400/50",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    button:
      "cursor-pointer bg-emerald-600/90 text-emerald-50 shadow-sm shadow-black/30 ring-1 ring-inset ring-white/10 hover:bg-emerald-600 active:scale-[0.98] active:bg-emerald-700",
    dot: "bg-emerald-400",
  },
  broken: {
    key: "broken",
    emoji: "❌",
    label: "Not working",
    headline: "The machine is not working",
    ring: "ring-rose-400/40",
    border: "border-rose-400/50",
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    button:
      "cursor-pointer bg-rose-600/90 text-rose-50 shadow-sm shadow-black/30 ring-1 ring-inset ring-white/10 hover:bg-rose-600 active:scale-[0.98] active:bg-rose-700",
    dot: "bg-rose-400",
  },
};

export function isStatusKey(value: unknown): value is StatusKey {
  return (
    typeof value === "string" && (STATUS_ORDER as string[]).includes(value)
  );
}

/** A report older than this is shown with a "might be outdated" warning. */
export const STALE_AFTER_MS = 2 * 60 * 60 * 1000; // 2 hours
