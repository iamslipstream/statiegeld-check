"use client";

import { useRef, useState } from "react";
import { compressImage } from "@/lib/image";
import { FormReassurance } from "@/components/FormReassurance";
import type { Listing } from "@/lib/marketplace-store";

const BUILDINGS = ["North", "West", "East"] as const;

function makeToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const fieldClass =
  "rounded-xl bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/50";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ListingForm({
  onCreated,
}: {
  onCreated: (listing: Listing, token: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [building, setBuilding] = useState("");
  const [apartment, setApartment] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Validation
  const titleOk = title.trim().length > 0;
  const buildingOk = building.length > 0;
  const emailOk = email.trim() === "" || EMAIL_RE.test(email.trim());
  const hasContact = phone.trim() !== "" || email.trim() !== "";
  const canSubmit =
    titleOk && buildingOk && emailOk && hasContact && !submitting;

  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const processFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      setPreview(await compressImage(file));
    } catch {
      setError("Could not read that image. Try a different photo.");
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void processFile(e.dataTransfer.files?.[0]);
  };

  const removePhoto = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ title: true, building: true, contact: true, email: true });
    if (!canSubmit) return;

    setError(null);
    setSubmitting(true);
    const token = makeToken();
    try {
      const payload = {
        title: title.trim(),
        building,
        apartment: apartment.trim(),
        price: price.trim(),
        description: description.trim(),
        phone: phone.trim(),
        email: email.trim(),
        image: preview ?? "",
        token,
      };
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let body: Partial<Listing> & { error?: string } = {};
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        /* non-JSON response (e.g. a server error page) — handled below */
      }
      if (!res.ok) {
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      onCreated(body as Listing, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post your ad.");
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">
          Post an item for sale
        </h2>
        <div className="mt-1.5">
          <FormReassurance />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="title">
          What are you selling? <span className="text-rose-400">*</span>
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => touch("title")}
          type="text"
          aria-invalid={touched.title && !titleOk}
          placeholder="e.g. IKEA bookshelf, baby stroller, bicycle…"
          className={fieldClass}
        />
        {touched.title && !titleOk && (
          <p className="text-xs text-rose-300">Please add what you’re selling.</p>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300" htmlFor="building">
            Building <span className="text-rose-400">*</span>
          </label>
          <select
            id="building"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            onBlur={() => touch("building")}
            aria-invalid={touched.building && !buildingOk}
            className="appearance-none rounded-xl bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/50"
          >
            <option value="" disabled>
              Select…
            </option>
            {BUILDINGS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {touched.building && !buildingOk && (
            <p className="text-xs text-rose-300">Pick a building.</p>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label
            className="text-sm font-medium text-zinc-300"
            htmlFor="apartment"
          >
            Apartment
          </label>
          <input
            id="apartment"
            value={apartment}
            onChange={(e) => setApartment(e.target.value)}
            type="text"
            placeholder="e.g. 4B, 12, 301 (optional)"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="price">
          Price
        </label>
        <input
          id="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="text"
          placeholder='e.g. €15 or "Free"'
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          className="text-sm font-medium text-zinc-300"
          htmlFor="description"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Condition, size, any details…"
          className={`${fieldClass} resize-none`}
        />
      </div>

      {/* Photo — prominent dropzone with drag-and-drop + preview */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-300">Photo</span>
        <input
          ref={fileRef}
          id="listing-photo"
          name="image"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void processFile(e.target.files?.[0])}
        />
        {preview ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute right-2 top-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-zinc-100 transition-colors hover:bg-black/80"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={removePhoto}
                className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-zinc-100 transition-colors hover:bg-black/80"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="listing-photo"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
              dragging
                ? "border-emerald-400/60 bg-emerald-500/10"
                : "border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/5"
            }`}
          >
            <span className="text-3xl" aria-hidden>
              📷
            </span>
            <span className="text-sm font-medium text-zinc-200">
              Drag a photo here, or tap to browse
            </span>
            <span className="text-xs text-zinc-400">
              A clear photo helps it sell faster
            </span>
          </label>
        )}
      </div>

      {/* Contact — at least one required */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-300">
          How can buyers reach you? <span className="text-rose-400">*</span>
        </span>
        <p
          className={`text-xs ${
            touched.contact && !hasContact ? "text-rose-300" : "text-zinc-400"
          }`}
        >
          {touched.contact && !hasContact
            ? "Add a phone number or email so buyers can reach you."
            : "Leave at least one so interested buyers can contact you."}
        </p>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => touch("contact")}
          type="text"
          inputMode="tel"
          placeholder="Phone number (e.g. 06 12345678)"
          className={fieldClass}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => {
            touch("contact");
            touch("email");
          }}
          type="email"
          placeholder="Email address"
          className={fieldClass}
        />
        {touched.email && !emailOk && (
          <p className="text-xs text-rose-300">That email doesn’t look right.</p>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300 ring-1 ring-rose-400/20">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 active:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Posting…" : "Publish Ad"}
      </button>

      <p className="text-center text-xs text-zinc-400">
        Fields marked <span className="text-rose-400">*</span> are required · Only
        you can remove your listing
      </p>
    </form>
  );
}
