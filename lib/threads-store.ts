import { Redis } from "@upstash/redis";

export type ThreadCategory = "lost-found" | "recommendations";

export const THREAD_CATEGORIES: ThreadCategory[] = [
  "lost-found",
  "recommendations",
];

export function isThreadCategory(value: unknown): value is ThreadCategory {
  return (
    typeof value === "string" &&
    (THREAD_CATEGORIES as string[]).includes(value)
  );
}

export interface Reply {
  id: string;
  /** Optional display name of the responder. */
  author: string;
  body: string;
  ts: number;
}

export interface Thread {
  id: string;
  category: ThreadCategory;
  /** For lost-found: "lost" | "found". Empty for recommendations. */
  kind: string;
  author: string;
  title: string;
  body: string;
  contact: string;
  /** Optional photo as a data URL (used by lost-and-found). */
  imageUrl: string | null;
  replies: Reply[];
  ts: number;
}

interface StoredThread extends Thread {
  /** Secret only the poster knows; lets them delete their own thread. */
  token: string;
}

/**
 * Storage layer for threaded posts (Lost & Found, Recommendations).
 *
 * Mirrors the other stores: every thread lives in a single Redis hash keyed
 * `threads`, each field being the thread id and the value its JSON (including
 * the delete token and the replies array). Replies are add-only; the thread
 * owner can remove the whole thread. With no Redis credentials it falls back to
 * an in-memory map so `next dev` works with zero setup.
 */

const HASH_KEY = "threads";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

export const isThreadsPersistent = redis !== null;

// In-memory fallback (dev only).
const memory = new Map<string, StoredThread>();

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function strip(stored: StoredThread): Thread {
  const { token: _t, ...thread } = stored;
  void _t;
  return thread;
}

function coerce(value: StoredThread | string | null): StoredThread | null {
  if (!value) return null;
  const parsed = typeof value === "string" ? safeParse(value) : value;
  if (parsed && typeof parsed.ts === "number" && parsed.title && parsed.category) {
    // Tolerate older records without a replies array or image field.
    if (!Array.isArray(parsed.replies)) parsed.replies = [];
    if (typeof parsed.imageUrl !== "string") parsed.imageUrl = null;
    return parsed;
  }
  return null;
}

async function readThread(id: string): Promise<StoredThread | null> {
  if (redis) {
    return coerce(await redis.hget<StoredThread | string>(HASH_KEY, id));
  }
  return memory.get(id) ?? null;
}

async function writeThread(thread: StoredThread): Promise<void> {
  if (redis) {
    await redis.hset(HASH_KEY, { [thread.id]: JSON.stringify(thread) });
  } else {
    memory.set(thread.id, thread);
  }
}

export async function addThread(
  data: Omit<Thread, "id" | "ts" | "replies">,
  token: string
): Promise<Thread> {
  const stored: StoredThread = {
    ...data,
    id: makeId(),
    ts: Date.now(),
    replies: [],
    token,
  };
  await writeThread(stored);
  return strip(stored);
}

export async function getThreads(
  category: ThreadCategory
): Promise<Thread[]> {
  let all: StoredThread[];

  if (redis) {
    const map = await redis.hgetall<Record<string, StoredThread | string>>(
      HASH_KEY
    );
    all = map
      ? (Object.values(map)
          .map(coerce)
          .filter((t): t is StoredThread => t !== null))
      : [];
  } else {
    all = [...memory.values()];
  }

  return all
    .filter((t) => t.category === category)
    .sort((a, b) => b.ts - a.ts)
    .map(strip);
}

export async function deleteThread(
  id: string,
  token: string
): Promise<boolean> {
  const stored = await readThread(id);
  if (!stored || stored.token !== token) return false;

  if (redis) {
    await redis.hdel(HASH_KEY, id);
  } else {
    memory.delete(id);
  }
  return true;
}

export async function addReply(
  threadId: string,
  data: { author: string; body: string }
): Promise<Thread | null> {
  const stored = await readThread(threadId);
  if (!stored) return null;

  const reply: Reply = {
    id: makeId(),
    author: data.author,
    body: data.body,
    ts: Date.now(),
  };
  stored.replies = [...stored.replies, reply];
  await writeThread(stored);
  return strip(stored);
}

function safeParse(value: string): StoredThread | null {
  try {
    return JSON.parse(value) as StoredThread;
  } catch {
    return null;
  }
}
