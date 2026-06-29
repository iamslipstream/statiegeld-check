/**
 * Shared copy helpers so count labels read the same warm way on every tab:
 * "{n} {noun}" with correct singular/plural, and a friendly zero-state phrase.
 */
export function countLabel(
  n: number,
  one: string,
  many: string,
  zero: string
): string {
  if (n === 0) return zero;
  return `${n} ${n === 1 ? one : many}`;
}
