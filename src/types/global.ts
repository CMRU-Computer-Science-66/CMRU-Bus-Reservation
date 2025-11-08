import type { SessionManager } from "../lib/session-manager";

export interface GlobalThis {
	sessionManager?: SessionManager;
	setIsAutoLogging?: (value: boolean) => void;
}

export interface ApiError extends Error {
	status?: number;
}

export function isApiError(error: unknown): error is ApiError {
	return error instanceof Error && "status" in error;
}
