export type UserRole = "customer" | "mechanic" | "dispatcher" | "admin";

export type UserStatus =
  | "active"
  | "locked"
  | "pending_verification"
  | "deleted";

export type UserRow = {
  user_id: string;
  phone: string | null;
  email: string | null;
  password_hash: string | null;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  status: string | null;
  token_version: number;
  created_at: Date | null;
  updated_at: Date | null;
};

export type PublicUser = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  status: UserStatus;
  tokenVersion: number;
  createdAt: string | null;
};

export type RegisterInput = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  familyId: string;
};

export type FieldErrors = Partial<
  Record<
    | "fullName"
    | "phone"
    | "email"
    | "password"
    | "confirmPassword"
    | "identifier"
    | "currentPassword"
    | "newPassword"
    | "form",
    string
  >
>;

export type AuthResult =
  | { ok: true; user: PublicUser; tokens: SessionTokens }
  | { ok: false; errors: FieldErrors; status: number };

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.user_id,
    fullName: row.full_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    role: (row.role as UserRole) ?? "customer",
    avatarUrl: row.avatar_url,
    status: (row.status as UserStatus) ?? "active",
    tokenVersion: row.token_version ?? 0,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

export function monthBucket(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
