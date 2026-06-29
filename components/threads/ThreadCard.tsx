"use client";

import { useState } from "react";
import type { Thread } from "@/lib/threads-store";

function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ThreadCard({
  thread,
  token,
  onUpdated,
  onDelete,
}: {
  thread: Thread;
  token: string | null;
  onUpdated: (thread: Thread) => void;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!token) return;
    if (!confirm("Remove your post?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/threads/${thread.id}?token=${encodeURIComponent(token)}`, {
        method: "DELETE",
      });
      onDelete(thread.id);
    } catch {
      setDeleting(false);
    }
  };

  const handleReply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/threads/${thread.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody, author: replyAuthor }),
      });
      const updated = (await res.json()) as Thread & { error?: string };
      if (!res.ok) throw new Error(updated.error ?? "Could not reply.");
      onUpdated(updated);
      setReplyBody("");
      setReplyAuthor("");
      setShowReply(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reply.");
    } finally {
      setSending(false);
    }
  };

  const kindBadge =
    thread.kind === "lost"
      ? { text: "Lost", cls: "bg-rose-500/15 text-rose-300 ring-rose-400/20" }
      : thread.kind === "found"
        ? { text: "Found", cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20" }
        : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {kindBadge && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${kindBadge.cls}`}
              >
                {kindBadge.text}
              </span>
            )}
            <h3 className="font-semibold text-zinc-100 leading-tight">{thread.title}</h3>
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">
            {thread.author ? `${thread.author} · ` : ""}
            {timeAgo(thread.ts)}
          </p>
        </div>
      </div>

      {thread.imageUrl && (
        <div className="overflow-hidden rounded-xl bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thread.imageUrl}
            alt={thread.title}
            className="max-h-72 w-full object-cover"
          />
        </div>
      )}

      {thread.body && <p className="text-sm text-zinc-400">{thread.body}</p>}
      {thread.contact && (
        <p className="text-xs text-zinc-400">📬 {thread.contact}</p>
      )}

      {/* Replies */}
      {thread.replies.length > 0 && (
        <ul className="flex flex-col gap-2 border-l-2 border-white/10 pl-3">
          {thread.replies.map((r) => (
            <li key={r.id} className="text-sm">
              <p className="text-zinc-300">{r.body}</p>
              <p className="text-xs text-zinc-400">
                {r.author ? `${r.author} · ` : ""}
                {timeAgo(r.ts)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowReply((s) => !s)}
          className="rounded-xl px-3 py-1.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20 hover:bg-emerald-500/10 transition-colors"
        >
          💬 {thread.replies.length > 0 ? `Reply (${thread.replies.length})` : "Reply"}
        </button>
        {token && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="ml-auto rounded-xl px-3 py-1.5 text-xs text-zinc-400 ring-1 ring-white/10 hover:bg-rose-500/10 hover:text-rose-400 hover:ring-rose-400/20 transition-colors disabled:opacity-40"
          >
            {deleting ? "Removing…" : "Remove"}
          </button>
        )}
      </div>

      {showReply && (
        <form onSubmit={handleReply} className="flex flex-col gap-2">
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={2}
            required
            placeholder="Write a reply…"
            className="resize-none rounded-xl bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/50"
          />
          <div className="flex gap-2">
            <input
              value={replyAuthor}
              onChange={(e) => setReplyAuthor(e.target.value)}
              type="text"
              placeholder="Your name (optional)"
              className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/50"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              {sending ? "…" : "Send"}
            </button>
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </form>
      )}
    </div>
  );
}
