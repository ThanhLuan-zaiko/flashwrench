"use client";

import { useState } from "react";
import { FiLoader, FiSave, FiX } from "react-icons/fi";
import { useCreateStaff, useUpdateStaff } from "@/hooks/admin";
import type { AdminUserItem } from "@/lib/auth/admin-users.service";
import type { UserRole } from "@/lib/auth/user.types";
import { AuthApiError } from "@/services/admin.api";
import { StaffCreatedPanel } from "./StaffCreatedPanel";
import { StaffFormFields } from "./StaffFormFields";

export type StaffDialogState =
  | { mode: "create" }
  | { mode: "edit"; item: AdminUserItem };

type StaffDialogProps = {
  dialog: StaffDialogState | null;
  onClose: () => void;
};

const INPUT_CLASS =
  "mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500";

const LABEL_CLASS = "text-xs font-semibold text-zinc-700 dark:text-zinc-300";

function fieldError(error: unknown, field: string): string | undefined {
  if (error instanceof AuthApiError) {
    return (error.errors as Record<string, string | undefined>)[field];
  }
  return undefined;
}

function formErrorText(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof AuthApiError) {
    const errors = error.errors as Record<string, string | undefined>;
    return errors.form ?? error.message;
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

// Create/edit modal for one staff account. Create shows the temp password
// on success; it stays in the staff list until changed. Parent passes a
// keyed instance so form state resets on every open.
export function StaffDialog({ dialog, onClose }: StaffDialogProps) {
  const editing = dialog?.mode === "edit" ? dialog.item : null;
  const [fullName, setFullName] = useState(editing?.fullName ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [role, setRole] = useState<string>(
    editing && editing.role !== "admin" ? editing.role : "mechanic",
  );

  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const pending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error ?? updateMutation.error ?? null;
  const formError = formErrorText(error);
  const created = createMutation.data ?? null;

  if (!dialog) return null;
  const isCreate = dialog.mode === "create";

  const submit = () => {
    if (pending) return;
    if (isCreate) {
      createMutation.mutate({
        fullName,
        phone,
        email,
        role: role as UserRole,
      });
    } else if (editing) {
      updateMutation.mutate(
        {
          userId: editing.id,
          fullName,
          phone,
          email,
          role: role as UserRole,
        },
        { onSuccess: onClose },
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isCreate ? "Thêm nhân viên" : "Sửa nhân viên"}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Đóng hộp thoại"
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/50"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {isCreate ? "Thêm nhân viên" : "Sửa nhân viên"}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {isCreate && created ? (
          <StaffCreatedPanel
            fullName={created.user.fullName}
            tempPassword={created.tempPassword}
            onDone={onClose}
          />
        ) : (
          <div>
            <StaffFormFields
              fullName={fullName}
              phone={phone}
              email={email}
              role={role}
              isCreate={isCreate}
              inputClass={INPUT_CLASS}
              labelClass={LABEL_CLASS}
              fieldError={(field) => fieldError(error, field)}
              onFullName={setFullName}
              onPhone={setPhone}
              onEmail={setEmail}
              onRole={setRole}
            />

            {formError && (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                {formError}
              </p>
            )}

            {isCreate && (
              <p className="mt-3 rounded-xl bg-zinc-100 px-3 py-2.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                Chỉ quản trị viên được tạo tài khoản thợ/điều phối. Mật khẩu tạm
                hiển thị trong danh sách cho đến khi nhân viên đổi mật khẩu.
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={submit}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {pending ? (
                  <FiLoader
                    aria-hidden="true"
                    className="h-4 w-4 motion-safe:animate-spin"
                  />
                ) : (
                  <FiSave aria-hidden="true" className="h-4 w-4" />
                )}
                {pending
                  ? "Đang xử lý…"
                  : isCreate
                    ? "Tạo tài khoản"
                    : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
