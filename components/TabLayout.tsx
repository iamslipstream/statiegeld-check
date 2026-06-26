"use client";

import { useState } from "react";
import { MarketplaceBoard } from "@/components/marketplace/MarketplaceBoard";
import { HousingBoard } from "@/components/housing/HousingBoard";
import { BottleStatusWidget } from "@/components/BottleStatusWidget";
import type { AppData } from "@/lib/types";
import type { Listing } from "@/lib/marketplace-store";
import type { HousingRequest } from "@/lib/housing-store";

const TABS = [
  { id: "bottle-return", label: "Bottle Return", emoji: "♻️" },
  { id: "marketplace", label: "Marketplace", emoji: "🛍️" },
  { id: "housing", label: "Stays", emoji: "🏠" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function TabLayout({
  listings,
  requests,
  appData,
}: {
  listings: Listing[];
  requests: HousingRequest[];
  appData: AppData;
}) {
  const [active, setActive] = useState<TabId>("bottle-return");

  return (
    <div className="flex flex-1 flex-col">
      <nav
        role="tablist"
        aria-label="Page sections"
        className="sticky top-0 z-10 -mx-4 flex border-b border-white/10 bg-[#0a0a0b]/90 backdrop-blur-md"
      >
        {TABS.map(({ id, label, emoji }) => (
          <button
            key={id}
            role="tab"
            aria-selected={active === id}
            onClick={() => setActive(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-xs font-semibold transition-colors sm:gap-2 sm:text-sm ${
              active === id
                ? "border-emerald-400 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span aria-hidden>{emoji}</span>
            {label}
          </button>
        ))}
      </nav>

      <div className="pt-5 pb-4">
        {active === "marketplace" && <MarketplaceBoard initial={listings} />}
        {active === "housing" && <HousingBoard initial={requests} />}
        {active === "bottle-return" && <BottleStatusWidget initial={appData} />}
      </div>
    </div>
  );
}
