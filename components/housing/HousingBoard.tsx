"use client";

import { useEffect, useRef, useState } from "react";
import { HousingCard } from "./HousingCard";
import { HousingForm } from "./HousingForm";
import { EmptyState } from "@/components/EmptyState";
import { SuccessNote } from "@/components/SuccessNote";
import { fireConfetti } from "@/lib/confetti";
import { countLabel } from "@/lib/copy";
import type { HousingRequest } from "@/lib/housing-store";

const STORAGE_KEY = "od_my_housing_requests";

function loadMine(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function saveMine(map: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function HousingBoard({ initial }: { initial: HousingRequest[] }) {
  const [requests, setRequests] = useState<HousingRequest[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [posted, setPosted] = useState(false);
  const [editing, setEditing] = useState<HousingRequest | null>(null);
  const [myTokens, setMyTokens] = useState<Record<string, string>>({});

  const formRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMyTokens(loadMine());
  }, []);

  useEffect(() => {
    if (showForm) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm]);

  const handleCreated = (request: HousingRequest, token: string) => {
    setRequests((prev) => [request, ...prev]);
    setShowForm(false);
    setPosted(true);
    fireConfetti();
    setMyTokens((prev) => {
      const next = { ...prev, [request.id]: token };
      saveMine(next);
      return next;
    });
    requestAnimationFrame(() =>
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  const handleUpdated = (request: HousingRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === request.id ? request : r)));
    setEditing(null);
  };

  const startEdit = (request: HousingRequest) => {
    setShowForm(false);
    setEditing(request);
  };

  const handleDelete = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    if (editing?.id === id) setEditing(null);
    setMyTokens((prev) => {
      const next = { ...prev };
      delete next[id];
      saveMine(next);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-300">
            {countLabel(
              requests.length,
              "neighbour looking for a stay",
              "neighbours looking for a stay",
              "No one’s looking right now"
            )}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            Got a free room or apartment? Reach out to anyone below.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm((s) => !s);
          }}
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            showForm
              ? "bg-white/10 text-zinc-300 hover:bg-white/15"
              : "bg-emerald-500 text-white hover:bg-emerald-400"
          }`}
        >
          {showForm ? "✕ Cancel" : "+ Request a place"}
        </button>
      </div>

      {posted && (
        <SuccessNote
          message="Your request is live — neighbours can see it now"
          onDismiss={() => setPosted(false)}
        />
      )}

      {showForm && (
        <div ref={formRef}>
          <HousingForm onSaved={handleCreated} />
        </div>
      )}

      {requests.length === 0 && !showForm ? (
        <EmptyState
          emoji="🏠"
          title="No one’s looking right now"
          text="Need a short-term place in the building? Post your dates and neighbours with a free apartment can reach out."
          cta={{
            label: "Post the first request",
            onClick: () => setShowForm(true),
          }}
        />
      ) : (
        <div ref={listRef} className="flex flex-col gap-4">
          {requests.map((request) =>
            editing?.id === request.id ? (
              <HousingForm
                key={request.id}
                request={request}
                token={myTokens[request.id]}
                onSaved={handleUpdated}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <HousingCard
                key={request.id}
                request={request}
                token={myTokens[request.id] ?? null}
                onEdit={startEdit}
                onDelete={handleDelete}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
