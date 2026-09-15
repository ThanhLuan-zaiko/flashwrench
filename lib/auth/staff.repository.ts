import { scylla } from "@/lib/db/client";

// Raw CQL for admin staff management. No business logic here: the service
// reads the user first (for created_at / month_bucket / contacts) and
// orchestrates these single-purpose statements.

export async function setIdProfile(
  userId: string,
  fullName: string,
  updatedAt: Date,
): Promise<void> {
  await scylla.execute(
    "UPDATE users_by_id SET full_name = ?, updated_at = ? WHERE user_id = ?",
    [fullName, updatedAt, userId],
    { prepare: true },
  );
}

export async function setIdContacts(
  userId: string,
  phone: string,
  email: string,
  updatedAt: Date,
): Promise<void> {
  await scylla.execute(
    "UPDATE users_by_id SET phone = ?, email = ?, updated_at = ? WHERE user_id = ?",
    [phone, email, updatedAt, userId],
    { prepare: true },
  );
}

export async function setRoleProfile(params: {
  role: string;
  monthBucket: string;
  createdAt: Date;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
}): Promise<void> {
  await scylla.execute(
    "UPDATE users_by_role SET full_name = ?, phone = ?, email = ? WHERE role = ? AND month_bucket = ? AND created_at = ? AND user_id = ?",
    [
      params.fullName,
      params.phone,
      params.email,
      params.role,
      params.monthBucket,
      params.createdAt,
      params.userId,
    ],
    { prepare: true },
  );
}

export async function insertRoleRow(params: {
  role: string;
  monthBucket: string;
  createdAt: Date;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  status: string;
}): Promise<void> {
  await scylla.execute(
    "INSERT INTO users_by_role (role, month_bucket, created_at, user_id, full_name, phone, email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      params.role,
      params.monthBucket,
      params.createdAt,
      params.userId,
      params.fullName,
      params.phone,
      params.email,
      params.status,
    ],
    { prepare: true },
  );
}

export async function deleteRoleRow(
  role: string,
  monthBucket: string,
  createdAt: Date,
  userId: string,
): Promise<void> {
  await scylla.execute(
    "DELETE FROM users_by_role WHERE role = ? AND month_bucket = ? AND created_at = ? AND user_id = ?",
    [role, monthBucket, createdAt, userId],
    { prepare: true },
  );
}

export async function setIdRole(
  userId: string,
  role: string,
  updatedAt: Date,
): Promise<void> {
  await scylla.execute(
    "UPDATE users_by_id SET role = ?, updated_at = ? WHERE user_id = ?",
    [role, updatedAt, userId],
    { prepare: true },
  );
}

export async function deleteIdRow(userId: string): Promise<void> {
  await scylla.execute("DELETE FROM users_by_id WHERE user_id = ?", [userId], {
    prepare: true,
  });
}

export async function deletePhoneRow(phone: string): Promise<void> {
  await scylla.execute("DELETE FROM users_by_phone WHERE phone = ?", [phone], {
    prepare: true,
  });
}

export async function deleteEmailRow(email: string): Promise<void> {
  await scylla.execute("DELETE FROM users_by_email WHERE email = ?", [email], {
    prepare: true,
  });
}
