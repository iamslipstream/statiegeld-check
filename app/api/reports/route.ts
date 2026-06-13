import { NextResponse } from "next/server";
import { addReport, getReports } from "@/lib/store";
import { isStatusKey, type BoardData } from "@/lib/types";

export const dynamic = "force-dynamic";

async function buildBoard(): Promise<BoardData> {
  const reports = await getReports();
  return {
    latest: reports[0] ?? null,
    reports,
    now: Date.now(),
  };
}

export async function GET() {
  try {
    const board = await buildBoard();
    return NextResponse.json(board, {
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

  const status = (body as { status?: unknown })?.status;
  if (!isStatusKey(status)) {
    return NextResponse.json(
      { error: "Unknown status." },
      { status: 400 }
    );
  }

  try {
    await addReport(status);
    const board = await buildBoard();
    return NextResponse.json(board, {
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
