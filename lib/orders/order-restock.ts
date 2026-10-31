// Puts an order's items back on the shelf and out of the sold count. Cancels
// always restock. A refund restocks only when staff confirmed the returned
// goods are sellable again, because the system cannot see their condition.
import { restockForOrder } from "@/lib/parts/parts-lifecycle.service";
import { listOrderItemRows } from "./orders.repository";

export async function restockOrderItems(orderId: string): Promise<void> {
  const items = await listOrderItemRows(orderId);
  for (const item of items) {
    await restockForOrder(item.part_id, item.quantity ?? 0).catch((error) =>
      console.error(
        `[orders] restock failed for order ${orderId}, part ${item.part_id}`,
        error,
      ),
    );
  }
}
