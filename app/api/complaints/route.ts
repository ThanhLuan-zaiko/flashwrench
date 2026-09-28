import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import {
  createCustomerComplaint,
  listMyComplaints,
} from "@/lib/complaints/complaints.service";
import {
  mutationOriginError,
  readJsonObject,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";
import { COMPLAINTS_TOPIC, userTopic } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

// Customer self-service complaints: the signed-in customer files and
// follows their own reports; admin handling stays on /api/admin/complaints.
export async function GET() {
  const { response, user } = await requireAuth();
  if (response) return response;
  try {
    const result = await listMyComplaints(user.id);
    return resultResponse(result, (complaints) => ({ complaints }));
  } catch {
    return routeFailure("Không tải được khiếu nại. Vui lòng thử lại sau.");
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
    const result = await createCustomerComplaint(user, {
      targetUserId:
        body.targetUserId === undefined ? undefined : String(body.targetUserId),
      targetName:
        body.targetName === undefined ? undefined : String(body.targetName),
      refType: body.refType === undefined ? undefined : String(body.refType),
      refId: body.refId === undefined ? undefined : String(body.refId),
      subject: body.subject === undefined ? undefined : String(body.subject),
      body: body.body === undefined ? undefined : String(body.body),
    });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    const payload = { kind: "complaint-updated" as const };
    void publishRealtimeEvent(COMPLAINTS_TOPIC, payload);
    void publishRealtimeEvent(userTopic(user.id), payload);
    return NextResponse.json({ complaint: result.data }, { status: 201 });
  } catch {
    return routeFailure("Không ghi nhận được khiếu nại. Vui lòng thử lại sau.");
  }
}
