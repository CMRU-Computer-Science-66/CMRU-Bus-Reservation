import type { ParsedScheduleData, ScheduleReservation } from "@cmru-comsci-66/cmru-api";

import type { FilterState } from "./use-filter-state";

export interface ReservationStatistics {
	all: number;
	cancelled: number;
	completed: number;
	confirmed: number;
	hasQR: number;
}

export function useReservationStatistics(allSchedulesData: ParsedScheduleData | null | undefined): ReservationStatistics {
	if (!allSchedulesData?.reservations) {
		return {
			all: 0,
			cancelled: 0,
			completed: 0,
			confirmed: 0,
			hasQR: 0,
		};
	}

	const reservations = allSchedulesData.reservations;

	return {
		all: reservations.length,
		cancelled: reservations.filter((item) => !item.confirmation?.isConfirmed && !item.travelStatus?.hasCompleted).length,
		completed: reservations.filter((item) => item.travelStatus?.hasCompleted === true).length,
		confirmed: reservations.filter((item) => item.confirmation?.isConfirmed && !item.travelStatus?.hasCompleted).length,
		hasQR: reservations.filter((item) => item.ticket?.hasQRCode).length,
	};
}

export function getFilteredReservations(allSchedulesData: ParsedScheduleData | null | undefined, filter: FilterState): ScheduleReservation[] {
	if (!allSchedulesData?.reservations) return [];

	switch (filter) {
		case "confirmed": {
			return allSchedulesData.reservations.filter((item) => item.confirmation?.isConfirmed && !item.travelStatus?.hasCompleted);
		}
		case "completed": {
			return allSchedulesData.reservations.filter((item) => item.travelStatus?.hasCompleted === true);
		}
		case "cancelled": {
			return allSchedulesData.reservations.filter((item) => !item.confirmation?.isConfirmed && !item.travelStatus?.hasCompleted);
		}
		case "hasQR": {
			return allSchedulesData.reservations.filter((item) => item.ticket?.hasQRCode);
		}
		default: {
			return allSchedulesData.reservations;
		}
	}
}
