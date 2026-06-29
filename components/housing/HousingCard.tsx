"use client";

import { useState } from "react";
import { ContactReveal } from "@/components/ContactReveal";
import { splitContact } from "@/lib/contact";
import type { HousingRequest } from "@/lib/housing-store";

function formatDate(
  iso: string,
  opts: Intl.DateTimeFormatOptions
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", opts);
}

/** "7 Aug → 25 Sept 2026" — drops the redundant first year when it matches. */
function formatRange(fromIso: string, toIso: string): string {
  const f = new Date(fromIso);
  const t = new Date(toIso);
  if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime())) {
    return `${fromIso} → ${toIso}`;
  }
  const sameYear = f.getFullYear() === t.getFullYear();
  const sameMonth = sameYear && f.getMonth() === t.getMonth();
  const full: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  if (sameMonth) {
    return `${f.getDate()}–${formatDate(toIso, full)}`;
  }
  if (sameYear) {
    return `${formatDate(fromIso, { day: "numeric", month: "short" })} → ${formatDate(toIso, full)}`;
  }
  return `${formatDate(fromIso, full)} → ${formatDate(toIso, full)}`;
}

/** A friendly stay length, e.g. "9 nights" / "7 weeks" / "3 months". */
function stayLength(fromIso: string, toIso: string): string | null {
  const f = new Date(fromIso).getTime();
  const t = new Date(toIso).getTime();
  if (Number.isNaN(f) || Number.isNaN(t)) return null;
  const days = Math.round((t - f) / 86_400_000);
  if (days <= 0) return null;
  if (days < 14) return `${days} night${days !== 1 ? "s" : ""}`;
  if (days < 60) {
    const w = Math.round(days / 7);
    return `${w} week${w !== 1 ? "s" : ""}`;
  }
  const mo = Math.round(days / 30);
  return `${mo} month${mo !== 1 ? "s" : ""}`;
}

/** Add a € to a bare number; leave anything already formatted alone. */
function formatBudget(value: string): string {
  const v = value.trim();
  if (/^\d+([.,]\d+)?$/.test(v)) return `€${v} / month`;
  return v;
}

/** "1" → "1 guest", "3" → "3 guests"; free text passes through. */
function formatGuests(value: string): string {
  const v = value.trim();
  if (/^\d+$/.test(v)) return `${v} ${v === "1" ? "guest" : "guests"}`;
  return v;
}

export function HousingCard({
  request,
  token,
  onEdit,
  onDelete,
}: {
  request: HousingRequest;
  token: string | null;
  onEdit: (request: HousingRequest) => void;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const timeAgo = () => {
    const diff = Date.now() - request.ts;
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const handleDelete = async () => {
    if (!token) return;
    if (!confirm("Remove your request?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/housing/${request.id}?token=${encodeURIComponent(token)}`, {
        method: "DELETE",
      });
      onDelete(request.id);
    } catch {
      setDeleting(false);
    }
  };

  const length = stayLength(request.fromDate, request.toDate);
  const { phone, email } = splitContact(request.contact);
  const firstName = request.name.split(" ")[0];

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
      {/* Who */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-100 leading-tight">{request.name}</h3>
          {request.profession && (
            <p className="text-xs text-zinc-400">{request.profession}</p>
          )}
        </div>
        <span className="shrink-0 text-xs text-zinc-400">{timeAgo()}</span>
      </div>

      {/* When — the headline of the request */}
      <div className="rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/20 p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300/70">
          📅 Looking to stay
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-base font-semibold text-emerald-200">
            {formatRange(request.fromDate, request.toDate)}
          </span>
          {length && (
            <span className="text-xs font-medium text-emerald-300/80">
              · {length}
            </span>
          )}
        </div>
        {request.flexible && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-medium text-sky-300 ring-1 ring-sky-400/20">
            🔄 Dates are flexible
          </span>
        )}
      </div>

      {/* Key facts — labelled so hosts can scan at a glance */}
      <div className="grid grid-cols-2 gap-2">
        {request.guests && (
          <div className="rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/5">
            <p className="text-[11px] uppercase tracking-wide text-zinc-400">
              Guests
            </p>
            <p className="mt-0.5 text-sm text-zinc-200">
              👥 {formatGuests(request.guests)}
            </p>
          </div>
        )}
        {request.budget && (
          <div className="rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/5">
            <p className="text-[11px] uppercase tracking-wide text-zinc-400">
              Budget
            </p>
            <p className="mt-0.5 text-sm text-zinc-200">
              💶 {formatBudget(request.budget)}
            </p>
          </div>
        )}
      </div>

      {/* Their note */}
      {request.message && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-zinc-400">
            Note
          </p>
          <p className="mt-0.5 text-sm text-zinc-300">{request.message}</p>
        </div>
      )}

      {/* Contact — opt-in reveal, then one-tap call/mail + copy */}
      {(phone || email) && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-zinc-400">
            Reach {firstName}
          </p>
          <div className="mt-1.5">
            <ContactReveal
              phone={phone}
              email={email}
              label={`Contact ${firstName}`}
            />
          </div>
        </div>
      )}

      {token && (
        <div className="mt-1 flex gap-2">
          <button
            onClick={() => onEdit(request)}
            disabled={deleting}
            className="flex-1 rounded-xl py-1.5 text-xs text-zinc-400 ring-1 ring-white/10 hover:bg-emerald-500/10 hover:text-emerald-300 hover:ring-emerald-400/20 transition-colors disabled:opacity-40"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 rounded-xl py-1.5 text-xs text-zinc-400 ring-1 ring-white/10 hover:bg-rose-500/10 hover:text-rose-400 hover:ring-rose-400/20 transition-colors disabled:opacity-40"
          >
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      )}
    </div>
  );
}
