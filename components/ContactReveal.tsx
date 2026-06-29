"use client";

import { useState } from "react";
import { maskPhone, maskEmail } from "@/lib/contact";

/**
 * Hides a poster's phone/email behind an opt-in reveal. Until the reader taps,
 * only a masked teaser is shown — the raw value isn't rendered as visible text
 * or a tel:/mailto: link, which keeps it out of reach of casual scrapers. Once
 * revealed it offers a call/mail action plus copy-to-clipboard.
 *
 * Shared by the Marketplace and Stays cards so both behave identically.
 */
export function ContactReveal({
  phone,
  email,
  label = "Contact seller",
}: {
  phone?: string;
  email?: string;
  label?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  const hasPhone = Boolean(phone);
  const hasEmail = Boolean(email);
  if (!hasPhone && !hasEmail) return null;

  if (!revealed) {
    const hint = hasPhone ? maskPhone(phone!) : maskEmail(email!);
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200 ring-1 ring-emerald-400/25 transition-colors hover:bg-emerald-500/20"
      >
        <span aria-hidden>📬</span>
        {label}
        <span className="font-normal text-emerald-300/60" aria-hidden>
          · {hint}
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {hasPhone && (
        <ContactRow
          kind="phone"
          value={phone!}
          href={`tel:${phone!.replace(/\s+/g, "")}`}
        />
      )}
      {hasEmail && (
        <ContactRow kind="email" value={email!} href={`mailto:${email!}`} />
      )}
    </div>
  );
}

function ContactRow({
  kind,
  value,
  href,
}: {
  kind: "phone" | "email";
  value: string;
  href: string;
}) {
  const [copied, setCopied] = useState(false);

  const tone =
    kind === "phone"
      ? "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25"
      : "bg-sky-500/10 text-sky-200 ring-sky-400/25";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the link still works */
    }
  };

  return (
    <div className={`flex items-stretch overflow-hidden rounded-xl ring-1 ${tone}`}>
      <a
        href={href}
        className="flex min-w-0 flex-1 items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5"
      >
        <span aria-hidden>{kind === "phone" ? "📞" : "✉️"}</span>
        <span className="truncate">{value}</span>
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${kind === "phone" ? "number" : "email"}`}
        className="shrink-0 border-l border-white/10 px-3 text-xs font-medium transition-colors hover:bg-white/5"
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}
