import { NextResponse } from "next/server";
import { deleteRequest, updateRequest } from "@/lib/housing-store";
import { parseRequestBody } from "@/lib/housing-payload";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const updated = await updateRequest(id, parsed.token, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const removed = await deleteRequest(id, token);
  if (!removed) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
