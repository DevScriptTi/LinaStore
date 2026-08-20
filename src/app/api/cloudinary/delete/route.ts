import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function extractPublicId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  // Match path after /upload/(v\d+/)? up to extension
  const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
  const match = url.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  // Fallback: split by slash and strip extension
  const cleanUrl = url.split("?")[0];
  const parts = cleanUrl.split("/");
  const filename = parts.pop() || "";
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf(".")) || filename;
  return nameWithoutExt || null;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
    }

    // Ignore local blob/preview URLs
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      return NextResponse.json({ success: true, message: "Local blob URL ignored" });
    }

    const publicId = extractPublicId(url);
    if (!publicId) {
      return NextResponse.json({ error: "Could not extract public_id from URL" }, { status: 400 });
    }

    // If Cloudinary API secret is not set in environment yet, simulate success gracefully
    if (!process.env.CLOUDINARY_API_SECRET) {
      console.warn("CLOUDINARY_API_SECRET environment variable is missing. Simulated deletion of public_id:", publicId);
      return NextResponse.json({ success: true, publicId, simulated: true });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ success: true, publicId, result });
  } catch (error: unknown) {
    console.error("Cloudinary delete API route error:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete image";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
