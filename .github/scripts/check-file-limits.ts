/// <reference types="node" />

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const LIMITS: Record<string, number> = {
  ".tsx": 250,
  ".ts": 350,
};

const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".github",
]);

const IGNORE_FILES = new Set(["next-env.d.ts"]);

interface Violation {
  file: string;
  lines: number;
  limit: number;
}

function countLines(filePath: string): number {
  const content = readFileSync(filePath, "utf-8");
  return content.split("\n").length;
}

function* walk(dir: string): Generator<string> {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        yield* walk(fullPath);
      }
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

function checkFiles(root: string): Violation[] {
  const violations: Violation[] = [];

  for (const file of walk(root)) {
    const fileName = file.split("/").pop() ?? "";
    if (IGNORE_FILES.has(fileName)) continue;

    const ext = file.substring(file.lastIndexOf("."));
    const limit = LIMITS[ext];
    if (!limit) continue;

    const lines = countLines(file);
    if (lines > limit) {
      violations.push({
        file: relative(root, file),
        lines,
        limit,
      });
    }
  }

  return violations;
}

function main(): void {
  const root = process.cwd();
  const violations = checkFiles(root);

  if (violations.length === 0) {
    console.log("All files comply with the line limits of AGENTS.md");
    return;
  }

  console.error("\n Files exceeding line limits (AGENTS.md Section 3):\n");
  for (const v of violations) {
    console.error(
      `::error file=${v.file}::File exceeds ${v.limit} lines (current: ${v.lines} lines)`
    );
    console.error(`  📄 ${v.file}: ${v.lines} lines (limit: ${v.limit})`);
  }
  console.error(`\n✖ ${violations.length} file(s) violate the limit. Please split the files according to the modularization rules.`);
  process.exit(1);
}

main();