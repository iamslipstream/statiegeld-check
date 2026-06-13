import { Board } from "@/components/Board";
import { getAllBoards, isPersistent } from "@/lib/store";
import type { AppData } from "@/lib/types";

export const dynamic = "force-dynamic";

const STEPS = [
  "Pick your supermarket — Jumbo or Vomar — using the tabs.",
  "Check the big card to see if the machine is working before you head down.",
  "At the machine? Tap what you see. Your report instantly updates it for everyone.",
];

export default async function Home() {
  const boards = await getAllBoards();
  const initial: AppData = { now: Date.now(), boards };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <header className="mb-6 text-center">
        <div className="text-4xl" aria-hidden>
          ♻️
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-100">
          Bottle Return Check
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Is the bottle &amp; can return machine working? Check before you carry
          your bag down.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 ring-1 ring-white/10">
          <span aria-hidden>📍</span> Our Domain South East
        </p>
      </header>

      <Board initial={initial} />

      <section className="mt-8 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">How to use</h2>
        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-zinc-400">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-zinc-200">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-8 space-y-3 text-center">
        <p className="rounded-2xl bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200/90 ring-1 ring-emerald-400/20">
          💚 Please tap an update every time you visit a machine. A few seconds
          from you saves a neighbour from lugging a heavy bag downstairs for
          nothing. Let&apos;s look out for each other — Our Domain South East.
        </p>
        <p className="text-xs text-zinc-600">
          Crowdsourced by your neighbours. No login, fully anonymous.
        </p>
        {!isPersistent && (
          <p className="text-xs text-amber-500/80">
            Dev mode: using in-memory storage (reports reset on restart).
          </p>
        )}
      </footer>
    </main>
  );
}
