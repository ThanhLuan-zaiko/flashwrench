export async function register() {
  // Runs only on server (Node/Bun runtime), not on Edge
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Fire-and-forget on purpose: the check only logs diagnostics and must
    // never delay server boot or the first paint when ScyllaDB is slow.
    // checkScyllaConnection never throws (it catches internally), so there
    // is no unhandled rejection to observe here.
    void import("./lib/db/check-connection").then(({ checkScyllaConnection }) =>
      checkScyllaConnection(),
    );
  }
}
