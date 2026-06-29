/**
 * Shared helpers for the "phone · email" contact strings the boards store.
 * The marketplace, stays and threads stores all join a poster's phone and
 * email into a single field with " · "; these helpers split it back out and
 * produce light teasers so the raw value can be hidden until a reader opts in.
 */

export interface Contact {
  phone: string;
  email: string;
}

/** Split a stored "phone · email" contact string into its parts. */
export function splitContact(contact: string): Contact {
  const parts = contact.split(" · ");
  const email = parts.find((p) => p.includes("@")) ?? "";
  const phone = parts.find((p) => p && !p.includes("@")) ?? "";
  return { phone, email };
}

/** Teaser for a phone number, e.g. "•• •• •• 78" — keeps only the last 2 digits. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 2) return "•• •• ••";
  return `•• •• •• ${digits.slice(-2)}`;
}

/** Teaser for an email, e.g. "s•••@•••" — hides the address from harvesters. */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  const user = at === -1 ? email : email.slice(0, at);
  return `${user.slice(0, 1) || "•"}•••@•••`;
}
