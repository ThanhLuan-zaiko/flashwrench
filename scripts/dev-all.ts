// Run the Next.js dev server and the realtime gateway together.
// Usage: `bun run dev:all`. Forwards SIGINT/SIGTERM to both children.
export {};

const children = [
  Bun.spawn(["bun", "run", "dev"], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  }),
  Bun.spawn(["bun", "run", "realtime/server.ts"], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  }),
];

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    try {
      child.kill();
    } catch {
      return;
    }
  }
  await Promise.all(children.map((child) => child.exited));
  process.exit(0);
}

process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());
await Promise.all(children.map((child) => child.exited));
