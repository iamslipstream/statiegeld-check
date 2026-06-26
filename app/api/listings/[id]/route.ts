import { NextResponse } from "next/server";
import { deleteListing } from "@/lib/marketplace-store";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const removed = await deleteListing(id, token);
  if (!removed) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
