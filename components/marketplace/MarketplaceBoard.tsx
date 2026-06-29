"use client";

import { useEffect, useRef, useState } from "react";
import { ListingCard } from "./ListingCard";
import { ListingForm } from "./ListingForm";
import { EmptyState } from "@/components/EmptyState";
import { SuccessNote } from "@/components/SuccessNote";
import { fireConfetti } from "@/lib/confetti";
import { countLabel } from "@/lib/copy";
import type { Listing } from "@/lib/marketplace-store";

const STORAGE_KEY = "od_my_listings";

function loadMyListings(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function saveMyListings(map: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function MarketplaceBoard({ initial }: { initial: Listing[] }) {
  const [listings, setListings] = useState<Listing[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [posted, setPosted] = useState(false);
  // id → token map, only populated client-side after hydration
  const [myTokens, setMyTokens] = useState<Record<string, string>>({});

  const formRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMyTokens(loadMyListings());
  }, []);

  useEffect(() => {
    if (showForm) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm]);

  const handleCreated = (listing: Listing, token: string) => {
    setListings((prev) => [listing, ...prev]);
    setShowForm(false);
    setPosted(true);
    fireConfetti();
    setMyTokens((prev) => {
      const next = { ...prev, [listing.id]: token };
      saveMyListings(next);
      return next;
    });
    requestAnimationFrame(() =>
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  const handleDelete = (id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
    setMyTokens((prev) => {
      const next = { ...prev };
      delete next[id];
      saveMyListings(next);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {countLabel(
            listings.length,
            "item for sale",
            "items for sale",
            "Nothing for sale yet"
          )}
        </p>
        <button
          onClick={() => setShowForm((s) => !s)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            showForm
              ? "bg-white/10 text-zinc-300 hover:bg-white/15"
              : "bg-emerald-500 text-white hover:bg-emerald-400"
          }`}
        >
          {showForm ? "✕ Cancel" : "+ Sell Something"}
        </button>
      </div>

      {posted && (
        <SuccessNote
          message="Your item is live — neighbours can see it now"
          onDismiss={() => setPosted(false)}
        />
      )}

      {showForm && (
        <div ref={formRef}>
          <ListingForm onCreated={handleCreated} />
        </div>
      )}

      {listings.length === 0 && !showForm ? (
        <EmptyState
          emoji="🛍️"
          title="Nothing for sale yet"
          text="Be the first to post something — furniture, plants, kids’ stuff, anything goes."
          cta={{ label: "Post the first item", onClick: () => setShowForm(true) }}
        />
      ) : (
        <div ref={listRef} className="grid grid-cols-2 gap-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              token={myTokens[listing.id] ?? null}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
