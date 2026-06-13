/**
 * Format a "time ago" string from a past timestamp relative to `now`.
 * Both are epoch milliseconds. Kept dependency-free and deterministic so the
 * server and client agree (the client always passes the server's `now`).
 */
export function timeAgo(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "just now";

  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;

  const hr = Math.round(min / 60);
  if (hr < 24) return hr === 1 ? "1 hour ago" : `${hr} hours ago`;

  const day = Math.round(hr / 24);
  return day === 1 ? "1 day ago" : `${day} days ago`;
}

/** Short clock label like "14:32" in the Netherlands timezone. */
export function clockLabel(ts: number): string {
  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(ts));
}
