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

      <footer className="mt-2 border-t border-white/5 py-8 text-center">
        <p className="text-sm font-medium text-zinc-300">
          Built between coffees <span className="text-base align-middle">☕</span>
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          by your neighbour · for Our Domain South East
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400 ring-1 ring-white/10">
            🔓 No login
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400 ring-1 ring-white/10">
            🕶️ Fully anonymous
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 ring-1 ring-white/10">
            👥 {visitors.toLocaleString("nl-NL")} visits
          </span>
        </div>

        {!isPersistent && (
          <p className="mt-3 text-xs text-amber-500/70">
            Dev mode: data resets on server restart
          </p>
        )}
      </footer>
    </main>
  );
}
