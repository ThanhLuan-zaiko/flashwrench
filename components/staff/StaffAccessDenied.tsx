import Link from "next/link";
import type { IconType } from "react-icons";
import { BRAND_SOLID_BUTTON } from "@/components/ui/brand";

type StaffAccessDeniedProps = {
  icon: IconType;
  title: string;
};

// 403 panel rendered by a staff portal layout when the signed-in role may
// not enter that portal.
export function StaffAccessDenied({
  icon: Icon,
  title,
}: StaffAccessDeniedProps) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start px-4 py-16 sm:px-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E3A5F] text-white dark:bg-zinc-100 dark:text-zinc-900">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </span>
      <p className="mt-5 text-xs font-semibold tracking-[0.14em] text-[#1E3A5F] uppercase dark:text-zinc-400">
        Không có quyền truy cập
      </p>
      <h1 className="mt-2 text-3xl leading-tight font-extrabold tracking-tight text-balance text-[#1E3A5F] sm:text-4xl dark:text-zinc-50">
        {title}
      </h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        Tài khoản của bạn không có quyền truy cập trang này. Vui lòng liên hệ
        quản trị viên nếu bạn cho rằng đây là nhầm lẫn.
      </p>
      <Link href="/" className={`mt-6 ${BRAND_SOLID_BUTTON}`}>
        Về trang chủ
      </Link>
    </main>
  );
}
