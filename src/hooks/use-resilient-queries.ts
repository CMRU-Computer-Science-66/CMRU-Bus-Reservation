import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApiClient } from "../config/api";
import { getSessionManager } from "../lib/session-manager";

function getCurrentUser(): string | null {
	return getSessionManager().getUsername();
}

interface LoginCredentials {
	password: string;
	username: string;
}

interface BusBookingData {
	destinationType: 1 | 2;
	oneClick?: boolean;
	scheduleDate: string;
	scheduleId: number;
}

interface ConfirmationData {
	data: string;
}

export function useLogin() {
	const queryClient = useQueryClient();
	const apiClient = getApiClient();

	return useMutation({
		mutationFn: async (credentials: LoginCredentials) => {
			return apiClient.post("/bus/login", credentials);
		},
		onSuccess: () => {
			const currentUser = getCurrentUser();
			queryClient.invalidateQueries({ queryKey: ["bus", currentUser] });
			queryClient.invalidateQueries({ queryKey: ["validate", currentUser] });
		},
		retry: (failureCount, error) => {
			if (error instanceof Error) {
				const message = error.message.toLowerCase();

				if (message.includes("401") || message.includes("403") || message.includes("unauthorized")) {
					return false;
				}
			}
			return failureCount < 2;
		},
	});
}

export function useValidateSession() {
	const apiClient = getApiClient();

	return useQuery({
		queryKey: ["validate", getCurrentUser()],
		queryFn: async () => {
			const sessionManager = getSessionManager();
			return apiClient.getWithAuthAndRetry<{ valid: boolean }>("/bus/validate", () => sessionManager.getToken());
		},
		staleTime: 2 * 60 * 1000,
		gcTime: 5 * 60 * 1000,
		retry: (failureCount, error) => {
			if (error instanceof Error) {
				const message = error.message.toLowerCase();
				if (message.includes("401") || message.includes("403")) {
					return false;
				}
			}
			return failureCount < 2;
		},
	});
}

export function useAvailableBuses() {
	const apiClient = getApiClient();

	return useQuery({
		queryKey: ["bus", "available", getCurrentUser()],
		queryFn: async () => {
			const sessionManager = getSessionManager();
			return apiClient.getWithAuthAndRetry("/bus/available", () => sessionManager.getToken());
		},
		staleTime: 30 * 1000,
		refetchInterval: 60 * 1000,
		retry: 2,
	});
}

export function useBusSchedule(page = 1, perPage = 10) {
	const apiClient = getApiClient();

	return useQuery({
		queryKey: ["bus", "schedule", getCurrentUser(), page, perPage],
		queryFn: async () => {
			const sessionManager = getSessionManager();
			return apiClient.getWithAuthAndRetry(`/bus/schedule?page=${page}&perPage=${perPage}`, () => sessionManager.getToken());
		},
		staleTime: 30 * 1000,
		retry: 2,
	});
}

export function useBusBooking() {
	const queryClient = useQueryClient();
	const apiClient = getApiClient();

	return useMutation({
		mutationFn: async (bookingData: BusBookingData) => {
			const sessionManager = getSessionManager();
			return apiClient.postWithAuthAndRetry("/bus/book", bookingData, () => sessionManager.getToken());
		},
		onSuccess: () => {
			const currentUser = getCurrentUser();
			queryClient.invalidateQueries({ queryKey: ["bus", "schedule", currentUser] });
			queryClient.invalidateQueries({ queryKey: ["bus", "available", currentUser] });
		},
		retry: 1,
	});
}

export function useConfirmReservation() {
	const queryClient = useQueryClient();
	const apiClient = getApiClient();

	return useMutation({
		mutationFn: async (confirmationData: ConfirmationData) => {
			const sessionManager = getSessionManager();
			return apiClient.postWithAuthAndRetry("/bus/confirm", confirmationData, () => sessionManager.getToken());
		},
		onSuccess: () => {
			const currentUser = getCurrentUser();
			queryClient.invalidateQueries({ queryKey: ["bus", "schedule", currentUser] });
		},
		retry: 1,
	});
}

export function useUnconfirmReservation() {
	const queryClient = useQueryClient();
	const apiClient = getApiClient();

	return useMutation({
		mutationFn: async ({ data, oneClick }: { data: string; oneClick?: boolean }) => {
			const sessionManager = getSessionManager();
			return apiClient.postWithAuthAndRetry("/bus/unconfirm", { data, oneClick }, () => sessionManager.getToken());
		},
		onSuccess: () => {
			const currentUser = getCurrentUser();
			queryClient.invalidateQueries({ queryKey: ["bus", "schedule", currentUser] });
		},
		retry: 1,
	});
}

export function useDeleteReservation() {
	const queryClient = useQueryClient();
	const apiClient = getApiClient();

	return useMutation({
		mutationFn: async (reservationId: string | number) => {
			const sessionManager = getSessionManager();
			return apiClient.postWithAuthAndRetry("/bus/delete", { reservationId }, () => sessionManager.getToken());
		},
		onSuccess: () => {
			const currentUser = getCurrentUser();
			queryClient.invalidateQueries({ queryKey: ["bus", "schedule", currentUser] });
		},
		retry: 1,
	});
}

export function useCancelReservation() {
	const queryClient = useQueryClient();
	const apiClient = getApiClient();

	return useMutation({
		mutationFn: async (reservationId: string | number) => {
			const sessionManager = getSessionManager();
			return apiClient.postWithAuthAndRetry("/bus/cancel", { reservationId }, () => sessionManager.getToken());
		},
		onSuccess: () => {
			const currentUser = getCurrentUser();
			queryClient.invalidateQueries({ queryKey: ["bus", "schedule", currentUser] });
		},
		retry: 1,
	});
}

export function useTicketInfo(ticketId: string) {
	const apiClient = getApiClient();

	return useQuery({
		queryKey: ["bus", "ticket", "info", getCurrentUser(), ticketId],
		queryFn: async () => {
			const sessionManager = getSessionManager();
			return apiClient.getWithAuthAndRetry(`/bus/ticket/info?ticketId=${ticketId}`, () => sessionManager.getToken());
		},
		enabled: !!ticketId,
		staleTime: 5 * 60 * 1000,
		retry: 2,
	});
}

export function useHealthCheck() {
	const apiClient = getApiClient();

	return useQuery({
		queryKey: ["health"],
		queryFn: async () => {
			return apiClient.get("/health");
		},
		refetchInterval: 30 * 1000,
		staleTime: 15 * 1000,
		retry: 1,
	});
}

export function useConnectionStatus() {
	const apiClient = getApiClient();

	return useQuery({
		queryKey: ["connection-status"],
		queryFn: () => ({
			isConnected: apiClient.getConnectionStatus(),
			lastCheck: new Date(),
		}),
		refetchInterval: 5000,
		staleTime: 2000,
		retry: false,
	});
}
