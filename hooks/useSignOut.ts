"use client";

import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/toast/useToast";
import { useLogout } from "@/hooks/auth";
import { postLogoutHref } from "@/lib/auth/auth-redirect";

// Logout with the shared feedback and navigation: toasts on both outcomes,
// and a hard move to /login when the current route needs an account so a
// staff shell never stays mounted for a signed-out visitor.
export function useSignOut(onDone?: () => void) {
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  function signOut() {
    logout.mutate(undefined, {
      onSuccess: () => {
        onDone?.();
        toast.success("Đã đăng xuất", "Hẹn gặp lại bạn.");
        const target = postLogoutHref(pathname);
        if (target) router.replace(target);
        router.refresh();
      },
      onError: () => {
        toast.error("Đăng xuất thất bại", "Vui lòng thử lại sau.");
      },
    });
  }

  return { signOut, isPending: logout.isPending };
}
