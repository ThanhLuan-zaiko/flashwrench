import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Every role="dialog" or role="alertdialog" surface must move focus, trap Tab
// and answer Escape through useDialogFocus. This guard catches a new dialog
// that ships without that wiring.
const ROOT = join(import.meta.dir, "..", "..");
const SCAN_DIRS = ["app", "components"];
// Surfaces driven by a third-party tour library; their keyboard flow is owned
// by nextstepjs, so they are excluded on purpose.
const ALLOWED_WITHOUT_HOOK = new Set(["components/tour/TourCard.tsx"]);

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full));
    else if (name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("dialog focus coverage", () => {
  test("every role=dialog surface uses useDialogFocus", () => {
    const missing: string[] = [];
    for (const dir of SCAN_DIRS) {
      for (const file of tsxFiles(join(ROOT, dir))) {
        const rel = relative(ROOT, file).replaceAll("\\", "/");
        const source = readFileSync(file, "utf8");
        if (!/role="(alert)?dialog"/.test(source)) continue;
        if (ALLOWED_WITHOUT_HOOK.has(rel)) continue;
        if (!source.includes("useDialogFocus")) missing.push(rel);
      }
    }
    expect(missing).toEqual([]);
  });
});
