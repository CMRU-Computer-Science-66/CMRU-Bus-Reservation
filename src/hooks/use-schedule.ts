import type { ParsedScheduleData } from "@cmru-comsci-66/cmru-api";
import { useCallback, useEffect, useState } from "react";

import { useApi } from "../contexts/api-context";

export function useSchedule(autoFetch: boolean = false, page?: number) {
	const { getSchedule, isAuthenticated } = useApi();
	const [schedule, setSchedule] = useState<ParsedScheduleData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchSchedule = useCallback(async (pageNumber?: number) => {
		setIsLoading(true);
		setError(null);

		try {
			const data = await getSchedule(pageNumber);
			setSchedule(data);
		} catch (error_) {
			const errorMessage = error_ instanceof Error ? error_.message : "ไม่สามารถดึงข้อมูลได้";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [getSchedule]);

	useEffect(() => {
		if (autoFetch && isAuthenticated) {
			fetchSchedule(page);
		}
	}, [autoFetch, isAuthenticated, fetchSchedule, page]);

	return {
		schedule,
		isLoading,
		error,
		refetch: fetchSchedule,
	};
}
