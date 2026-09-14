"use client";

import { type FormEvent, useState } from "react";
import { FiCheckCircle, FiKey, FiLoader } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useChangePassword } from "@/hooks/auth";
import type { FieldErrors } from "@/lib/auth/user.types";
import { validateChangePasswordInput } from "@/lib/auth/validation";
import { AuthApiError } from "@/services/auth.api";
import { AuthTextField } from "./AuthTextField";
import { FormAlert } from "./FormAlert";

const EMPTY_ERRORS: FieldErrors = {};

export function ChangePasswordForm() {
  const toast = useToast();
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<FieldErrors>(EMPTY_ERRORS);
  const [serverErrors, setServerErrors] = useState<FieldErrors>(EMPTY_ERRORS);
  const [done, setDone] = useState(false);

  const pending = changePassword.isPending;
  const errors: FieldErrors = { ...clientErrors, ...serverErrors };

  function clearError(field: keyof FieldErrors) {
    setDone(false);
    setClientErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerErrors((prev) => ({
      ...prev,
      [field]: undefined,
      form: undefined,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = validateChangePasswordInput({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (invalid) {
      setClientErrors(invalid);
      setServerErrors(EMPTY_ERRORS);
      return;
    }
    setClientErrors(EMPTY_ERRORS);
    setServerErrors(EMPTY_ERRORS);
    changePassword.mutate(
      { currentPassword, newPassword, confirmPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setDone(true);
          toast.success(
            "Đổi mật khẩu thành công",
            "Mọi thiết bị khác đã bị đăng xuất.",
          );
        },
        onError: (error) => {
          if (error instanceof AuthApiError) {
            setServerErrors(error.errors);
            toast.error(
              "Đổi mật khẩu thất bại",
              error.errors.form ?? "Vui lòng kiểm tra lại thông tin.",
            );
          } else {
            setServerErrors({
              form: "Không đổi được mật khẩu. Vui lòng thử lại.",
            });
            toast.error("Đổi mật khẩu thất bại", "Vui lòng thử lại sau.");
          }
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {errors.form && <FormAlert message={errors.form} />}
      {done && (
        <output className="flex items-start gap-2.5 rounded-lg border border-zinc-300 bg-zinc-100 px-3.5 py-3 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          <FiCheckCircle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span>
            Đổi mật khẩu thành công. Mọi thiết bị khác đã bị đăng xuất.
          </span>
        </output>
      )}

      <AuthTextField
        id="currentPassword"
        label="Mật khẩu hiện tại"
        type="password"
        value={currentPassword}
        onChange={(v) => {
          setCurrentPassword(v);
          clearError("currentPassword");
        }}
        placeholder="Nhập mật khẩu đang dùng"
        autoComplete="current-password"
        error={errors.currentPassword}
        disabled={pending}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AuthTextField
          id="newPassword"
          label="Mật khẩu mới"
          type="password"
          value={newPassword}
          onChange={(v) => {
            setNewPassword(v);
            clearError("newPassword");
          }}
          placeholder="Ít nhất 8 ký tự"
          autoComplete="new-password"
          error={errors.newPassword}
          disabled={pending}
        />
        <AuthTextField
          id="confirmPassword"
          label="Nhập lại mật khẩu mới"
          type="password"
          value={confirmPassword}
          onChange={(v) => {
            setConfirmPassword(v);
            clearError("confirmPassword");
          }}
          placeholder="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          error={errors.confirmPassword}
          disabled={pending}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
      >
        {pending ? (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        ) : (
          <FiKey aria-hidden="true" className="h-4 w-4" />
        )}
        {pending ? "Đang đổi mật khẩu…" : "Đổi mật khẩu"}
      </button>
    </form>
  );
}
