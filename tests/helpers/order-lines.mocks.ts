// Shared stubs for the order-lines service (cart checkout and counter
// sales reserve through it). Tests set the reserved subtotal or force a
// failure; nothing touches a real database.
import { mock } from "bun:test";

export const orderLinesStubs = {
  reserveError: null as { status: number; form: string } | null,
  reservedSubtotal: 500000,
  reservedLines: [] as {
    partId: string;
    partName: string;
    partImage: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[],
};

export const orderLinesServiceMocks = {
  reserveOrderLines: mock(
    async (
      requests: { partId: string; partName?: string; quantity: number }[],
    ): Promise<
      | {
          ok: true;
          data: {
            lines: typeof orderLinesStubs.reservedLines;
            subtotal: number;
          };
        }
      | { ok: false; status: number; errors: { form: string } }
    > => {
      if (orderLinesStubs.reserveError) {
        return {
          ok: false,
          status: orderLinesStubs.reserveError.status,
          errors: { form: orderLinesStubs.reserveError.form },
        };
      }
      const lines =
        orderLinesStubs.reservedLines.length > 0
          ? orderLinesStubs.reservedLines
          : requests.map((request) => ({
              partId: request.partId,
              partName: request.partName ?? "Phu tung",
              partImage: "",
              sku: "SKU-1",
              quantity: request.quantity,
              unitPrice: 500000,
              lineTotal: 500000 * request.quantity,
            }));
      const subtotal =
        orderLinesStubs.reservedLines.length > 0
          ? orderLinesStubs.reservedSubtotal
          : lines.reduce((sum, line) => sum + line.lineTotal, 0);
      return { ok: true, data: { lines, subtotal } };
    },
  ),
};

export function resetOrderLinesMocks(): void {
  orderLinesStubs.reserveError = null;
  orderLinesStubs.reservedSubtotal = 500000;
  orderLinesStubs.reservedLines = [];
  for (const fn of Object.values(orderLinesServiceMocks)) fn.mockClear();
}
