import type { ParsedScheduleData } from "@cmru-comsci-66/cmru-api";
import { useCallback, useEffect, useState } from "react";

import { useApi } from "../contexts/api-context";

export function useSchedule(autoFetch: boolean = false) {
	const { getSchedule, isAuthenticated } = useApi();
	const [schedule, setSchedule] = useState<ParsedScheduleData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchSchedule = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const data = await getSchedule();
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
			fetchSchedule();
		}
	}, [autoFetch, isAuthenticated, fetchSchedule]);

	return {
		schedule,
		isLoading,
		error,
		refetch: fetchSchedule,
	};
}
