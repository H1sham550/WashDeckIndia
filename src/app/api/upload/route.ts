import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { requireStationUser } from "@/lib/auth";
import { checkStationStatus } from "@/lib/subscription-guard";

export async function POST(request: NextRequest) {
  try {
    const session = await requireStationUser(); // Ensure user belongs to a station
    await checkStationStatus(session.stationId);

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/png";

    // On Vercel serverless functions (EROFS read-only file system) or when uploading logo/banner/photo (<10MB),
    // convert directly to a secure Base64 Data URI so it works seamlessly and saves to PostgreSQL.
    if (process.env.VERCEL === "1" || buffer.length < 10 * 1024 * 1024) {
      const base64Url = `data:${mimeType};base64,${buffer.toString("base64")}`;
      return NextResponse.json({ ok: true, url: base64Url });
    }

    try {
      const uploadDir = join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const timestamp = Date.now();
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const uniqueName = `${session.stationId}_${timestamp}_${cleanName}`;
      const filePath = join(uploadDir, uniqueName);

      await writeFile(filePath, buffer);
      return NextResponse.json({ ok: true, url: `/uploads/${uniqueName}` });
    } catch (fsError: any) {
      // Fallback cleanly to Base64 data URI if filesystem is read-only (EROFS)
      const base64Url = `data:${mimeType};base64,${buffer.toString("base64")}`;
      return NextResponse.json({ ok: true, url: base64Url });
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to upload file." },
      { status: 500 }
    );
  }
}
export const config = {
  api: {
    bodyParser: false, // Disabling bodyParser since we consume multi-part form data
  },
};
