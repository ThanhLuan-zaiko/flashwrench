function httpProtocol(protocol: string): string | null {
  if (protocol === "http:" || protocol === "ws:") return "http:";
  if (protocol === "https:" || protocol === "wss:") return "https:";
  return null;
}

export function isAllowedRealtimeOrigin(
  requestUrl: string,
  origin: string | null,
  configured = process.env.REALTIME_ALLOWED_ORIGINS,
): boolean {
  let request: URL;
  try {
    request = new URL(requestUrl);
  } catch {
    return false;
  }
  if (origin === null) return true;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  const allowlist = (configured ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (allowlist.length > 0) return allowlist.includes(parsed.origin);
  const requestProtocol = httpProtocol(request.protocol);
  const originProtocol = httpProtocol(parsed.protocol);
  if (!requestProtocol || !originProtocol) return false;
  return (
    parsed.hostname === request.hostname && originProtocol === requestProtocol
  );
}
