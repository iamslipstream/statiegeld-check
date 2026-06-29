"use client";

import { useState } from "react";
import { MarketplaceBoard } from "@/components/marketplace/MarketplaceBoard";
import { HousingBoard } from "@/components/housing/HousingBoard";
import { ThreadBoard } from "@/components/threads/ThreadBoard";
import { BottleStatusWidget } from "@/components/BottleStatusWidget";
import type { AppData } from "@/lib/types";
import type { Listing } from "@/lib/marketplace-store";
import type { HousingRequest } from "@/lib/housing-store";
import type { Thread } from "@/lib/threads-store";

const TABS = [
  { id: "bottle-return", label: "Bottle Return", short: "Bottles", emoji: "♻️" },
  { id: "marketplace", label: "Marketplace", short: "Market", emoji: "🛍️" },
  { id: "housing", label: "Stays", short: "Stays", emoji: "🏠" },
  { id: "lost-found", label: "Lost & Found", short: "Lost", emoji: "🧦" },
  { id: "recommendations", label: "Recommendations", short: "Recs", emoji: "💡" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function TabLayout({
  listings,
  requests,
  lostFound,
  recommendations,
  appData,
}: {
  listings: Listing[];
  requests: HousingRequest[];
  lostFound: Thread[];
  recommendations: Thread[];
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
        {TABS.map(({ id, label, short, emoji }) => (
          <button
            key={id}
            role="tab"
            aria-selected={active === id}
            onClick={() => setActive(id)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 border-b-2 px-1 py-2 font-semibold transition-colors sm:flex-row sm:gap-2 sm:py-3 ${
              active === id
                ? "border-emerald-400 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className="text-lg leading-none sm:text-base" aria-hidden>
              {emoji}
            </span>
            <span className="text-[11px] sm:text-sm">
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </span>
          </button>
        ))}
      </nav>

      <div className="pt-5 pb-4">
        {active === "marketplace" && <MarketplaceBoard initial={listings} />}
        {active === "housing" && <HousingBoard initial={requests} />}
        {active === "lost-found" && (
          <ThreadBoard category="lost-found" initial={lostFound} />
        )}
        {active === "recommendations" && (
          <ThreadBoard category="recommendations" initial={recommendations} />
        )}
        {active === "bottle-return" && <BottleStatusWidget initial={appData} />}
      </div>
    </div>
  );
}
