import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

import { getSessionManager } from "../lib/session-manager";

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 0,
				gcTime: 1000 * 60 * 5,
				retry: 3,
				refetchOnWindowFocus: true,
				refetchOnMount: true,
				refetchOnReconnect: true,
				refetchInterval: false,
			},
			mutations: {
				retry: 1,
			},
		},
	});
}

const globalQueryClient = createQueryClient();

interface QueryProviderProperties {
	children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProperties) {
	const sessionManager = getSessionManager();
	const currentUser = sessionManager.getUsername();
	const queryClient = createQueryClient();

	return (
		<QueryClientProvider key={currentUser || "no-user"} client={queryClient}>
			{children}
			{process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
		</QueryClientProvider>
	);
}

export function getQueryClient(): QueryClient {
	return globalQueryClient;
}
