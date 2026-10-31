import { optOutOfMaintenanceReminders } from "@/lib/vehicles/maintenance-unsubscribe.service";

// One-click opt-out from the reminder email. The signed token is the only
// credential, so no session is required. Responds with a small Vietnamese
// HTML page that the email link opens in the browser.
function page(title: string, message: string): string {
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:48px 16px;font-family:system-ui,sans-serif;background:#fff;color:#18181b;text-align:center;">
<h1 style="font-size:20px;margin:0 0 12px;">${title}</h1>
<p style="font-size:15px;line-height:1.6;color:#3f3f46;margin:0;">${message}</p>
</body></html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const done = await optOutOfMaintenanceReminders(
    url.searchParams.get("u") ?? "",
    url.searchParams.get("t") ?? "",
  ).catch(() => false);
  const html = done
    ? page(
        "Đã tắt nhắc bảo dưỡng",
        "Bạn sẽ không nhận email nhắc bảo dưỡng nữa.",
      )
    : page(
        "Liên kết không hợp lệ",
        "Liên kết đã hết hạn hoặc không đúng. Hãy liên hệ cửa hàng nếu cần hỗ trợ.",
      );
  return new Response(html, {
    status: done ? 200 : 400,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
