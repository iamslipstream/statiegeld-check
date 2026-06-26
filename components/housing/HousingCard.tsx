"use client";

import { useState } from "react";
import type { HousingRequest } from "@/lib/housing-store";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-100 leading-tight">{request.name}</h3>
          {request.profession && (
            <p className="text-xs text-zinc-500">{request.profession}</p>
          )}
        </div>
        <span className="shrink-0 text-xs text-zinc-600">{timeAgo()}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
          📅 {formatDate(request.fromDate)} → {formatDate(request.toDate)}
        </span>
        {request.flexible && (
          <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-300 ring-1 ring-sky-400/20">
            Flexible
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
        {request.guests && <span>👥 {request.guests}</span>}
        {request.budget && <span>💶 {request.budget}</span>}
      </div>

      {request.message && (
        <p className="text-sm text-zinc-400">{request.message}</p>
      )}

      {request.contact && (
        <p className="text-xs text-zinc-300">📬 {request.contact}</p>
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
            className="flex-1 rounded-xl py-1.5 text-xs text-zinc-600 ring-1 ring-white/10 hover:bg-rose-500/10 hover:text-rose-400 hover:ring-rose-400/20 transition-colors disabled:opacity-40"
          >
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      )}
    </div>
  );
}
