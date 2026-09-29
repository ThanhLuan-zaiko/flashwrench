import { NextResponse } from "next/server";
import type { ShieldVerdict } from "./security.types";

type RejectVerdict = Extract<ShieldVerdict, { action: "reject" }>;

const MESSAGES: Record<RejectVerdict["status"], string> = {
  413: "Dữ liệu gửi lên quá lớn. Vui lòng thử lại với nội dung nhỏ hơn.",
  429: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ giây lát rồi thử lại.",
  503: "Hệ thống đang quá tải. Vui lòng thử lại sau ít giây.",
};

function wantsJson(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

// Pages get a minimal HTML reply (messengers/browsers show something
// readable); API callers get the shared { errors: { form } } shape.
export function shieldRejection(
  pathname: string,
  verdict: RejectVerdict,
): NextResponse {
  const message = MESSAGES[verdict.status];
  const response = wantsJson(pathname)
    ? NextResponse.json(
        { errors: { form: message } },
        { status: verdict.status },
      )
    : new NextResponse(
        `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${verdict.status}</title>${
          verdict.status === 503
            ? `<meta http-equiv="refresh" content="${verdict.retryAfterSec}">`
            : ""
        }</head><body><p>${message}</p></body></html>`,
        {
          status: verdict.status,
          headers: { "content-type": "text/html; charset=utf-8" },
        },
      );
  response.headers.set("Cache-Control", "no-store");
  if (verdict.retryAfterSec > 0) {
    response.headers.set("Retry-After", String(verdict.retryAfterSec));
  }
  return response;
}
