// Shared child-process specs for the composite run scripts.
// `dev-all` targets iteration speed (Turbopack HMR + gateway hot reload),
// `start-all` targets production parity (built assets, no file watching).
// Pure factories on purpose: unit tests pin the exact commands so a flag
// can never silently drift between the two modes.

export type ChildSpec = {
  name: string;
  cmd: string[];
};

export function devChildren(): ChildSpec[] {
  return [
    { name: "web", cmd: ["bun", "run", "dev"] },
    { name: "realtime", cmd: ["bun", "--hot", "realtime/server.ts"] },
  ];
}

export function startChildren(): ChildSpec[] {
  return [
    { name: "web", cmd: ["bun", "run", "start"] },
    { name: "realtime", cmd: ["bun", "run", "realtime/server.ts"] },
  ];
}

// Spawn every child with inherited stdio and forward termination signals
// to all of them, so Ctrl+C stops the whole stack instead of orphaning
// the gateway (or the web server) in the background.
export async function runChildren(specs: ChildSpec[]): Promise<void> {
  const children = specs.map((spec) =>
    Bun.spawn(spec.cmd, {
      stdout: "inherit",
      stderr: "inherit",
      stdin: "inherit",
    }),
  );

  let stopping = false;
  async function stop(): Promise<void> {
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
}
