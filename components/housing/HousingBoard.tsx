"use client";

import { useEffect, useState } from "react";
import { HousingCard } from "./HousingCard";
import { HousingForm } from "./HousingForm";
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
  const [editing, setEditing] = useState<HousingRequest | null>(null);
  const [myTokens, setMyTokens] = useState<Record<string, string>>({});

  useEffect(() => {
    setMyTokens(loadMine());
  }, []);

  const handleCreated = (request: HousingRequest, token: string) => {
    setRequests((prev) => [request, ...prev]);
    setShowForm(false);
    setMyTokens((prev) => {
      const next = { ...prev, [request.id]: token };
      saveMine(next);
      return next;
    });
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {requests.length === 0
            ? "No requests yet"
            : `${requests.length} ${requests.length !== 1 ? "people" : "person"} looking`}
        </p>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm((s) => !s);
          }}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            showForm
              ? "bg-white/10 text-zinc-300 hover:bg-white/15"
              : "bg-emerald-500 text-white hover:bg-emerald-400"
          }`}
        >
          {showForm ? "✕ Cancel" : "+ Request a place"}
        </button>
      </div>

      {showForm && <HousingForm onSaved={handleCreated} />}

      {requests.length === 0 && !showForm ? (
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-10 text-center">
          <div className="text-5xl">🏠</div>
          <h3 className="mt-3 text-lg font-semibold text-zinc-200">
            No one&apos;s looking right now
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Need a short-term place in the building? Post your dates and
            neighbours with a free apartment can reach out.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors"
          >
            Post the first request
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
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
