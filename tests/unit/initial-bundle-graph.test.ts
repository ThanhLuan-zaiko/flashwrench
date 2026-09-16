import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Guards the layout code-split: AccountLockGuard (realtime socket, session
// polling, lock overlay) renders null for almost every visit, so
// app/layout.tsx must reach it only through next/dynamic, never through a
// static import. This test walks the static client import graph starting at
// the root layout and fails if the realtime modules leak back into the
// first paint. `import type` edges are erased by the compiler and ignored;
// only runtime edges count.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function toRootPath(absolute: string): string {
  return relative(ROOT, absolute).split(sep).join("/");
}

function stripTypesAndComments(source: string): string {
  const withoutBlocks = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const lines = withoutBlocks.split("\n");
  const kept = lines.filter((line) => !line.trimStart().startsWith("//"));
  // Type-only imports vanish at build time, so they never join the bundle.
  // (Inline `type` qualifiers inside a value import/export keep their edge:
  // the module is still evaluated, so those specifiers must stay visible.)
  return kept
    .join("\n")
    .replace(/import\s+type\s[\s\S]*?\sfrom\s*["'][^"']+["']/g, "")
    .replace(/export\s+type\s[\s\S]*?\sfrom\s*["'][^"']+["']/g, "");
}

function staticSpecifiers(source: string): string[] {
  const cleaned = stripTypesAndComments(source);
  const found = new Set<string>();
  for (const match of cleaned.matchAll(/from\s*["']([^"']+)["']/g)) {
    const specifier = match[1];
    if (specifier) found.add(specifier);
  }
  for (const match of cleaned.matchAll(/^\s*import\s*["']([^"']+)["']/gm)) {
    const specifier = match[1];
    if (specifier) found.add(specifier);
  }
  return [...found];
}

function resolveLocal(specifier: string, importer: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) {
    base = join(ROOT, specifier.slice(2));
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    base = resolve(dirname(importer), specifier);
  } else {
    return null;
  }
  if (base.endsWith(".css")) return null;
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && candidate.startsWith(ROOT)) return candidate;
  }
  return null;
}

async function staticGraph(entry: string): Promise<Set<string>> {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    const source = await Bun.file(current).text();
    for (const specifier of staticSpecifiers(source)) {
      const next = resolveLocal(specifier, current);
      if (next && !seen.has(next)) queue.push(next);
    }
  }
  return new Set([...seen].map(toRootPath));
}

describe("root layout initial bundle", () => {
  test("keeps the realtime flow out of the first paint", async () => {
    const graph = await staticGraph(join(ROOT, "app", "layout.tsx"));

    // Sanity: the traversal really walked the shell (no false pass).
    expect(graph.has("components/layout/SiteHeader.tsx")).toBe(true);
    // The lazy boundary itself must stay wired in the shell.
    expect(graph.has("components/auth/LazyAccountLockGuard.tsx")).toBe(true);

    // The guard and everything it alone pulls in must stay lazy.
    expect(graph.has("components/auth/AccountLockGuard.tsx")).toBe(false);
    expect(graph.has("hooks/useRealtimeStatus.ts")).toBe(false);
    expect(graph.has("hooks/useRealtimeTopic.ts")).toBe(false);
    expect(graph.has("lib/realtime/realtime-client.ts")).toBe(false);
    expect(graph.has("lib/realtime/protocol.ts")).toBe(false);
  });
});

describe("client/server module boundary", () => {
  // The browser shell (header, guard, providers, auth hooks) must never
  // statically reach server-only modules (jose, ScyllaDB repositories,
  // next/headers). Such an import would either bloat the client bundle or
  // break the production build, so it fails fast here instead.
  test("client shell never reaches server-only auth/db modules", async () => {
    const roots = [
      "components/layout/SiteHeader.tsx",
      "components/auth/AccountLockGuard.tsx",
      "components/providers/QueryProvider.tsx",
      "components/toast/ToastProvider.tsx",
      "hooks/auth.ts",
    ];
    const graph = new Set<string>();
    for (const root of roots) {
      for (const node of await staticGraph(join(ROOT, root))) {
        graph.add(node);
      }
    }

    // Sanity: the traversal really walked client code (no false pass).
    expect(graph.has("services/auth.api.ts")).toBe(true);

    const serverOnly = [
      "lib/auth/server-session.ts",
      "lib/auth/account-status.service.ts",
      "lib/auth/auth.service.ts",
      "lib/auth/user.repository.ts",
      "lib/auth/refresh.repository.ts",
      "lib/auth/session.ts",
      "lib/auth/password.ts",
      "lib/auth/session-revoke.service.ts",
      "lib/db/client.ts",
      "lib/db/check-connection.ts",
    ];
    for (const module of serverOnly) {
      expect(graph.has(module)).toBe(false);
    }
  });
});
