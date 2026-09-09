import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { api, requireUser } from "@/lib/api";

// Unified at 5 MB (legacy had a 0.5 MB client / 3 MB server mismatch).
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

// Local-disk storage for development; swaps for an S3-compatible adapter at
// deploy time. Error codes preserve the legacy strings.
export const POST = api(async (request) => {
  await requireUser();
  const form = await request.formData();
  const file = form.get("cover");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "cover-field-expected" }, { status: 400 });
  }
  const extension = EXTENSIONS[file.type];
  if (!extension) {
    return NextResponse.json({ error: "image-mimetype-expected" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file-too-large" }, { status: 413 });
  }
  const name = `${randomBytes(16).toString("hex")}${extension}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ href: `/uploads/${name}` });
});
