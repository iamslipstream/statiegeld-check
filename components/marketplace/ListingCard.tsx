"use client";

import { useState } from "react";
import { ContactReveal } from "@/components/ContactReveal";
import { splitContact } from "@/lib/contact";
import type { Listing } from "@/lib/marketplace-store";

export function ListingCard({
  listing,
  token,
  onDelete,
}: {
  listing: Listing;
  token: string | null;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { phone, email } = splitContact(listing.contact);

  const timeAgo = () => {
    const diff = Date.now() - listing.ts;
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const handleDelete = async () => {
    if (!token) return;
    if (!confirm("Remove your listing?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/listings/${listing.id}?token=${encodeURIComponent(token)}`, {
        method: "DELETE",
      });
      onDelete(listing.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl bg-white/5 ring-1 ring-white/10 overflow-hidden">
      {listing.imageUrl && !imgError ? (
        <div className="aspect-video w-full overflow-hidden bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-white/5 text-4xl text-zinc-400">
          📦
        </div>
      )}

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-zinc-100 leading-tight">{listing.title}</h3>
          {listing.price && (
            <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
              {/^\€/.test(listing.price) ? listing.price : /^\d/.test(listing.price) ? `€${listing.price}` : listing.price}
            </span>
          )}
        </div>

        {listing.description && (
          <p className="text-sm text-zinc-400 line-clamp-2">{listing.description}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            🏢 {listing.building} · Apt {listing.apartment}
          </span>
          <span>{timeAgo()}</span>
        </div>

        {(phone || email) && (
          <div className="mt-1">
            <ContactReveal phone={phone} email={email} label="Contact seller" />
          </div>
        )}

        {token && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="mt-2 w-full rounded-xl py-1.5 text-xs text-zinc-400 ring-1 ring-white/10 hover:bg-rose-500/10 hover:text-rose-400 hover:ring-rose-400/20 transition-colors disabled:opacity-40"
          >
            {deleting ? "Removing…" : "Remove my listing"}
          </button>
        )}
      </div>
    </div>
  );
}
