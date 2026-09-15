"use client";

import { useState } from "react";
import { useAdminUserAction } from "@/hooks/admin";
import type {
  AdminUserAction,
  AdminUserItem,
} from "@/lib/auth/admin-users.service";
import { AuthApiError } from "@/services/admin.api";
import { canAdminManageUser } from "./admin-user-guards";

export type UserActionTarget = {
  userId: string;
  fullName: string;
  action: AdminUserAction;
  role?: AdminUserItem["role"];
};

function actionError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof AuthApiError) return error.errors.form ?? error.message;
  return null;
}

// Row actions own the pending row plus the approve/lock confirm dialog.
// Mirrors useCatalogRowActions so both admin sections behave alike.
// Defense in depth: never open the confirm dialog for the current admin
// or for admin accounts, matching the backend 403 rules.
export function useUserRowActions(currentUserId?: string | null) {
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<UserActionTarget | null>(
    null,
  );

  const userAction = useAdminUserAction();

  const openAction = (target: UserActionTarget) => {
    if (
      !canAdminManageUser(currentUserId, {
        id: target.userId,
        role: target.role ?? "customer",
      })
    ) {
      return;
    }
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
