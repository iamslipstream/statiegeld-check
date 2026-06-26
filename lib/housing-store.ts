import { Redis } from "@upstash/redis";

export interface HousingRequest {
  id: string;
  /** Name of the person looking for a place. */
  name: string;
  /** Desired move-in date, ISO yyyy-mm-dd. */
  fromDate: string;
  /** Desired move-out date, ISO yyyy-mm-dd. */
  toDate: string;
  /** Whether the dates are flexible. */
  flexible: boolean;
  /** What the requester does for a living. */
  profession: string;
  /** How many people will stay (free text, e.g. "2 adults"). */
  guests: string;
  /** Budget per month/period (free text). */
  budget: string;
  /** Anything else they want to say. */
  message: string;
  /** Phone / email joined for display. */
  contact: string;
  ts: number;
}

interface StoredRequest extends HousingRequest {
  /** Secret only the poster knows; lets them delete their own request. */
  token: string;
}

/**
 * Storage layer for short-term housing requests.
 *
 * Mirrors lib/marketplace-store.ts: requests live in a single Redis hash keyed
 * `housing_requests`, each field being the request id and the value its JSON
 * (including the delete token). With no Redis credentials it falls back to an
 * in-memory map so `next dev` works with zero setup (data is lost on restart).
 */

const HASH_KEY = "housing_requests";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

export const isHousingPersistent = redis !== null;

// In-memory fallback (dev only).
const memory = new Map<string, StoredRequest>();

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function strip(stored: StoredRequest): HousingRequest {
  const { token: _t, ...request } = stored;
  void _t;
  return request;
}

function coerce(value: StoredRequest | string | null): StoredRequest | null {
  if (!value) return null;
  const parsed = typeof value === "string" ? safeParse(value) : value;
  if (parsed && typeof parsed.ts === "number" && parsed.fromDate) return parsed;
  return null;
}

export async function addRequest(
  data: Omit<HousingRequest, "id" | "ts">,
  token: string
): Promise<HousingRequest> {
  const stored: StoredRequest = { ...data, id: makeId(), ts: Date.now(), token };

  if (redis) {
    await redis.hset(HASH_KEY, { [stored.id]: JSON.stringify(stored) });
  } else {
    memory.set(stored.id, stored);
  }

  return strip(stored);
}

export async function getRequests(): Promise<HousingRequest[]> {
  let all: StoredRequest[];

  if (redis) {
    const map = await redis.hgetall<Record<string, StoredRequest | string>>(
      HASH_KEY
    );
    all = map
      ? (Object.values(map)
          .map(coerce)
          .filter((r): r is StoredRequest => r !== null))
      : [];
  } else {
    all = [...memory.values()];
  }

  return all.sort((a, b) => b.ts - a.ts).map(strip);
}

/**
 * Update an existing request in place. Only succeeds if the supplied token
 * matches the one stored with the request (i.e. the poster). Returns the
 * updated request, or null if it doesn't exist / the token is wrong.
 */
export async function updateRequest(
  id: string,
  token: string,
  data: Omit<HousingRequest, "id" | "ts">
): Promise<HousingRequest | null> {
  if (redis) {
    const raw = await redis.hget<StoredRequest | string>(HASH_KEY, id);
    const stored = coerce(raw);
    if (!stored || stored.token !== token) return null;
    const updated: StoredRequest = { ...stored, ...data, id, token, ts: stored.ts };
    await redis.hset(HASH_KEY, { [id]: JSON.stringify(updated) });
    return strip(updated);
  }

  const stored = memory.get(id);
  if (!stored || stored.token !== token) return null;
  const updated: StoredRequest = { ...stored, ...data, id, token, ts: stored.ts };
  memory.set(id, updated);
  return strip(updated);
}

export async function deleteRequest(
  id: string,
  token: string
): Promise<boolean> {
  if (redis) {
    const raw = await redis.hget<StoredRequest | string>(HASH_KEY, id);
    const stored = coerce(raw);
    if (!stored || stored.token !== token) return false;
    await redis.hdel(HASH_KEY, id);
    return true;
  }

  const stored = memory.get(id);
  if (!stored || stored.token !== token) return false;
  memory.delete(id);
  return true;
}

function safeParse(value: string): StoredRequest | null {
  try {
    return JSON.parse(value) as StoredRequest;
  } catch {
    return null;
  }
}
