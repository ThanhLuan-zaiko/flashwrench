import type { TrafficClass } from "./security.types";

const STATIC_FILE_PATTERN =
  /\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|map|txt|xml|woff2?|ttf|otf)$/i;

// Classification is by path first; the proxy matcher already excludes
// Next.js build assets, and the extension check is the backstop for
// anything else the matcher lets through. API routes stay dynamic even
// when the key ends in a file extension (e.g. /api/media/.../x.webp).
export function classifyTraffic(
  pathname: string,
  method: string,
): TrafficClass {
  if (pathname.startsWith("/api/auth")) return "auth";
  if (pathname.startsWith("/api/media")) {
    return method === "GET" || method === "HEAD" ? "media" : "api";
  }
  if (pathname.startsWith("/api/")) return "api";
  if (STATIC_FILE_PATTERN.test(pathname)) return "asset";
  return "page";
}

// Content-Length is optional (chunked bodies carry none), so this check is
// a fast reject for declared-oversized bodies only; route-level parsing
// still applies for everything that gets through.
export function declaredBodyTooLarge(
  contentLength: string | null,
  maxBytes: number,
): boolean {
  if (contentLength === null) return false;
  const declared = Number(contentLength);
  return Number.isFinite(declared) && declared > maxBytes;
}

export function isUploadPath(pathname: string, method: string): boolean {
  return pathname.startsWith("/api/media") && method === "POST";
}
