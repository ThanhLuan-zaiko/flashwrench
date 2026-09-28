import { NextResponse } from "next/server";
import { authenticateRequest, requireAuth } from "@/lib/auth/authorization";
import { addComment, listComments } from "@/lib/comments/comments.service";
import {
  mutationOriginError,
  readJsonObject,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";

// Comment threads: GET is public for part targets and auth-checked for
// private ones inside the service; POST always requires a session.
export async function GET(request: Request) {
  const user = await authenticateRequest();
  const params = new URL(request.url).searchParams;
  try {
    const result = await listComments(
      user,
      params.get("targetType"),
      params.get("targetId"),
      params.get("cursor"),
    );
    return resultResponse(result, (comments) => ({ comments }));
  } catch {
    return routeFailure("Không tải được bình luận. Vui lòng thử lại sau.");
  }
}

export async function POST(request: Request) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireAuth();
  if (response) return response;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await addComment(user, body.targetType, body.targetId, body);
    return resultResponse(result, (comment) => ({ comment }), 201);
  } catch {
    return routeFailure("Không gửi được bình luận. Vui lòng thử lại sau.");
  }
}
