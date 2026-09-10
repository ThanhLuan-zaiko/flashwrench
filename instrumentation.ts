export async function register() {
  // Runs only on server (Node/Bun runtime), not on Edge
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { checkScyllaConnection } = await import("./lib/db/check-connection");
    await checkScyllaConnection();
  }
}