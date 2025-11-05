const getBaseUrl = (): string => {
	if (typeof process !== "undefined" && process.env?.API_URL) {
		return process.env.API_URL;
	}

	if (import.meta.env?.API_URL) {
		return import.meta.env.API_URL as string;
	}

	if (globalThis.window !== undefined && globalThis.location.hostname !== "localhost") {
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
			CANCEL: "/bus/cancel",
			VALIDATE: "/bus/validate",
		},
	},
} as const;

export function getApiUrl(path: string): string {
	return `${API_CONFIG.BASE_URL}${path}`;
}
