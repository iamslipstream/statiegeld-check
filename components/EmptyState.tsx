/**
 * A consistent empty state — illustration + headline + helper text + a single
 * optional CTA. Extracted from the original Lost & Found empty state and shared
 * across every tab so the zero-data moments feel the same everywhere.
 */
export function EmptyState({
  emoji,
  title,
  text,
  cta,
}: {
  emoji: string;
  title: string;
  text: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-2xl bg-white/5 p-10 text-center ring-1 ring-white/10">
      <div className="text-5xl" aria-hidden>
        {emoji}
      </div>
      <h3 className="mt-3 text-lg font-semibold text-zinc-200">{title}</h3>
      <p className="mx-auto mt-1 max-w-xs text-sm text-zinc-400">{text}</p>
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
