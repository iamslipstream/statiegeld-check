import { NextResponse } from "next/server";
import {
  addThread,
  getThreads,
  isThreadCategory,
  type ThreadCategory,
} from "@/lib/threads-store";

export const dynamic = "force-dynamic";

// Compressed images arrive as data URLs. Keep a ceiling well under Upstash's
// free-tier request limit; the client downscales before sending.
const MAX_IMAGE_CHARS = 1_000_000; // ~1 MB

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category");
  if (!isThreadCategory(category)) {
    return NextResponse.json({ error: "Unknown category." }, { status: 400 });
  }
  return NextResponse.json(await getThreads(category), {
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

  const str = (key: string) =>
    typeof body[key] === "string" ? (body[key] as string).trim() : "";

  const category = str("category");
  if (!isThreadCategory(category)) {
    return NextResponse.json({ error: "Unknown category." }, { status: 400 });
  }

  const title = str("title");
  if (!title) {
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  }

  // Lost & Found posts must say whether the item was lost or found.
  let kind = "";
  if (category === "lost-found") {
    kind = str("kind");
    if (!["lost", "found"].includes(kind)) {
      return NextResponse.json(
        { error: "Choose whether you lost or found it." },
        { status: 400 }
      );
    }
  }

  const token = str("token");
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const phone = str("phone");
  const email = str("email");
  const contact = [phone, email].filter(Boolean).join(" · ");

  let imageUrl: string | null = null;
  const image = str("image");
  if (image) {
    if (!image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image." }, { status: 400 });
    }
    if (image.length > MAX_IMAGE_CHARS) {
      return NextResponse.json(
        { error: "Image is too large — please use a smaller photo." },
        { status: 400 }
      );
    }
    imageUrl = image;
  }

  const thread = await addThread(
    {
      category: category as ThreadCategory,
      kind,
      author: str("author"),
      title,
      body: str("body"),
      contact,
      imageUrl,
    },
    token
  );

  return NextResponse.json(thread, { status: 201 });
}
