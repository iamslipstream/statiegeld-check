import type { HousingRequest } from "@/lib/housing-store";

/** The fields of a request, minus the server-managed id/ts. */
export type RequestData = Omit<HousingRequest, "id" | "ts">;

export type ParseResult =
  | { ok: true; data: RequestData; token: string }
  | { ok: false; error: string };

/** A plausible yyyy-mm-dd string. */
function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * Parse and validate a housing-request JSON body shared by create (POST) and
 * edit (PATCH). Returns the cleaned fields plus the caller's token, or an error
 * message suitable for a 400 response.
 */
export function parseRequestBody(body: Record<string, unknown>): ParseResult {
  const str = (key: string) =>
    typeof body[key] === "string" ? (body[key] as string).trim() : "";

  const name = str("name");
  const fromDate = str("fromDate");
  const toDate = str("toDate");
  const flexible = body.flexible === true;

  if (!name) return { ok: false, error: "Your name is required." };
  if (!isDate(fromDate)) return { ok: false, error: "A valid from date is required." };
  if (!isDate(toDate)) return { ok: false, error: "A valid to date is required." };
  if (Date.parse(toDate) < Date.parse(fromDate)) {
    return { ok: false, error: "The to date can't be before the from date." };
  }

  const phone = str("phone");
  const email = str("email");
  const contact = [phone, email].filter(Boolean).join(" · ");
  if (!contact) {
    return { ok: false, error: "Add a phone number or email so people can reach you." };
  }

  const token = str("token");
  if (!token) return { ok: false, error: "Missing token." };

  return {
    ok: true,
    token,
    data: {
      name,
      fromDate,
      toDate,
      flexible,
      profession: str("profession"),
      guests: str("guests"),
      budget: str("budget"),
      message: str("message"),
      contact,
    },
  };
}
