import type { ParsedScheduleData } from "@cmru-comsci-66/cmru-api";
import { useCallback, useEffect, useState } from "react";

import { useApi } from "../contexts/api-context";

export function useSchedule(autoFetch: boolean = false, page?: number, perPage: number = 10) {
	const { getSchedule, isAuthenticated } = useApi();
	const [schedule, setSchedule] = useState<ParsedScheduleData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchSchedule = useCallback(
		async (pageNumber?: number, itemsPerPage: number = 10) => {
			setIsLoading(true);
			setError(null);

			try {
				const data = await getSchedule(pageNumber, itemsPerPage);
				setSchedule(data);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "ไม่สามารถดึงข้อมูลได้";
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[getSchedule],
	);

	useEffect(() => {
		if (autoFetch && isAuthenticated) {
			fetchSchedule(page, perPage);
		}
	}, [autoFetch, isAuthenticated, fetchSchedule, page, perPage]);

	return {
		schedule,
		isLoading,
		error,
		refetch: fetchSchedule,
	};
}
