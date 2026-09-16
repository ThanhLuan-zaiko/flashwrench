"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { authKeys } from "@/hooks/auth";
import type { AccountSession } from "@/lib/auth/account-status";

type QueryProviderProps = {
  children: ReactNode;
  // First-paint seed from the server layout. The header reads the session
  // synchronously from this cache entry, so it never flashes a spinner nor
  // fires /api/auth/me on mount while the seed is fresh. Mutations keep
  // overwriting the entry afterwards, so this is only the initial value.
  initialSession?: AccountSession;
};

export function QueryProvider({
  children,
  initialSession,
}: QueryProviderProps) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,
          gcTime: 5 * 60 * 1000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
    if (initialSession !== undefined) {
      queryClient.setQueryData(authKeys.me, initialSession);
    }
    return queryClient;
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
