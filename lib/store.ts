import { Redis } from "@upstash/redis";
import type { Report, StatusKey } from "./types";

/**
 * Storage layer for machine reports.
 *
 * Reports live in a single capped Redis list (newest first). We keep the data
 * model deliberately tiny — there is one machine, so one key is enough.
 *
 * If no Redis credentials are configured the module falls back to an in-memory
 * array. That keeps `next dev` working with zero setup, but the data is lost on
 * every server restart, so production must have Upstash configured.
 */

const KEY = "reports";
const MAX_REPORTS = 50;

function getRedis(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

export const isPersistent = redis !== null;

// In-memory fallback (dev only). Newest first to mirror the Redis list order.
const memory: Report[] = [];

function makeId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export async function addReport(status: StatusKey): Promise<Report> {
  const report: Report = { id: makeId(), status, ts: Date.now() };

  if (redis) {
    await redis.lpush(KEY, JSON.stringify(report));
    await redis.ltrim(KEY, 0, MAX_REPORTS - 1);
  } else {
    memory.unshift(report);
    if (memory.length > MAX_REPORTS) memory.length = MAX_REPORTS;
  }

  return report;
}

export async function getReports(): Promise<Report[]> {
  if (redis) {
    const raw = await redis.lrange<Report | string>(KEY, 0, MAX_REPORTS - 1);
    // @upstash/redis auto-parses JSON; tolerate both objects and strings.
    return raw
      .map((item) =>
        typeof item === "string" ? safeParse(item) : (item as Report)
      )
      .filter((r): r is Report => r !== null);
  }

  return [...memory];
}

function safeParse(value: string): Report | null {
  try {
    const parsed = JSON.parse(value) as Report;
    if (parsed && typeof parsed.ts === "number" && parsed.status) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
