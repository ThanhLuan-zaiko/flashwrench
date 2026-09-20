import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { FiCompass } from "react-icons/fi";
import { authenticateRequest } from "@/lib/auth/authorization";
import { DispatchShell } from "./components/DispatchShell";

// Server-side gate: only users with role "dispatcher" (or "admin", who can
// preview every workspace) render anything under /dispatch. Non-logged-in
// users go to login, other roles get a 403 panel instead of the shell.
export default async function DispatchLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await authenticateRequest();
  if (!user) redirect("/login");

  if (user.role !== "dispatcher" && user.role !== "admin") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16 text-center sm:px-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          <FiCompass aria-hidden="true" className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Khu vực dành cho nhân viên điều phối
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Tài khoản của bạn không có quyền truy cập trang này. Vui lòng liên hệ
          quản trị viên nếu bạn cho rằng đây là nhầm lẫn.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
        >
          Về trang chủ
        </Link>
      </main>
    );
  }

  return <DispatchShell>{children}</DispatchShell>;
}
