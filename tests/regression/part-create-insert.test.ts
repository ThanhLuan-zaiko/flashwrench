import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makePartCategoryRow,
  makePartInput,
  makePartRow,
} from "../helpers/parts.fixtures";

// Regression for POST /api/admin/parts -> 500: the parts_by_id INSERT
// listed 23 columns but only 22 VALUES entries (the `description`
// placeholder was missing), so Scylla rejected the batch with
// "Unmatched column names/values" and the route collapsed it into a
// generic 500. This suite runs the REAL createPart plus the REAL parts
// repositories against a scylla fake that enforces INSERT column/value
// arity and marker/param counts like the server does.

type Statement = { query: string; params: unknown[] };
type Result = {
  first: () => Record<string, unknown> | null;
  rows: unknown[];
  wasApplied: () => boolean;
};

const state = {
  batches: [] as Statement[][],
  category: null as Record<string, unknown> | null,
  partById: null as Record<string, unknown> | null,
};

function row(value: Record<string, unknown> | null): Result {
  return {
    first: () => value,
    rows: value ? [value] : [],
    wasApplied: () => true,
  };
}

// Mirror the server-side checks that failed the original query.
function insertArityError(query: string, params: unknown[]): Error | null {
  const match = /INSERT INTO \S+ \(([^)]*)\) VALUES \(([^)]*)\)/i.exec(
    query.replace(/\s+/g, " "),
  );
  if (!match) return null;
  const columns = match[1].split(",").length;
  const values = match[2].split(",").length;
  if (columns !== values) return new Error("Unmatched column names/values");
  const markers = match[2]
    .split(",")
    .filter((entry) => entry.trim() === "?").length;
  if (markers !== params.length) {
    return new Error("Invalid amount of bind variables");
  }
  return null;
}

// Resolve each INSERT column to its bound param (or literal) so tests can
// assert a value landed on the right column, not just that counts match.
function boundInsertValues(
  query: string,
  params: unknown[],
): Map<string, unknown> {
  const match = /INSERT INTO \S+ \(([^)]*)\) VALUES \(([^)]*)\)/i.exec(
    query.replace(/\s+/g, " "),
  );
  const bound = new Map<string, unknown>();
  if (!match) return bound;
  const columns = match[1].split(",").map((column) => column.trim());
  const values = match[2].split(",").map((entry) => entry.trim());
  let index = 0;
  columns.forEach((column, i) => {
    bound.set(column, values[i] === "?" ? params[index++] : values[i]);
  });
  return bound;
}

const scyllaStub = {
  execute: mock(
    async (query: string, params: unknown[] = []): Promise<Result> => {
      const bad = insertArityError(query, params);
      if (bad) throw bad;
      const q = query.replace(/\s+/g, " ");
      if (q.includes("IF NOT EXISTS") || q.includes(" IF ")) {
        return row({ "[applied]": true });
      }
      if (q.includes("FROM part_categories ")) return row(state.category);
      if (q.includes("FROM parts_by_id ")) return row(state.partById);
      return row(null);
    },
  ),
  batch: mock(async (queries: Statement[]): Promise<void> => {
    state.batches.push(queries);
    for (const statement of queries) {
      const bad = insertArityError(statement.query, statement.params);
      if (bad) throw bad;
    }
  }),
};

mock.module("@/lib/db/client", () => ({ scylla: scyllaStub }));

import { createPart } from "@/lib/parts/parts.service";

beforeEach(() => {
  state.batches = [];
  state.category = null;
  state.partById = null;
  scyllaStub.execute.mockClear();
  scyllaStub.batch.mockClear();
});

describe("part create INSERT arity", () => {
  test("createPart writes the full row without a Scylla arity error", async () => {
    state.category = makePartCategoryRow();
    state.partById = makePartRow();
    const result = await createPart(makePartInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const statements = state.batches.flat();
    for (const statement of statements) {
      expect(insertArityError(statement.query, statement.params)).toBeNull();
    }
    const main = statements.find((s) => s.query.includes("INTO parts_by_id"));
    if (!main) throw new Error("parts_by_id insert was not issued");
    const bound = boundInsertValues(main.query, main.params);
    expect(bound.get("description")).toBe("Bugi tieu chuan.");
    expect(bound.get("sku")).toBe("BG-NGK-01");
    expect(bound.get("is_deleted")).toBe("false");
  });

  test("every batch statement passes server-side arity checks", async () => {
    state.category = makePartCategoryRow();
    state.partById = makePartRow();
    await createPart(makePartInput({ brand: "NGK" }));
    // parts_by_id + parts_by_category + parts_by_brand in one batch.
    expect(state.batches).toHaveLength(1);
    const queries = state.batches[0].map((s) => s.query);
    expect(queries.some((q) => q.includes("INTO parts_by_id"))).toBe(true);
    expect(queries.some((q) => q.includes("INTO parts_by_category"))).toBe(
      true,
    );
    expect(queries.some((q) => q.includes("INTO parts_by_brand"))).toBe(true);
  });
});
