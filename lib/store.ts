import { Redis } from "@upstash/redis";
import { LOCATION_IDS, type LocationBoard, type Report, type StatusKey } from "./types";

/**
 * Storage layer for machine reports.
 *
 * Each supermarket location gets its own capped Redis list (newest first),
 * keyed `reports:<locationId>`. Adding a location in lib/types.ts is enough —
 * its list is created lazily on the first report.
 *
 * If no Redis credentials are configured the module falls back to in-memory
 * arrays. That keeps `next dev` working with zero setup, but the data is lost
 * on every server restart, so production must have Upstash configured.
 */

const MAX_REPORTS = 50;

function keyFor(location: string): string {
  return `reports:${location}`;
}

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

export const isPersistent = redis !== null;

// In-memory fallback (dev only). One array per location, newest first.
const memory: Record<string, Report[]> = {};
let memoryVisitors = 0;

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function addReport(
  location: string,
  status: StatusKey
): Promise<Report> {
  const report: Report = { id: makeId(), status, ts: Date.now() };

  if (redis) {
    const key = keyFor(location);
    await redis.lpush(key, JSON.stringify(report));
    await redis.ltrim(key, 0, MAX_REPORTS - 1);
  } else {
    const list = (memory[location] ??= []);
    list.unshift(report);
    if (list.length > MAX_REPORTS) list.length = MAX_REPORTS;
  }

  return report;
}

export async function getReports(location: string): Promise<Report[]> {
  if (redis) {
    const raw = await redis.lrange<Report | string>(
      keyFor(location),
      0,
      MAX_REPORTS - 1
    );
    // @upstash/redis auto-parses JSON; tolerate both objects and strings.
    return raw
      .map((item) =>
        typeof item === "string" ? safeParse(item) : (item as Report)
      )
      .filter((r): r is Report => r !== null);
  }

  return [...(memory[location] ?? [])];
}

/** Fetch every location's board in one go, keyed by location id. */
export async function getAllBoards(): Promise<Record<string, LocationBoard>> {
  const entries = await Promise.all(
    LOCATION_IDS.map(async (id) => {
      const reports = await getReports(id);
      const board: LocationBoard = { latest: reports[0] ?? null, reports };
      return [id, board] as const;
    })
  );
  return Object.fromEntries(entries);
}

export async function incrementVisitors(): Promise<number> {
  if (redis) return await redis.incr("visitors");
  return ++memoryVisitors;
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
