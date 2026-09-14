"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { FiLoader, FiLock, FiLogIn } from "react-icons/fi";
import { useLogin } from "@/hooks/auth";
import type { FieldErrors } from "@/lib/auth/user.types";
import { validateLoginInput } from "@/lib/auth/validation";
import { AuthApiError } from "@/services/auth.api";
import { AuthTextField } from "./AuthTextField";
import { FormAlert } from "./FormAlert";

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  const pending = login.isPending;
  const errors: FieldErrors = { ...clientErrors, ...serverErrors };

  function handleChange(field: "identifier" | "password", value: string) {
    if (field === "identifier") setIdentifier(value);
    else setPassword(value);
    setClientErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerErrors((prev) => ({
      ...prev,
      [field]: undefined,
      form: undefined,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = validateLoginInput({ identifier, password });
    if (invalid) {
      setClientErrors(invalid);
      setServerErrors({});
      return;
    }
    setClientErrors({});
    setServerErrors({});
    login.mutate(
      { identifier: identifier.trim(), password },
      {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
        onError: (error) => {
          if (error instanceof AuthApiError) setServerErrors(error.errors);
          else
            setServerErrors({
              form: "Không đăng nhập được. Vui lòng thử lại.",
            });
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {errors.form && <FormAlert message={errors.form} />}

      <AuthTextField
        id="identifier"
        label="Số điện thoại hoặc email"
        value={identifier}
        onChange={(v) => handleChange("identifier", v)}
        placeholder="Ví dụ: 0912345678"
        autoComplete="username"
        inputMode="tel"
        error={errors.identifier}
        disabled={pending}
      />

      <AuthTextField
        id="password"
        label="Mật khẩu"
        type="password"
        value={password}
        onChange={(v) => handleChange("password", v)}
        placeholder="Nhập mật khẩu của bạn"
        autoComplete="current-password"
        error={errors.password}
        disabled={pending}
      />

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
      >
        {pending ? (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        ) : (
          <FiLogIn aria-hidden="true" className="h-4 w-4" />
        )}
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <FiLock aria-hidden="true" className="h-3.5 w-3.5" />
        Thông tin của bạn được bảo mật an toàn.
      </p>
    </form>
  );
}
