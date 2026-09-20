import {
  type Query,
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  type AccountSession,
  type AccountStatus,
  changePasswordRequest,
  fetchAccountSession,
  fetchSessions,
  loginRequest,
  logoutAllRequest,
  logoutRequest,
  type PublicUser,
  registerRequest,
  revokeSessionRequest,
} from "@/services/auth.api";

export const authKeys = {
  all: ["auth"] as const,
  me: ["auth", "me"] as const,
  sessions: ["auth", "sessions"] as const,
};

type AccountSessionQueryOptions = {
  refetchInterval?:
    | number
    | false
    | ((
        query: Query<AccountSession, Error, AccountSession>,
      ) => number | false | undefined);
  refetchOnWindowFocus?: boolean;
};

// The account session is one cached entry shared by every consumer: the
// header/menus read the user, the lock guard reads the status and runs its
// own polling timer on top (each observer keeps its own interval).
export function useAccountSession(options?: AccountSessionQueryOptions) {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: fetchAccountSession,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useMe() {
  const query = useAccountSession();
  return { ...query, data: query.data?.user ?? null };
}

// The cached entry is always `{ user, status }`. Writing a bare user here
// would leave `useMe` and the lock guard reading a half-shaped object.
function setAccountSession(
  queryClient: QueryClient,
  user: PublicUser | null,
  status: AccountStatus = "active",
): void {
  queryClient.setQueryData<AccountSession>(authKeys.me, { user, status });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      queryClient.clear();
      setAccountSession(queryClient, data.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerRequest,
    onSuccess: (data) => {
      queryClient.clear();
      setAccountSession(queryClient, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      queryClient.clear();
      setAccountSession(queryClient, null);
    },
  });
}

export function useLogoutAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutAllRequest,
    onSuccess: () => {
      queryClient.clear();
      setAccountSession(queryClient, null);
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
      setAccountSession(queryClient, data.user);
      void queryClient.invalidateQueries({ queryKey: authKeys.sessions });
    },
  });
}
