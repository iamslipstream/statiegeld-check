import { NextResponse } from "next/server";
import { addRequest, getRequests } from "@/lib/housing-store";
import { parseRequestBody } from "@/lib/housing-payload";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getRequests(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = parseRequestBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const created = await addRequest(parsed.data, parsed.token);
  return NextResponse.json(created, { status: 201 });
}
