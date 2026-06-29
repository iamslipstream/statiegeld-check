/**
 * A small, calm reassurance shown at the top of every posting form (and near
 * the first posting action) to reduce first-poster hesitation. Mirrors the
 * footer trust badges without shouting.
 */
export function FormReassurance() {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-zinc-400">
      <span className="inline-flex items-center gap-1">
        <span aria-hidden>🔓</span> No login
      </span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <span aria-hidden>🕶️</span> Anonymous
      </span>
      <span aria-hidden>·</span>
      <span>only you can edit or remove it</span>
    </p>
  );
}
