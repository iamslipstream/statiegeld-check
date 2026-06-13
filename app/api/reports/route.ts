import { NextResponse } from "next/server";
import { addReport, getAllBoards } from "@/lib/store";
import { isLocationId, isStatusKey, type AppData } from "@/lib/types";

export const dynamic = "force-dynamic";

async function buildAppData(): Promise<AppData> {
  const boards = await getAllBoards();
  return { now: Date.now(), boards };
}

export async function GET() {
  try {
    const data = await buildAppData();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("GET /api/reports failed", err);
    return NextResponse.json(
      { error: "Could not load reports." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { location, status } = (body ?? {}) as {
    location?: unknown;
    status?: unknown;
  };

  if (!isLocationId(location)) {
    return NextResponse.json({ error: "Unknown location." }, { status: 400 });
  }
  if (!isStatusKey(status)) {
    return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  }

  try {
    await addReport(location, status);
    const data = await buildAppData();
    return NextResponse.json(data, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("POST /api/reports failed", err);
    return NextResponse.json(
      { error: "Could not save your report." },
      { status: 500 }
    );
  }
}
