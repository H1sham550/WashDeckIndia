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
    const uploadDir = join(process.cwd(), "public", "uploads");

    // Ensure the upload directory exists
    await mkdir(uploadDir, { recursive: true });

    // Sanitize and generate unique filename
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueName = `${session.stationId}_${timestamp}_${cleanName}`;
    const filePath = join(uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    // Return the relative local path
    const relativeUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({ ok: true, url: relativeUrl });
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
