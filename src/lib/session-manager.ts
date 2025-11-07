export interface SessionData {
	isAuthenticated: boolean;
	lastValidated: number;
	oneClickEnabled?: boolean;
	password: string;
	username: string;
}

const STORAGE_KEY = "cmru_bus_session";
const SESSION_VALIDITY_DURATION = 5 * 60 * 1000;

export class SessionManager {
	private static instance: SessionManager;

	private constructor() {}

	public static getInstance(): SessionManager {
		if (!SessionManager.instance) {
			SessionManager.instance = new SessionManager();
		}
		return SessionManager.instance;
	}

	public saveSession(username: string, password: string): void {
		if (typeof window === "undefined" || !window.localStorage) {
			return;
		}

		const sessionData: SessionData = {
			username,
			password,
			isAuthenticated: true,
			lastValidated: Date.now(),
		};

		try {
			const encrypted = btoa(JSON.stringify(sessionData));
			localStorage.setItem(STORAGE_KEY, encrypted);
		} catch (error) {
			console.error("Failed to save session:", error);
		}
	}

	public loadSession(): SessionData | null {
		try {
			if (typeof window === "undefined" || !window.localStorage) {
				return null;
			}

			const encrypted = localStorage.getItem(STORAGE_KEY);
			if (!encrypted) return null;

			const sessionData = JSON.parse(atob(encrypted)) as SessionData;
			return sessionData;
		} catch (error) {
			console.error("Failed to load session:", error);
			return null;
		}
	}

	public hasSession(): boolean {
		const session = this.loadSession();
		return session !== null && session.isAuthenticated;
	}

	public isSessionValid(): boolean {
		const session = this.loadSession();
		if (!session || !session.isAuthenticated) {
			return false;
		}

		const timeSinceLastValidation = Date.now() - session.lastValidated;
		return timeSinceLastValidation < SESSION_VALIDITY_DURATION;
	}

	public updateLastValidated(): void {
		const session = this.loadSession();
		if (session) {
			session.lastValidated = Date.now();
			try {
				const encrypted = btoa(JSON.stringify(session));
				localStorage.setItem(STORAGE_KEY, encrypted);
			} catch (error) {
				console.error("Failed to update session:", error);
			}
		}
	}

	public getCredentials(): { password: string; username: string } | null {
		const session = this.loadSession();
		if (!session || !session.isAuthenticated) {
			return null;
		}
		return {
			username: session.username,
			password: session.password,
		};
	}

	public clearSession(): void {
		if (typeof window === "undefined" || !window.localStorage) {
			return;
		}

		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch (error) {
			console.error("Failed to clear session:", error);
		}
	}

	public getOneClickEnabled(): boolean {
		const session = this.loadSession();
		return session?.oneClickEnabled ?? true;
	}

	public setOneClickEnabled(enabled: boolean): void {
		const session = this.loadSession();
		if (session) {
			session.oneClickEnabled = enabled;
			try {
				const encrypted = btoa(JSON.stringify(session));
				localStorage.setItem(STORAGE_KEY, encrypted);
			} catch (error) {
				console.error("Failed to update oneClick setting:", error);
			}
		}
	}

	public markSessionInvalid(): void {
		const session = this.loadSession();
		if (session) {
			session.lastValidated = 0;
			try {
				const encrypted = btoa(JSON.stringify(session));
				localStorage.setItem(STORAGE_KEY, encrypted);
			} catch (error) {
				console.error("Failed to mark session invalid:", error);
			}
		}
	}
}

export const getSessionManager = () => SessionManager.getInstance();
