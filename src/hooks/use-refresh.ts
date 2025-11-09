import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { queryKeys } from "../hooks/use-queries";

export interface UseRefreshReturn {
	handleRefresh: () => Promise<void>;
	isRefreshing: boolean;
}

export function useRefresh(queryKeyFunction?: () => readonly unknown[]): UseRefreshReturn {
	const [isRefreshing, setIsRefreshing] = useState(false);
	const queryClient = useQueryClient();

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			const promises: Promise<unknown>[] = [new Promise((resolve) => setTimeout(resolve, 500))];

			if (queryKeyFunction) {
				promises.push(queryClient.refetchQueries({ queryKey: queryKeyFunction() }));
			} else {
				promises.push(queryClient.refetchQueries());
			}

			await Promise.all(promises);
		} finally {
			setIsRefreshing(false);
		}
	};

	return {
		isRefreshing,
		handleRefresh,
	};
}

export function useScheduleRefresh(): UseRefreshReturn {
	return useRefresh(() => queryKeys.schedule());
}

export function useAllSchedulesRefresh(): UseRefreshReturn {
	return useRefresh(() => queryKeys.allSchedules());
}
