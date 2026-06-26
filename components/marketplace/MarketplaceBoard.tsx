"use client";

import { useEffect, useState } from "react";
import { ListingCard } from "./ListingCard";
import { ListingForm } from "./ListingForm";
import { fireConfetti } from "@/lib/confetti";
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
  // id → token map, only populated client-side after hydration
  const [myTokens, setMyTokens] = useState<Record<string, string>>({});

  useEffect(() => {
    setMyTokens(loadMyListings());
  }, []);

  const handleCreated = (listing: Listing, token: string) => {
    setListings((prev) => [listing, ...prev]);
    setShowForm(false);
    fireConfetti();
    setMyTokens((prev) => {
      const next = { ...prev, [listing.id]: token };
      saveMyListings(next);
      return next;
    });
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
        <p className="text-sm text-zinc-500">
          {listings.length === 0
            ? "No items listed yet"
            : `${listings.length} item${listings.length !== 1 ? "s" : ""} listed`}
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

      {showForm && <ListingForm onCreated={handleCreated} />}

      {listings.length === 0 && !showForm ? (
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-10 text-center">
          <div className="text-5xl">🛍️</div>
          <h3 className="mt-3 text-lg font-semibold text-zinc-200">Nothing for sale yet</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Be the first to post something — furniture, plants, kids&apos; stuff, anything goes.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors"
          >
            Post the first item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
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
