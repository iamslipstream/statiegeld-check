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
  { id: "bottle-return", label: "Bottle Return", emoji: "♻️" },
  { id: "marketplace", label: "Marketplace", emoji: "🛍️" },
  { id: "housing", label: "Stays", emoji: "🏠" },
  { id: "lost-found", label: "Lost & Found", emoji: "🧦" },
  { id: "recommendations", label: "Tips", emoji: "💡" },
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
        className="sticky top-0 z-10 -mx-4 flex overflow-x-auto border-b border-white/10 bg-[#0a0a0b]/90 backdrop-blur-md [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map(({ id, label, emoji }) => (
          <button
            key={id}
            role="tab"
            aria-selected={active === id}
            onClick={() => setActive(id)}
            className={`flex flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold transition-colors sm:text-sm ${
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
