import { NextResponse } from "next/server";
import { addListing, getListings } from "@/lib/marketplace-store";

export const dynamic = "force-dynamic";

// Compressed images arrive as data URLs. Keep a ceiling well under Upstash's
// free-tier request limit; the client downscales before sending.
const MAX_IMAGE_CHARS = 1_000_000; // ~1 MB

export async function GET() {
  return NextResponse.json(await getListings(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  // Accept JSON (current client) and multipart FormData (older cached clients).
  let str: (key: string) => string;
  let imageFromFile: string | null = null;

  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      str = (key) =>
        typeof body[key] === "string" ? (body[key] as string).trim() : "";
    } else {
      const form = await request.formData();
      str = (key) => {
        const v = form.get(key);
        return typeof v === "string" ? v.trim() : "";
      };
      // Legacy clients send the photo as a File; inline it as a data URL.
      const file = form.get("image");
      if (file instanceof File && file.size > 0) {
        const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
        imageFromFile = `data:${file.type || "image/jpeg"};base64,${b64}`;
      }
    }
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const title = str("title");
  const building = str("building");

  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (!["North", "West", "East"].includes(building)) {
    return NextResponse.json({ error: "Building is required." }, { status: 400 });
  }

  const apartment = str("apartment");
  const description = str("description");
  const price = str("price");
  const phone = str("phone");
  const email = str("email");
  const contact = [phone, email].filter(Boolean).join(" · ");

  let imageUrl: string | null = null;
  const image = imageFromFile ?? str("image");
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

  const token = str("token");
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const listing = await addListing(
    {
      title,
      description,
      price,
      building: building as "North" | "West" | "East",
      apartment,
      contact,
      imageUrl,
    },
    token
  );

  return NextResponse.json(listing, { status: 201 });
}
