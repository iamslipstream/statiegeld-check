import { NextResponse } from "next/server";
import { addReply } from "@/lib/threads-store";

export const dynamic = "force-dynamic";

export async function POST(
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

  const str = (key: string) =>
    typeof body[key] === "string" ? (body[key] as string).trim() : "";

  const replyBody = str("body");
  if (!replyBody) {
    return NextResponse.json({ error: "Write a reply first." }, { status: 400 });
  }

  const updated = await addReply(id, { author: str("author"), body: replyBody });
  if (!updated) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  return NextResponse.json(updated, { status: 201 });
}
