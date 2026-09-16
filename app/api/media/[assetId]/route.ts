import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { deleteMediaAsset } from "@/lib/media/media.service";

type RouteParams = { params: Promise<{ assetId: string }> };

// Delete one asset: file (best-effort) plus both registry rows.
// Only the uploader or an admin passes the service check.
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { response, user } = await requireAuth();
  if (response) return response;
  const { assetId } = await params;

  try {
    const result = await deleteMediaAsset(assetId, user);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ assetId: result.data.assetId });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không xóa được ảnh. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
