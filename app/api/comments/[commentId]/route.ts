import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { moderateComment } from "@/lib/comments/comment-moderation.service";
import {
  mutationOriginError,
  readJsonObject,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";

type RouteParams = { params: Promise<{ commentId: string }> };

// Staff moderation: hide/unhide a comment or reply. Admin and dispatcher
// only; complaint threads are restricted to admin inside the service.
export async function PATCH(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("admin", "dispatcher");
  if (response) return response;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  const { commentId } = await params;
  try {
    const result = await moderateComment(user, commentId, body);
    return resultResponse(result, (comment) => ({ comment }));
  } catch {
    return routeFailure("Không cập nhật được bình luận. Vui lòng thử lại sau.");
  }
}
