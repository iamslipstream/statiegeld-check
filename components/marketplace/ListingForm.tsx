"use client";

import { useRef, useState } from "react";
import type { Listing } from "@/lib/marketplace-store";

const BUILDINGS = ["North", "West", "East"] as const;

function makeToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Downscale and re-encode an image to a compact JPEG data URL so it fits well
 * within the storage request limit. Returns a data URL string.
 */
async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1100;
  let { width, height } = bitmap;
  if (Math.max(width, height) > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.72;
  let url = canvas.toDataURL("image/jpeg", quality);
  // Shrink quality until the encoded size is comfortably under ~800 KB.
  while (url.length > 800 * 1024 && quality > 0.4) {
    quality -= 0.1;
    url = canvas.toDataURL("image/jpeg", quality);
  }
  return url;
}

export function ListingForm({
  onCreated,
}: {
  onCreated: (listing: Listing, token: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setPreview(null); return; }
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
        title: fd.get("title"),
        building: fd.get("building"),
        apartment: fd.get("apartment"),
        price: fd.get("price"),
        description: fd.get("description"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        image: preview ?? "",
        token,
      };
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let body: (Partial<Listing> & { error?: string }) = {};
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        /* non-JSON response (e.g. a server error page) — handled below */
      }
      if (!res.ok) {
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      onCreated(body as Listing, token);
      form.reset();
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post your ad.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5 flex flex-col gap-4"
    >
      <h2 className="text-lg font-semibold text-zinc-100">Post an item for sale</h2>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="title">
          What are you selling? <span className="text-rose-400">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. IKEA bookshelf, baby stroller, bicycle…"
          className="rounded-xl bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/50"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-medium text-zinc-300" htmlFor="building">
            Building <span className="text-rose-400">*</span>
          </label>
          <select
            id="building"
            name="building"
            required
            defaultValue=""
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/50 appearance-none"
          >
            <option value="" disabled>Select…</option>
            {BUILDINGS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-medium text-zinc-300" htmlFor="apartment">
            Apartment
          </label>
          <input
            id="apartment"
            name="apartment"
            type="text"
            placeholder="e.g. 4B, 12, 301 (optional)"
            className="rounded-xl bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="price">
          Price
        </label>
        <input
          id="price"
          name="price"
          type="text"
          placeholder='e.g. €15 or "Free"'
          className="rounded-xl bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="Condition, size, any details…"
          className="resize-none rounded-xl bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-300">How can buyers reach you?</span>
        <p className="text-xs text-zinc-500">Leave at least one so interested buyers can contact you.</p>
        <input
          name="phone"
          type="text"
          placeholder="Phone number (e.g. 06 12345678)"
          className="rounded-xl bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/50"
        />
        <input
          name="email"
          type="text"
          placeholder="Email address"
          className="rounded-xl bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/50"
        />
      </div>

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
        {submitting ? "Posting…" : "Publish Ad"}
      </button>

      <p className="text-center text-xs text-zinc-600">
        Fields marked <span className="text-rose-400">*</span> are required · No phone number needed · Only you can remove your listing
      </p>
    </form>
  );
}
