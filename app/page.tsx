import { Board } from "@/components/Board";
import { getReports, isPersistent } from "@/lib/store";
import type { BoardData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const reports = await getReports();
  const initial: BoardData = {
    latest: reports[0] ?? null,
    reports,
    now: Date.now(),
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <header className="mb-6 text-center">
        <div className="text-4xl" aria-hidden>
          🔄
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-100">
          Statiegeld Check
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Is the Jumbo bottle &amp; can machine working? Check before you carry
          your bag down.
        </p>
      </header>

      <Board initial={initial} />

      <footer className="mt-10 space-y-1 text-center text-xs text-zinc-600">
        <p>Crowdsourced by your neighbours. No login, fully anonymous.</p>
        {!isPersistent && (
          <p className="text-amber-500/80">
            Dev mode: using in-memory storage (reports reset on restart).
          </p>
        )}
      </footer>
    </main>
  );
}
