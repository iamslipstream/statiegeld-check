"use client";

import { useState } from "react";
import type { HousingRequest } from "@/lib/housing-store";

function makeToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Split a stored "phone · email" contact string back into its parts. */
function splitContact(contact: string): { phone: string; email: string } {
  const parts = contact.split(" · ");
  const email = parts.find((p) => p.includes("@")) ?? "";
  const phone = parts.find((p) => p && !p.includes("@")) ?? "";
  return { phone, email };
}

const fieldClass =
  "rounded-xl bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/50";

export function HousingForm({
  request,
  token: editToken,
  onSaved,
  onCancel,
}: {
  /** When provided, the form edits this request instead of creating a new one. */
  request?: HousingRequest;
  /** The owner token for the request being edited. */
  token?: string;
  onSaved: (request: HousingRequest, token: string) => void;
  onCancel?: () => void;
}) {
  const isEdit = Boolean(request && editToken);
  const existing = request ? splitContact(request.contact) : null;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flexible, setFlexible] = useState(request?.flexible ?? false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const token = isEdit ? (editToken as string) : makeToken();
    try {
      const form = e.currentTarget;
      const fd = new FormData(form);
      const payload = {
        name: fd.get("name"),
        fromDate: fd.get("fromDate"),
        toDate: fd.get("toDate"),
        flexible,
        profession: fd.get("profession"),
        guests: fd.get("guests"),
        budget: fd.get("budget"),
        message: fd.get("message"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        token,
      };
      const res = await fetch(
        isEdit ? `/api/housing/${request!.id}` : "/api/housing",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const text = await res.text();
      let body: Partial<HousingRequest> & { error?: string } = {};
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        /* non-JSON response — handled below */
      }
      if (!res.ok) {
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      onSaved(body as HousingRequest, token);
      if (!isEdit) {
        form.reset();
        setFlexible(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5 flex flex-col gap-4"
    >
      <h2 className="text-lg font-semibold text-zinc-100">
        {isEdit ? "Edit your request" : "Request a short-term place"}
      </h2>
      {!isEdit && (
        <p className="-mt-2 text-xs text-zinc-500">
          Looking to stay in the building for a while? Post what you need and
          neighbours with a free apartment can reach out.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="name">
          Your name <span className="text-rose-400">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={request?.name ?? ""}
          placeholder="e.g. Sam"
          className={fieldClass}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-medium text-zinc-300" htmlFor="fromDate">
            From <span className="text-rose-400">*</span>
          </label>
          <input
            id="fromDate"
            name="fromDate"
            type="date"
            required
            defaultValue={request?.fromDate ?? ""}
            className={`${fieldClass} [color-scheme:dark]`}
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-medium text-zinc-300" htmlFor="toDate">
            To <span className="text-rose-400">*</span>
          </label>
          <input
            id="toDate"
            name="toDate"
            type="date"
            required
            defaultValue={request?.toDate ?? ""}
            className={`${fieldClass} [color-scheme:dark]`}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={flexible}
          onChange={(e) => setFlexible(e.target.checked)}
          className="h-4 w-4 accent-emerald-500"
        />
        My dates are flexible
      </label>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-medium text-zinc-300" htmlFor="profession">
            Profession
          </label>
          <input
            id="profession"
            name="profession"
            type="text"
            defaultValue={request?.profession ?? ""}
            placeholder="e.g. Nurse, Student…"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-medium text-zinc-300" htmlFor="guests">
            People
          </label>
          <input
            id="guests"
            name="guests"
            type="text"
            defaultValue={request?.guests ?? ""}
            placeholder="e.g. 2 adults"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="budget">
          Budget
        </label>
        <input
          id="budget"
          name="budget"
          type="text"
          defaultValue={request?.budget ?? ""}
          placeholder="e.g. €1200 / month"
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="message">
          Anything else?
        </label>
        <textarea
          id="message"
          name="message"
          rows={2}
          defaultValue={request?.message ?? ""}
          placeholder="A bit about you, why you need a place, pets, etc."
          className={`${fieldClass} resize-none`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-300">
          How can people reach you? <span className="text-rose-400">*</span>
        </span>
        <p className="text-xs text-zinc-500">Add at least one.</p>
        <input
          name="phone"
          type="text"
          defaultValue={existing?.phone ?? ""}
          placeholder="Phone number (e.g. 06 12345678)"
          className={fieldClass}
        />
        <input
          name="email"
          type="text"
          defaultValue={existing?.email ?? ""}
          placeholder="Email address"
          className={fieldClass}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300 ring-1 ring-rose-400/20">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        {isEdit && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/15 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-400 active:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Post request"}
        </button>
      </div>

      {!isEdit && (
        <p className="text-center text-xs text-zinc-600">
          Fields marked <span className="text-rose-400">*</span> are required ·
          No login · Only you can edit or remove your request
        </p>
      )}
    </form>
  );
}
