// Raw CQL for public rescue creation. No business logic here: the
// service validates the guest input and decides status/priority.
import { scylla } from "@/lib/db/client";

export type RescueAddress = {
  province: string | null;
  district: string | null;
  ward: string | null;
  street: string | null;
  full_text: string;
  lat: number | null;
  lng: number | null;
};

export type InsertRescueParams = {
  requestId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  zoneId: string | null;
  address: RescueAddress;
  issueType: string;
  description: string | null;
  priority: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

// One batch keeps the request row, its tracking timeline and the
// customer history partition in sync. Guests have no customer partition,
// so they only get the primary row plus status buckets; dispatchers read
// the newest rows through the status bucket once a zone is assigned.
export async function insertRescueRequest(
  params: InsertRescueParams,
): Promise<void> {
  const queries: { query: string; params: unknown[] }[] = [
    {
      query:
        "INSERT INTO emergency_by_id (request_id, customer_id, customer_name, customer_phone, vehicle_id, vehicle_plate, vehicle_brand, vehicle_model, zone_id, address, issue_type, description, photos, priority, status, assigned_mechanic_id, assigned_mechanic_name, eta_min, price_estimate, final_price, payment_status, cancel_reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      params: [
        params.requestId,
        params.customerId,
        params.customerName,
        params.customerPhone,
        null,
        params.vehiclePlate,
        params.vehicleBrand,
        params.vehicleModel,
        params.zoneId,
        params.address,
        params.issueType,
        params.description,
        null,
        params.priority,
        params.status,
        null,
        null,
        null,
        null,
        null,
        "unpaid",
        null,
        params.createdAt,
        params.updatedAt,
      ],
    },
    {
      query:
        "INSERT INTO emergency_status_history (request_id, changed_at, old_status, new_status, changed_by, note) VALUES (?, ?, ?, ?, ?, ?)",
      params: [
        params.requestId,
        params.createdAt,
        null,
        params.status,
        params.customerId,
        null,
      ],
    },
    {
      query:
        "INSERT INTO emergency_by_status (status, created_at, request_id, priority, issue_type, zone_id) VALUES (?, ?, ?, ?, ?, ?)",
      params: [
        params.status,
        params.createdAt,
        params.requestId,
        params.priority,
        params.issueType,
        params.zoneId,
      ],
    },
  ];

  if (params.customerId) {
    queries.push({
      query:
        "INSERT INTO emergency_by_customer (customer_id, created_at, request_id, status, issue_type, vehicle_plate) VALUES (?, ?, ?, ?, ?, ?)",
      params: [
        params.customerId,
        params.createdAt,
        params.requestId,
        params.status,
        params.issueType,
        params.vehiclePlate,
      ],
    });
  }

  await scylla.batch(queries, { prepare: true });
}
