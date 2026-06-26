"use client";

import { useEffect, useState } from "react";
import { ThreadForm } from "./ThreadForm";
import { ThreadCard } from "./ThreadCard";
import { THREAD_CONFIG } from "./config";
import { fireConfetti } from "@/lib/confetti";
import type { Thread, ThreadCategory } from "@/lib/threads-store";

function loadMine(key: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function saveMine(key: string, map: Record<string, string>) {
  localStorage.setItem(key, JSON.stringify(map));
}

export function ThreadBoard({
  category,
  initial,
}: {
  category: ThreadCategory;
  initial: Thread[];
}) {
  const config = THREAD_CONFIG[category];
  const [threads, setThreads] = useState<Thread[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [myTokens, setMyTokens] = useState<Record<string, string>>({});

  useEffect(() => {
    setMyTokens(loadMine(config.storageKey));
  }, [config.storageKey]);

  const handleCreated = (thread: Thread, token: string) => {
    setThreads((prev) => [thread, ...prev]);
    setShowForm(false);
    fireConfetti();
    setMyTokens((prev) => {
      const next = { ...prev, [thread.id]: token };
      saveMine(config.storageKey, next);
      return next;
    });
  };

  const handleUpdated = (thread: Thread) => {
    setThreads((prev) => prev.map((t) => (t.id === thread.id ? thread : t)));
  };

  const handleDelete = (id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
    setMyTokens((prev) => {
      const next = { ...prev };
      delete next[id];
      saveMine(config.storageKey, next);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {threads.length === 0 ? "Nothing yet" : config.count(threads.length)}
        </p>
        <button
          onClick={() => setShowForm((s) => !s)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            showForm
              ? "bg-white/10 text-zinc-300 hover:bg-white/15"
              : "bg-emerald-500 text-white hover:bg-emerald-400"
          }`}
        >
          {showForm ? config.cancelButton : config.newButton}
        </button>
      </div>

      {showForm && (
        <ThreadForm category={category} config={config} onCreated={handleCreated} />
      )}

      {threads.length === 0 && !showForm ? (
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-10 text-center">
          <div className="text-5xl">{config.emptyEmoji}</div>
          <h3 className="mt-3 text-lg font-semibold text-zinc-200">
            {config.emptyTitle}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">{config.emptyText}</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors"
          >
            {config.emptyCta}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              token={myTokens[thread.id] ?? null}
              onUpdated={handleUpdated}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
