"use client";

import { useRef, useState } from "react";
import { compressImage } from "@/lib/image";
import type { Thread, ThreadCategory } from "@/lib/threads-store";
import type { ThreadConfig } from "./config";

function makeToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const fieldClass =
  "rounded-xl bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/50";

export function ThreadForm({
  category,
  config,
  onCreated,
}: {
  category: ThreadCategory;
  config: ThreadConfig;
  onCreated: (thread: Thread, token: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<"lost" | "found">("lost");
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    setError(null);
    try {
      setPreview(await compressImage(file));
    } catch {
      setError("Could not read that image. Try a different photo.");
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const token = makeToken();
    try {
      const form = e.currentTarget;
      const fd = new FormData(form);
      const payload = {
        category,
        kind: config.showKind ? kind : "",
        title: fd.get("title"),
        body: fd.get("body"),
        author: fd.get("author"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        image: config.showImage ? (preview ?? "") : "",
        token,
      };
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let resBody: Partial<Thread> & { error?: string } = {};
      try {
        resBody = text ? JSON.parse(text) : {};
      } catch {
        /* non-JSON — handled below */
      }
      if (!res.ok) {
        throw new Error(resBody.error ?? "Something went wrong. Please try again.");
      }
      onCreated(resBody as Thread, token);
      form.reset();
      setKind("lost");
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5 flex flex-col gap-4"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">{config.formTitle}</h2>
        <p className="mt-1 text-xs text-zinc-500">{config.formIntro}</p>
      </div>

      {config.showKind && (
        <div className="flex gap-2">
          {(["lost", "found"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold capitalize ring-1 transition-colors ${
                kind === k
                  ? k === "lost"
                    ? "bg-rose-500/15 text-rose-200 ring-rose-400/30"
                    : "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30"
                  : "bg-white/5 text-zinc-400 ring-white/10 hover:text-zinc-200"
              }`}
            >
              {k === "lost" ? "😟 I lost this" : "🎉 I found this"}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="title">
          {config.titleLabel} <span className="text-rose-400">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder={config.titlePlaceholder}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="body">
          {config.bodyLabel}
        </label>
        <textarea
          id="body"
          name="body"
          rows={2}
          placeholder={config.bodyPlaceholder}
          className={`${fieldClass} resize-none`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="author">
          Your name
        </label>
        <input
          id="author"
          name="author"
          type="text"
          placeholder="e.g. Sam (optional)"
          className={fieldClass}
        />
      </div>

      {config.showImage && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Photo</span>
          {preview && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-zinc-300 hover:text-white"
              >
                ✕ Remove
              </button>
            </div>
          )}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm text-zinc-400 ring-1 ring-white/10 hover:bg-white/8 hover:text-zinc-200 transition-colors">
            📷 {preview ? "Change photo" : "Add a photo"}
            <input
              ref={fileRef}
              name="image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImage}
            />
          </label>
        </div>
      )}

      {config.showContact && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-300">
            How can people reach you?
          </span>
          <p className="text-xs text-zinc-500">Optional — replies work too.</p>
          <input
            name="phone"
            type="text"
            placeholder="Phone number (optional)"
            className={fieldClass}
          />
          <input
            name="email"
            type="text"
            placeholder="Email (optional)"
            className={fieldClass}
          />
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300 ring-1 ring-rose-400/20">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-400 active:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Posting…" : config.submitLabel}
      </button>
    </form>
  );
}
