"use client";

import { useEffect, useRef, useState } from "react";
import { ThreadForm } from "./ThreadForm";
import { ThreadCard } from "./ThreadCard";
import { THREAD_CONFIG } from "./config";
import { EmptyState } from "@/components/EmptyState";
import { SuccessNote } from "@/components/SuccessNote";
import { fireConfetti } from "@/lib/confetti";
import { countLabel } from "@/lib/copy";
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
  const [posted, setPosted] = useState(false);
  const [myTokens, setMyTokens] = useState<Record<string, string>>({});

  const formRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMyTokens(loadMine(config.storageKey));
  }, [config.storageKey]);

  useEffect(() => {
    if (showForm) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm]);

  const handleCreated = (thread: Thread, token: string) => {
    setThreads((prev) => [thread, ...prev]);
    setShowForm(false);
    setPosted(true);
    fireConfetti();
    setMyTokens((prev) => {
      const next = { ...prev, [thread.id]: token };
      saveMine(config.storageKey, next);
      return next;
    });
    requestAnimationFrame(() =>
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
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
        <p className="text-sm text-zinc-400">
          {countLabel(
            threads.length,
            config.countOne,
            config.countMany,
            config.countZero
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
          {showForm ? config.cancelButton : config.newButton}
        </button>
      </div>

      {posted && (
        <SuccessNote
          message={config.successNote}
          onDismiss={() => setPosted(false)}
        />
      )}

      {showForm && (
        <div ref={formRef}>
          <ThreadForm category={category} config={config} onCreated={handleCreated} />
        </div>
      )}

      {threads.length === 0 && !showForm ? (
        <EmptyState
          emoji={config.emptyEmoji}
          title={config.emptyTitle}
          text={config.emptyText}
          cta={{ label: config.emptyCta, onClick: () => setShowForm(true) }}
        />
      ) : (
        <div ref={listRef} className="flex flex-col gap-4">
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
