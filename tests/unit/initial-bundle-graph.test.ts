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
  return kept.join("\n").replace(/import\s+type\s[\s\S]*?\sfrom\s*$/gm, "");
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
