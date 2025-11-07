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

	return "http://165.101.64.33:3000";
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
		},
	},
} as const;

export function getApiUrl(path: string): string {
	return `${API_CONFIG.BASE_URL}${path}`;
}
