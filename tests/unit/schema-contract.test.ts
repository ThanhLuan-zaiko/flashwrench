import { describe, expect, test } from "bun:test";

describe("schema.cql", () => {
  test("declares the mechanic_active_jobs single-job reservation table", async () => {
    const schema = await Bun.file("schema.cql").text();
    expect(schema).toMatch(
      /CREATE TABLE IF NOT EXISTS mechanic_active_jobs \(\s*mechanic_id UUID PRIMARY KEY,\s*booking_id\s+UUID\s*\)/,
    );
  });
});
