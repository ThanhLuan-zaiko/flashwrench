import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { parseMessageKind } from "@/lib/chat/chat-content";
import {
  listThreadMessages,
  sendChatContentMessage,
} from "@/lib/chat/chat-messages.service";

type RouteContext = { params: Promise<{ threadId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  const { threadId } = await context.params;
  try {
    const rawLimit = request.nextUrl.searchParams.get("limit");
    const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
    const result = await listThreadMessages(user, threadId, {
      cursor: request.nextUrl.searchParams.get("cursor"),
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được tin nhắn. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  const { threadId } = await context.params;
  let body: { body?: unknown; kind?: unknown };
  try {
    body = (await request.json()) as { body?: unknown; kind?: unknown };
  } catch {
    body = {};
  }
  if (typeof body.body !== "string") {
    return NextResponse.json(
      { errors: { body: "Nội dung tin nhắn không hợp lệ." } },
      { status: 400 },
    );
  }
  const kind = body.kind === undefined ? "text" : parseMessageKind(body.kind);
  if (!kind) {
    return NextResponse.json(
      { errors: { kind: "Loại tin nhắn không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await sendChatContentMessage(user, threadId, {
      kind,
      body: body.body,
    });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không gửi được tin nhắn. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
