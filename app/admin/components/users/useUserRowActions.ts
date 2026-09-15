"use client";

import { useState } from "react";
import { useAdminUserAction } from "@/hooks/admin";
import type { AdminUserAction } from "@/lib/auth/admin-users.service";
import { AuthApiError } from "@/services/admin.api";

export type UserActionTarget = {
  userId: string;
  fullName: string;
  action: AdminUserAction;
};

function actionError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof AuthApiError) return error.errors.form ?? error.message;
  return "Vui lòng thử lại sau.";
}

// Row actions own the pending row plus the approve/lock confirm dialog.
// Mirrors useCatalogRowActions so both admin sections behave alike.
export function useUserRowActions() {
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<UserActionTarget | null>(
    null,
  );

  const userAction = useAdminUserAction();

  const openAction = (target: UserActionTarget) => {
    userAction.reset();
    setActionTarget(target);
  };

  const closeAction = () => {
    userAction.reset();
    setActionTarget(null);
  };

  const confirmAction = () => {
    if (!actionTarget || userAction.isPending) return;
    setPendingUserId(actionTarget.userId);
    userAction.mutate(
      { userId: actionTarget.userId, action: actionTarget.action },
      {
        onSuccess: () => {
          setPendingUserId(null);
          setActionTarget(null);
        },
        onError: () => setPendingUserId(null),
      },
    );
  };

  return {
    pendingUserId,
    actionTarget,
    actionPending: userAction.isPending,
    actionError: actionTarget ? actionError(userAction.error) : null,
    openAction,
    closeAction,
    confirmAction,
  };
}
