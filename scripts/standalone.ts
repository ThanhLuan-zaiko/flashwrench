// Standalone output (`output: "standalone"`) is served by `node .next/standalone/server.js`.
// That server does not copy static assets, and it chdirs into the standalone
// folder, so cwd-relative paths (storage uploads, PDF fonts, mail logo) would
// miss the project root. This plan mirrors what the dockerfile does at image
// build time, except mutable and read-only project folders are linked instead
// of copied so uploads keep landing in the real `storage/` directory.
import { cp, lstat, mkdir, symlink } from "node:fs/promises";
import { join } from "node:path";

export type StandaloneStep =
  | { kind: "copy"; from: string; to: string }
  | { kind: "link"; target: string; path: string };

export function standalonePlan(root: string): StandaloneStep[] {
  const standalone = join(root, ".next", "standalone");

  return [
    {
      kind: "copy",
      from: join(root, ".next", "static"),
      to: join(standalone, ".next", "static"),
    },
    {
      kind: "copy",
      from: join(root, "public"),
      to: join(standalone, "public"),
    },
    {
      kind: "link",
      target: join(root, "asset"),
      path: join(standalone, "asset"),
    },
    {
      kind: "link",
      target: join(root, "storage"),
      path: join(standalone, "storage"),
    },
  ];
}

export async function applyStandalonePlan(
  steps: StandaloneStep[],
): Promise<void> {
  for (const step of steps) {
    if (step.kind === "copy") {
      await cp(step.from, step.to, { recursive: true, force: true });
      continue;
    }

    // Keep an existing link as-is: its target never changes between runs.
    if (await exists(step.path)) continue;

    await mkdir(step.target, { recursive: true });
    // "junction" needs no admin rights on Windows and is ignored elsewhere.
    await symlink(step.target, step.path, "junction");
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch {
    return false;
  }
}
