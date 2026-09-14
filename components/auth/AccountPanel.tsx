"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiKey,
  FiLoader,
  FiLogOut,
  FiMonitor,
  FiShield,
  FiTrash2,
} from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import {
  useLogout,
  useLogoutAll,
  useMe,
  useRevokeSession,
  useSessions,
} from "@/hooks/auth";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { FormAlert } from "./FormAlert";

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return "—";
  }
}

export function AccountPanel() {
  const router = useRouter();
  const toast = useToast();
  const rootRef = useBentoReveal<HTMLDivElement>();
  const me = useMe();
  const sessions = useSessions(me.data != null);
  const logout = useLogout();
  const logoutAll = useLogoutAll();
  const revoke = useRevokeSession();

  function goLogin() {
    router.push("/login");
    router.refresh();
  }

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast.success("Đã đăng xuất", "Hẹn gặp lại bạn.");
        goLogin();
      },
      onError: () => {
        toast.error("Đăng xuất thất bại", "Vui lòng thử lại sau.");
      },
    });
  }

  function handleLogoutAll() {
    logoutAll.mutate(undefined, {
      onSuccess: () => {
        toast.success(
          "Đã đăng xuất mọi thiết bị",
          "Vui lòng đăng nhập lại để tiếp tục.",
        );
        goLogin();
      },
      onError: () => {
        toast.error("Đăng xuất thất bại", "Vui lòng thử lại sau.");
      },
    });
  }

  function handleRevoke(familyId: string) {
    revoke.mutate(familyId, {
      onSuccess: () => {
        toast.success("Đã thu hồi phiên đăng nhập.");
      },
      onError: () => {
        toast.error("Thu hồi thất bại", "Vui lòng thử lại sau.");
      },
    });
  }

  if (me.isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <FiLoader
          aria-hidden="true"
          className="h-4 w-4 motion-safe:animate-spin"
        />
        Đang tải thông tin tài khoản…
      </p>
    );
  }

  if (!me.data) {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert message="Bạn chưa đăng nhập. Vui lòng đăng nhập để quản lý tài khoản." />
        <button
          type="button"
          onClick={goLogin}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-zinc-700 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Đến trang đăng nhập
        </button>
      </div>
    );
  }

  const user = me.data;
  const busy = logout.isPending || logoutAll.isPending;

  return (
    <div
      ref={rootRef}
      className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-4"
    >
      <section
        data-reveal
        className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Thông tin tài khoản
          </h2>
          <Link
            href="/account/password"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <FiKey aria-hidden="true" className="h-3.5 w-3.5" />
            Đổi mật khẩu
          </Link>
        </div>{" "}
        <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
            <dt className="text-zinc-500 dark:text-zinc-400">Họ và tên</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {user.fullName}
            </dd>
          </div>
          <div className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
            <dt className="text-zinc-500 dark:text-zinc-400">Số điện thoại</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {user.phone}
            </dd>
          </div>
          <div className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
            <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {user.email}
            </dd>
          </div>
          <div className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
            <dt className="text-zinc-500 dark:text-zinc-400">Vai trò</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {user.role}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={handleLogout}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-all duration-200 hover:bg-zinc-100 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <FiLogOut aria-hidden="true" className="h-4 w-4" />
            {logout.isPending ? "Đang đăng xuất…" : "Đăng xuất thiết bị này"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleLogoutAll}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-zinc-700 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <FiShield aria-hidden="true" className="h-4 w-4" />
            {logoutAll.isPending ? "Đang xử lý…" : "Đăng xuất tất cả thiết bị"}
          </button>
        </div>
      </section>

      <section
        data-reveal
        className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          <FiMonitor aria-hidden="true" className="h-4 w-4" />
          Thiết bị đang đăng nhập
        </h2>
        {sessions.isPending ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <FiLoader
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
            Đang tải danh sách thiết bị…
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {(sessions.data ?? []).map((s) => (
              <li
                key={s.familyId}
                className="flex items-center justify-between gap-3 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {s.deviceLabel}
                    {s.current && (
                      <span className="ml-2 rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                        Thiết bị này
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Đăng nhập: {formatDate(s.createdAt)} · Hết hạn:{" "}
                    {formatDate(s.expiresAt)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={revoke.isPending}
                  onClick={() => handleRevoke(s.familyId)}
                  aria-label={`Thu hồi phiên ${s.deviceLabel}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 motion-safe:active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <FiTrash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </li>
            ))}
            {(sessions.data ?? []).length === 0 && (
              <li className="py-3 text-sm text-zinc-500 dark:text-zinc-400">
                Không còn phiên nào khác.
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
