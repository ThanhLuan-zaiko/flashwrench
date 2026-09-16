"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { FiLoader, FiUserPlus } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useMe, useRegister } from "@/hooks/auth";
import { resolvePostAuthHref } from "@/lib/auth/auth-redirect";
import type { FieldErrors } from "@/lib/auth/user.types";
import { validateRegisterInput } from "@/lib/auth/validation";
import { AuthApiError } from "@/services/auth.api";
import { AuthTextField } from "./AuthTextField";
import { FormAlert } from "./FormAlert";

const EMPTY_ERRORS: FieldErrors = {};

type RegisterFormProps = {
  next?: string | null;
};

export function RegisterForm({ next }: RegisterFormProps) {
  const router = useRouter();
  const toast = useToast();
  const register = useRegister();
  const me = useMe();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<FieldErrors>(EMPTY_ERRORS);
  const [serverErrors, setServerErrors] = useState<FieldErrors>(EMPTY_ERRORS);

  const pending = register.isPending;
  const errors: FieldErrors = { ...clientErrors, ...serverErrors };

  // Client-side mirror of the server bounce on this page: a logged-in
  // customer who reaches the form (back button, stale link) leaves
  // immediately instead of seeing a second register form.
  useEffect(() => {
    if (!me.isPending && me.data) {
      router.replace(resolvePostAuthHref(me.data.role, next));
    }
  }, [me.isPending, me.data, next, router]);

  function clearError(field: keyof FieldErrors) {
    setClientErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerErrors((prev) => ({
      ...prev,
      [field]: undefined,
      form: undefined,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = validateRegisterInput({
      fullName,
      phone,
      email,
      password,
      confirmPassword,
    });
    if (invalid) {
      setClientErrors(invalid);
      setServerErrors(EMPTY_ERRORS);
      return;
    }
    setClientErrors(EMPTY_ERRORS);
    setServerErrors(EMPTY_ERRORS);
    register.mutate(
      {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      },
      {
        onSuccess: (data) => {
          toast.success(
            "Tạo tài khoản thành công",
            "Chào mừng bạn đến với FlashWrench.",
          );
          router.push(resolvePostAuthHref(data.user.role, next));
          router.refresh();
        },
        onError: (error) => {
          if (error instanceof AuthApiError) {
            setServerErrors(error.errors);
            toast.error(
              "Không tạo được tài khoản",
              error.errors.form ?? "Vui lòng kiểm tra lại thông tin.",
            );
          } else {
            setServerErrors({ form: "Không đăng ký được. Vui lòng thử lại." });
            toast.error("Không tạo được tài khoản", "Vui lòng thử lại sau.");
          }
        },
      },
    );
  }

  if (!me.isPending && me.data) {
    return (
      <output
        aria-label="Bạn đã đăng nhập, đang chuyển hướng"
        className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-500 dark:text-zinc-400"
      >
        <FiLoader
          aria-hidden="true"
          className="h-4 w-4 motion-safe:animate-spin"
        />
        Bạn đã đăng nhập, đang chuyển hướng…
      </output>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {errors.form && <FormAlert message={errors.form} />}

      <AuthTextField
        id="fullName"
        label="Họ và tên"
        value={fullName}
        onChange={(v) => {
          setFullName(v);
          clearError("fullName");
        }}
        placeholder="Ví dụ: Nguyễn Văn An"
        autoComplete="name"
        error={errors.fullName}
        disabled={pending}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AuthTextField
          id="phone"
          label="Số điện thoại"
          value={phone}
          onChange={(v) => {
            setPhone(v);
            clearError("phone");
          }}
          placeholder="0912345678"
          autoComplete="tel"
          inputMode="tel"
          error={errors.phone}
          disabled={pending}
        />
        <AuthTextField
          id="email"
          label="Email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            clearError("email");
          }}
          placeholder="ban@example.com"
          autoComplete="email"
          inputMode="email"
          error={errors.email}
          disabled={pending}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AuthTextField
          id="password"
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            clearError("password");
          }}
          placeholder="Ít nhất 8 ký tự"
          autoComplete="new-password"
          error={errors.password}
          disabled={pending}
        />
        <AuthTextField
          id="confirmPassword"
          label="Nhập lại mật khẩu"
          type="password"
          value={confirmPassword}
          onChange={(v) => {
            setConfirmPassword(v);
            clearError("confirmPassword");
          }}
          placeholder="Nhập lại mật khẩu"
          autoComplete="new-password"
          error={errors.confirmPassword}
          disabled={pending}
        />
      </div>

      <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái và chữ số. Bằng cách
        đăng ký, bạn đồng ý với điều khoản sử dụng của FlashWrench.
      </p>

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
          <FiUserPlus aria-hidden="true" className="h-4 w-4" />
        )}
        {pending ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
      </button>
    </form>
  );
}
