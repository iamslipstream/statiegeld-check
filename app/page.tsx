import { TabLayout } from "@/components/TabLayout";
import { getAllBoards, isPersistent, incrementVisitors } from "@/lib/store";
import { getListings } from "@/lib/marketplace-store";
import { getRequests } from "@/lib/housing-store";
import type { AppData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [boards, listings, requests, visitors] = await Promise.all([
    getAllBoards(),
    getListings(),
    getRequests(),
    incrementVisitors(),
  ]);
  const appData: AppData = { now: Date.now(), boards };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4">
      <header className="py-5 text-center">
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-zinc-400 ring-1 ring-white/10">
          <span aria-hidden>📍</span> Our Domain South East
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Our Domain Community
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Neighbours&apos; bottle return status, marketplace &amp; short stays
        </p>
      </header>

      <TabLayout listings={listings} requests={requests} appData={appData} />

      <footer className="py-6 text-center space-y-2">
        <p className="text-xs text-zinc-600">
          Built for Our Domain South East · No login · Fully anonymous
        </p>
        <p className="text-xs text-zinc-700">
          👥 {visitors.toLocaleString("nl-NL")} visits
        </p>
        <p className="text-xs text-zinc-600">
          Built between coffees ☕ — your neighbour.
        </p>
        {!isPersistent && (
          <p className="text-xs text-amber-500/70">
            Dev mode: data resets on server restart
          </p>
        )}
      </footer>
    </main>
  );
}
