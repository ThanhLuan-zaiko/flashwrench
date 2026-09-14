import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changePasswordRequest,
  fetchMe,
  fetchSessions,
  loginRequest,
  logoutAllRequest,
  logoutRequest,
  registerRequest,
  revokeSessionRequest,
} from "@/services/auth.api";

export const authKeys = {
  all: ["auth"] as const,
  me: ["auth", "me"] as const,
  sessions: ["auth", "sessions"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerRequest,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null);
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

export function useLogoutAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutAllRequest,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null);
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

export function useSessions(enabled = true) {
  return useQuery({
    queryKey: authKeys.sessions,
    queryFn: fetchSessions,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeSessionRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.sessions });
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changePasswordRequest,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me, data.user);
      void queryClient.invalidateQueries({ queryKey: authKeys.sessions });
    },
  });
}
