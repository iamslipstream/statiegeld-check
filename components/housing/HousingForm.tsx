"use client";

import { useState } from "react";
import { splitContact } from "@/lib/contact";
import { FormReassurance } from "@/components/FormReassurance";
import type { HousingRequest } from "@/lib/housing-store";

function makeToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const fieldClass =
  "rounded-xl bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/50";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const [name, setName] = useState(request?.name ?? "");
  const [fromDate, setFromDate] = useState(request?.fromDate ?? "");
  const [toDate, setToDate] = useState(request?.toDate ?? "");
  const [flexible, setFlexible] = useState(request?.flexible ?? false);
  const [profession, setProfession] = useState(request?.profession ?? "");
  const [guests, setGuests] = useState(request?.guests ?? "");
  const [budget, setBudget] = useState(request?.budget ?? "");
  const [message, setMessage] = useState(request?.message ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameOk = name.trim().length > 0;
  const fromOk = fromDate !== "";
  const toOk = toDate !== "";
  const orderOk = !fromOk || !toOk || toDate >= fromDate;
  const emailOk = email.trim() === "" || EMAIL_RE.test(email.trim());
  const hasContact = phone.trim() !== "" || email.trim() !== "";
  const canSubmit =
    nameOk && fromOk && toOk && orderOk && emailOk && hasContact && !submitting;

  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({
      name: true,
      fromDate: true,
      toDate: true,
      contact: true,
      email: true,
    });
    if (!canSubmit) return;

    setError(null);
    setSubmitting(true);
    const token = isEdit ? (editToken as string) : makeToken();
    try {
      const payload = {
        name: name.trim(),
        fromDate,
        toDate,
        flexible,
        profession: profession.trim(),
        guests: guests.trim(),
        budget: budget.trim(),
        message: message.trim(),
        phone: phone.trim(),
        email: email.trim(),
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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your request."
      );
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
          {isEdit ? "Edit your request" : "Request a short-term place"}
        </h2>
        {!isEdit && (
          <p className="mt-1 text-xs text-zinc-400">
            Looking to stay for a while? Post what you need and neighbours with a
            free apartment can reach out.
          </p>
        )}
        <div className="mt-1.5">
          <FormReassurance />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="name">
          Your name <span className="text-rose-400">*</span>
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => touch("name")}
          type="text"
          aria-invalid={touched.name && !nameOk}
          placeholder="e.g. Sam"
          className={fieldClass}
        />
        {touched.name && !nameOk && (
          <p className="text-xs text-rose-300">Please add your name.</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label
              className="text-sm font-medium text-zinc-300"
              htmlFor="fromDate"
            >
              From <span className="text-rose-400">*</span>
            </label>
            <input
              id="fromDate"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              onBlur={() => touch("fromDate")}
              type="date"
              aria-invalid={touched.fromDate && !fromOk}
              className={`${fieldClass} [color-scheme:dark]`}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label
              className="text-sm font-medium text-zinc-300"
              htmlFor="toDate"
            >
              To <span className="text-rose-400">*</span>
            </label>
            <input
              id="toDate"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              onBlur={() => touch("toDate")}
              type="date"
              aria-invalid={touched.toDate && (!toOk || !orderOk)}
              className={`${fieldClass} [color-scheme:dark]`}
            />
          </div>
        </div>
        {touched.fromDate && !fromOk && (
          <p className="text-xs text-rose-300">Pick a start date.</p>
        )}
        {touched.toDate && !toOk && (
          <p className="text-xs text-rose-300">Pick an end date.</p>
        )}
        {toOk && fromOk && !orderOk && (
          <p className="text-xs text-rose-300">
            The end date is before the start date.
          </p>
        )}
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
        <div className="flex flex-1 flex-col gap-1.5">
          <label
            className="text-sm font-medium text-zinc-300"
            htmlFor="profession"
          >
            Profession
          </label>
          <input
            id="profession"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            type="text"
            placeholder="e.g. Nurse, Student…"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300" htmlFor="guests">
            People
          </label>
          <input
            id="guests"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            type="text"
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
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          type="text"
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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="A bit about you, why you need a place, pets, etc."
          className={`${fieldClass} resize-none`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-300">
          How can people reach you? <span className="text-rose-400">*</span>
        </span>
        <p
          className={`text-xs ${
            touched.contact && !hasContact ? "text-rose-300" : "text-zinc-400"
          }`}
        >
          {touched.contact && !hasContact
            ? "Add a phone number or email so hosts can reach you."
            : "Add at least one."}
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

      <div className="flex gap-3">
        {isEdit && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/15"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 active:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Post request"}
        </button>
      </div>

      {!isEdit && (
        <p className="text-center text-xs text-zinc-400">
          Fields marked <span className="text-rose-400">*</span> are required ·
          Only you can edit or remove your request
        </p>
      )}
    </form>
  );
}
