const getBaseUrl = (): string => {
	if (process.env.NODE_ENV === "production" && process.env.API_URL) {
		return process.env.API_URL;
	}

	if (globalThis.window !== undefined && globalThis.location.hostname === "localhost") {
		return "http://localhost:3000";
	}

	return "/api";
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
