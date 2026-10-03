// Cross-platform suite runner: every test file in its own process.
// Same contract as tests/run-suite.sh and tests/run-suite.ps1 (Bun shares
// one module registry per process, so mock.module calls would leak across
// files in a single run). Usage: bun tests/run-suite.ts tests/unit
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: run-suite.ts <suite-dir>");
  process.exit(1);
}

const entries = (await readdir(dir))
  .filter((name) => name.endsWith(".test.ts"))
  .sort();
if (entries.length === 0) {
  console.error(`No test files found in ${dir}`);
  process.exit(1);
}

for (const name of entries) {
  const proc = Bun.spawn(["bun", "test", join(dir, name)], {
    stdio: ["ignore", "inherit", "inherit"],
  });
  const code = await proc.exited;
  if (code !== 0) {
    console.error(`FAIL: ${name}`);
    process.exit(1);
  }
}

console.log(`All green: ${entries.length} files in ${dir}`);
