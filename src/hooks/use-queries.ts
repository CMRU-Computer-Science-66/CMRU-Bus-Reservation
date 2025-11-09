import type { ParsedScheduleData } from "@cmru-comsci-66/cmru-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "../contexts/api-context";
import { getSessionManager } from "../lib/session-manager";

function getCurrentUser(): string | null {
	return getSessionManager().getUsername();
}

export const queryKeys = {
	schedule: (page?: number) => ["schedule", getCurrentUser(), page] as const,
	availableBuses: () => ["availableBuses", getCurrentUser()] as const,
	allSchedules: () => ["allSchedules", getCurrentUser()] as const,
} as const;

export function useScheduleQuery(page: number = 1, enabled: boolean = true) {
	const { getSchedule } = useApi();

	return useQuery({
		queryKey: queryKeys.schedule(page),
		queryFn: () => getSchedule(page),
		enabled,
		staleTime: 0,
		gcTime: 1000 * 60 * 5,
	});
}

export function useAvailableBusesQuery(enabled: boolean = true) {
	const { getAvailableBuses } = useApi();

	return useQuery({
		queryKey: queryKeys.availableBuses(),
		queryFn: () => getAvailableBuses(),
		enabled,
		staleTime: 0,
		gcTime: 1000 * 60 * 5,
	});
}

export function useAllSchedulesQuery(enabled: boolean = true) {
	const { getSchedule } = useApi();

	return useQuery({
		queryKey: queryKeys.allSchedules(),
		queryFn: async (): Promise<ParsedScheduleData> => {
			const allReservations = [];
			let currentPage = 1;
			let hasMore = true;
			const maxPages = 100;
			const maxReservations = 10_000;

			while (hasMore && currentPage <= maxPages) {
				try {
					const scheduleData = await getSchedule(currentPage);
					if (scheduleData?.reservations && scheduleData.reservations.length > 0) {
						const pageReservations = scheduleData.reservations;

						if (allReservations.length + pageReservations.length > maxReservations) {
							break;
						}

						for (const reservation of pageReservations) {
							allReservations.push(reservation);
						}

						currentPage++;
						hasMore = scheduleData.hasNextPage || false;
					} else {
						hasMore = false;
					}
				} catch {
					hasMore = false;
				}
			}

			return {
				reservations: allReservations,
				totalReservations: allReservations.length,
				userInfo: { name: "" },
				currentPage: 1,
				totalPages: 1,
				hasNextPage: false,
				hasPrevPage: false,
			};
		},
		enabled,
		staleTime: 1000 * 60 * 10,
		gcTime: 1000 * 60 * 60,
	});
}

export function useBookBusMutation() {
	const { bookBus } = useApi();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ date, destinationType, scheduleId }: { date: string; destinationType: 1 | 2; scheduleId: number }) => bookBus(scheduleId, date, destinationType),
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: queryKeys.availableBuses() });
			await queryClient.cancelQueries({ queryKey: ["schedule"] });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["schedule"], refetchType: "active" });
			queryClient.invalidateQueries({ queryKey: queryKeys.availableBuses(), refetchType: "active" });
			queryClient.invalidateQueries({ queryKey: queryKeys.allSchedules(), refetchType: "active" });
		},
		onError: () => {
			queryClient.invalidateQueries({ queryKey: ["schedule"] });
			queryClient.invalidateQueries({ queryKey: queryKeys.availableBuses() });
		},
	});
}

export function useCancelReservationMutation() {
	const { cancelReservation } = useApi();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (unconfirmData: string) => cancelReservation(unconfirmData),
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: ["schedule"] });
			await queryClient.cancelQueries({ queryKey: queryKeys.availableBuses() });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["schedule"], refetchType: "active" });
			queryClient.invalidateQueries({ queryKey: queryKeys.availableBuses(), refetchType: "active" });
			queryClient.invalidateQueries({ queryKey: queryKeys.allSchedules(), refetchType: "active" });
		},
		onError: () => {
			queryClient.invalidateQueries({ queryKey: ["schedule"] });
			queryClient.invalidateQueries({ queryKey: queryKeys.availableBuses() });
		},
	});
}

export function useConfirmReservationMutation() {
	const { confirmReservation } = useApi();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (confirmData: string) => confirmReservation(confirmData),
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: ["schedule"] });
			await queryClient.cancelQueries({ queryKey: queryKeys.availableBuses() });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["schedule"], refetchType: "active" });
			queryClient.invalidateQueries({ queryKey: queryKeys.availableBuses(), refetchType: "active" });
			queryClient.invalidateQueries({ queryKey: queryKeys.allSchedules(), refetchType: "active" });
		},
		onError: () => {
			queryClient.invalidateQueries({ queryKey: ["schedule"] });
			queryClient.invalidateQueries({ queryKey: queryKeys.availableBuses() });
		},
	});
}

export function useDeleteReservationMutation() {
	const { deleteReservation } = useApi();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (reservationId: number) => deleteReservation(reservationId),
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: ["schedule"] });
			await queryClient.cancelQueries({ queryKey: queryKeys.availableBuses() });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["schedule"], refetchType: "active" });
			queryClient.invalidateQueries({ queryKey: queryKeys.availableBuses(), refetchType: "active" });
			queryClient.invalidateQueries({ queryKey: queryKeys.allSchedules(), refetchType: "active" });
		},
		onError: () => {
			queryClient.invalidateQueries({ queryKey: ["schedule"] });
			queryClient.invalidateQueries({ queryKey: queryKeys.availableBuses() });
		},
	});
}

export function useInvalidateQueries() {
	const queryClient = useQueryClient();

	return {
		invalidateSchedule: () => queryClient.invalidateQueries({ queryKey: ["schedule"], refetchType: "active" }),
		invalidateAvailableBuses: () => queryClient.invalidateQueries({ queryKey: queryKeys.availableBuses(), refetchType: "active" }),
		invalidateAllSchedules: () => queryClient.invalidateQueries({ queryKey: queryKeys.allSchedules(), refetchType: "active" }),
		invalidateAll: () => {
			queryClient.invalidateQueries({ queryKey: ["schedule"], refetchType: "active" });
			queryClient.invalidateQueries({ queryKey: queryKeys.availableBuses(), refetchType: "active" });
			queryClient.invalidateQueries({ queryKey: queryKeys.allSchedules(), refetchType: "active" });
		},
		forceRefreshAll: async () => {
			await queryClient.refetchQueries({ queryKey: ["schedule"] });
			await queryClient.refetchQueries({ queryKey: queryKeys.availableBuses() });
			await queryClient.refetchQueries({ queryKey: queryKeys.allSchedules() });
		},
	};
}
