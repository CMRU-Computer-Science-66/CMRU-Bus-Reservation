import toast from "react-hot-toast";

import { createResilientApiClient } from "../lib/resilient-api-client";

const getBaseUrl = (): string => {
	if (typeof process !== "undefined" && process.env?.API_URL) {
		return process.env.API_URL;
	}

	if (import.meta.env?.API_URL) {
		return import.meta.env.API_URL as string;
	}

	if (globalThis.window !== undefined && globalThis.location.hostname === "localhost") {
		return "http://localhost:3000";
	}

	if (globalThis.window !== undefined) {
		return "/api";
	}

	return process.env.API_URL || "/api";
};

export const API_CONFIG = {
	BASE_URL: getBaseUrl(),
	ENDPOINTS: {
		HEALTH: "/health",
		BUS: {
			LOGIN: "/bus/login",
			SCHEDULE: "/bus/schedule",
			AVAILABLE: "/bus/available",
			BOOK: "/bus/book",
			CONFIRM: "/bus/confirm",
			UNCONFIRM: "/bus/unconfirm",
			DELETE: "/bus/delete",
			CANCEL: "/bus/cancel",
			VALIDATE: "/bus/validate",
			TICKET_QR: "/bus/ticket/qrcode",
			TICKET_INFO: "/bus/ticket/info",
		},
	},
} as const;

export function getApiUrl(path: string): string {
	return `${API_CONFIG.BASE_URL}${path}`;
}

let apiClient: ReturnType<typeof createResilientApiClient> | null = null;

export function initializeApiClient(): ReturnType<typeof createResilientApiClient> {
	if (apiClient) return apiClient;

	apiClient = createResilientApiClient({
		baseUrl: API_CONFIG.BASE_URL,
		timeout: 15_000,
		retry: {
			attempts: 3,
			baseDelay: 1000,
			maxDelay: 8000,
			backoffFactor: 2,
		},
		onRetry: (attempt, error) => {
			console.warn(`API retry attempt ${attempt}:`, error);
		},
		onConnectionLost: () => {
			toast.error("การเชื่อมต่อกับเซิร์ฟเวอร์ขาดหาย กำลังพยายามเชื่อมต่อใหม่...", {
				id: "connection-lost",
			});
		},
		onConnectionRestored: () => {
			toast.dismiss("connection-lost");
			toast.success("เชื่อมต่อกับเซิร์ฟเวอร์สำเร็จแล้ว", {
				id: "connection-restored",
			});
		},
	});

	return apiClient;
}

export function getApiClient() {
	if (!apiClient) {
		return initializeApiClient();
	}

	return apiClient;
}
