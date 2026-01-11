import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./trpc";
// import superjson from "superjson";

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          fetch: (input, init) => {
            const adminToken = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;
            const headers = new Headers(init?.headers as HeadersInit);
            if (adminToken) headers.set('x-admin-token', adminToken);
            return fetch(input as RequestInfo, { ...init, credentials: 'include', headers });
          },
        }),
      ],
      // transformer: superjson,
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
