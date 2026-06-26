import { Redis } from "@upstash/redis";

export type Building = "North" | "West" | "East";

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: string;
  building: Building;
  apartment: string;
  contact: string;
  imageUrl: string | null;
  ts: number;
}

interface StoredListing extends Listing {
  /** Secret only the poster knows; lets them delete their own listing. */
  token: string;
}

/**
 * Storage layer for marketplace listings.
 *
 * Listings live in a single Redis hash keyed `listings`, with each field being
 * the listing id and the value its JSON (including the delete token). A hash
 * lets us delete an individual listing by id, which a Redis list can't do
 * cleanly. Mirrors the Upstash setup in lib/store.ts and reuses the same
 * credentials.
 *
 * With no Redis credentials it falls back to an in-memory map so `next dev`
 * works with zero setup (data is lost on restart). Production has Upstash
 * configured, so listings persist.
 */

const HASH_KEY = "listings";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

export const isListingPersistent = redis !== null;

// In-memory fallback (dev only).
const memory = new Map<string, StoredListing>();

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function strip(stored: StoredListing): Listing {
  const { token: _t, ...listing } = stored;
  void _t;
  return listing;
}

function coerce(value: StoredListing | string | null): StoredListing | null {
  if (!value) return null;
  // @upstash/redis usually auto-parses JSON, but tolerate raw strings too.
  const parsed = typeof value === "string" ? safeParse(value) : value;
  if (parsed && typeof parsed.ts === "number" && parsed.title) return parsed;
  return null;
}

export async function addListing(
  data: Omit<Listing, "id" | "ts">,
  token: string
): Promise<Listing> {
  const stored: StoredListing = { ...data, id: makeId(), ts: Date.now(), token };

  if (redis) {
    await redis.hset(HASH_KEY, { [stored.id]: JSON.stringify(stored) });
  } else {
    memory.set(stored.id, stored);
  }

  return strip(stored);
}

export async function getListings(): Promise<Listing[]> {
  let all: StoredListing[];

  if (redis) {
    const map = await redis.hgetall<Record<string, StoredListing | string>>(
      HASH_KEY
    );
    all = map
      ? (Object.values(map)
          .map(coerce)
          .filter((l): l is StoredListing => l !== null))
      : [];
  } else {
    all = [...memory.values()];
  }

  return all.sort((a, b) => b.ts - a.ts).map(strip);
}

export async function deleteListing(
  id: string,
  token: string
): Promise<boolean> {
  if (redis) {
    const raw = await redis.hget<StoredListing | string>(HASH_KEY, id);
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

function safeParse(value: string): StoredListing | null {
  try {
    return JSON.parse(value) as StoredListing;
  } catch {
    return null;
  }
}
