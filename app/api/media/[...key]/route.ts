import { NextResponse } from "next/server";
import { isSafeAssetKey } from "@/lib/media/media-paths";
import { readAssetFile } from "@/lib/media/media-storage";

type RouteParams = { params: Promise<{ key: string[] }> };

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Public image serving: /api/media/<scope>/<YYYY-MM>/<uuid>.<ext>.
// Filenames are server-generated uuids, so the URL is unguessable and
// immutable — safe to cache for a year. No auth: catalog and avatar
// images render for guests too. Strict key check first, 404 otherwise
// (never leak whether a path exists).
export async function GET(_request: Request, { params }: RouteParams) {
  const { key } = await params;
  const joined = key.join("/");
  if (!isSafeAssetKey(joined)) {
    return NextResponse.json(
      { errors: { form: "Không tìm thấy ảnh." } },
      { status: 404 },
    );
  }
  try {
    const data = await readAssetFile(joined);
    const ext = joined.split(".").pop() ?? "";
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream",
        "Content-Length": String(data.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tìm thấy ảnh." } },
      { status: 404 },
    );
  }
}
