import { type NextRequest, NextResponse } from "next/server";
import { clientIp } from "@/lib/auth/guards";
import {
  resumeSessionResponse,
  wantsSessionResume,
} from "@/lib/auth/proxy-session";
import { isShieldEnabled } from "@/lib/security/security.constants";
import { evaluateShield } from "@/lib/security/shield.service";
import { shieldRejection } from "@/lib/security/shield-response";

// Second wall behind Cloudflare: per-IP fixed windows per traffic class,
// a shared repeat-offender ban list in ScyllaDB, and an instance-wide
// admission gate that sheds excess load instead of queueing into collapse.
export async function proxy(request: NextRequest) {
  if (isShieldEnabled()) {
    const rejection = await shieldVerdict(request);
    if (rejection) return rejection;
  }
  // Expired access cookie + live refresh cookie: rotate before rendering so
  // server-gated layouts see the signed-in user instead of bouncing.
  if (wantsSessionResume(request)) {
    const resumed = await resumeSessionResponse(request);
    if (resumed) return resumed;
  }
  return NextResponse.next();
}

async function shieldVerdict(request: NextRequest) {
  const verdict = await evaluateShield({
    ip: clientIp(request),
    pathname: request.nextUrl.pathname,
    method: request.method,
    contentLength: request.headers.get("content-length"),
  });
  if (verdict.action === "reject") {
    return shieldRejection(request.nextUrl.pathname, verdict);
  }
  return null;
}

export const config = {
  matcher: [
    // Static build assets and file-convention images bypass the shield;
    // classifyTraffic() backstops anything else with a file extension.
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|opengraph-image.png|robots.txt|sitemap.xml).*)",
  ],
};
