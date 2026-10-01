import type { OrderFieldErrors, OrdersResult } from "./orders.types";

export function fail<T>(status: number, form: string): OrdersResult<T> {
  return { ok: false, status, errors: { form } };
}

export function failFields<T>(
  status: number,
  errors: OrderFieldErrors,
): OrdersResult<T> {
  return { ok: false, status, errors };
}
