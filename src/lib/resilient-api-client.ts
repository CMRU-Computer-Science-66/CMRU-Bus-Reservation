import type { ApiError, GlobalThis } from "../types/global";

interface RetryConfig {
	attempts: number;
	backoffFactor: number;
	baseDelay: number;
	maxDelay: number;
	retryCondition?: (error: unknown) => boolean;
}

interface ApiClientConfig {
	baseUrl: string;
	onConnectionLost?: () => void;
	onConnectionRestored?: () => void;
	onRetry?: (attempt: number, error: unknown) => void;
	retry?: Partial<RetryConfig>;
	timeout?: number;
}

export class ResilientApiClient {
	private readonly config: Required<ApiClientConfig>;
	private readonly retryConfig: Required<RetryConfig>;
	private isConnected = true;
	private healthCheckInterval?: number;
	private autoReloginCallback?: (username: string, password: string) => Promise<string | null>;

	constructor(config: ApiClientConfig) {
		this.config = {
			timeout: 10_000,
			onRetry: () => {},
			onConnectionLost: () => {},
			onConnectionRestored: () => {},
			...config,
			retry: { ...this.getDefaultRetryConfig(), ...config.retry },
		};

		this.retryConfig = {
			...this.getDefaultRetryConfig(),
			...config.retry,
		};

		this.startHealthCheck();
	}

	private getDefaultRetryConfig(): Required<RetryConfig> {
		return {
			attempts: 3,
			baseDelay: 1000,
			maxDelay: 10_000,
			backoffFactor: 2,
			retryCondition: (error: unknown) => {
				if (error instanceof Error) {
					const message = error.message.toLowerCase();
					return message.includes("network") || message.includes("timeout") || message.includes("econnrefused") || message.includes("fetch");
				}
				return false;
			},
		};
	}

	private async delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private calculateDelay(attempt: number): number {
		const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1);
		return Math.min(delay, this.retryConfig.maxDelay);
	}

	private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
		let lastError: unknown;

		for (let attempt = 1; attempt <= this.retryConfig.attempts; attempt++) {
			try {
				const result = await operation();

				if (!this.isConnected) {
					this.isConnected = true;
					this.config.onConnectionRestored();
				}

				return result;
			} catch (error) {
				lastError = error;

				if (!this.retryConfig.retryCondition(error) || attempt === this.retryConfig.attempts) {
					if (this.isNetworkError(error) && this.isConnected) {
						this.isConnected = false;
						this.config.onConnectionLost();
					}
					throw error;
				}

				this.config.onRetry(attempt, error);

				if (attempt < this.retryConfig.attempts) {
					const delayMs = this.calculateDelay(attempt);

					await this.delay(delayMs);
				}
			}
		}

		throw lastError;
	}

	private isNetworkError(error: unknown): boolean {
		if (error instanceof Error) {
			const message = error.message.toLowerCase();
			return (
				message.includes("network") ||
				message.includes("timeout") ||
				message.includes("econnrefused") ||
				message.includes("fetch") ||
				message.includes("connection") ||
				message.includes("ENOTFOUND")
			);
		}
		return false;
	}

	public async get<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
		return this.executeWithRetry(async () => {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

			try {
				const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
					...options,
					signal: controller.signal,
					headers: {
						"Content-Type": "application/json",
						...options?.headers,
					},
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
					const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`) as ApiError;

					error.status = response.status;
					throw error;
				}

				return await response.json();
			} finally {
				clearTimeout(timeoutId);
			}
		});
	}

	public async post<T = unknown>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
		return this.executeWithRetry(async () => {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

			try {
				const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
					method: "POST",
					...options,
					signal: controller.signal,
					headers: {
						"Content-Type": "application/json",
						...options?.headers,
					},
					body: data ? JSON.stringify(data) : undefined,
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
					const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`) as ApiError;
					error.status = response.status;
					throw error;
				}

				return await response.json();
			} finally {
				clearTimeout(timeoutId);
			}
		});
	}

	public async getWithAuth<T = unknown>(endpoint: string, token?: string, options?: RequestInit): Promise<T> {
		const headers: HeadersInit = {
			"Content-Type": "application/json",
			...options?.headers,
		};

		if (token) {
			(headers as Record<string, string>).Authorization = `Bearer ${token}`;
		}

		return this.get<T>(endpoint, { ...options, headers });
	}

	public async postWithAuth<T = unknown>(endpoint: string, data?: unknown, token?: string, options?: RequestInit): Promise<T> {
		const headers: HeadersInit = {
			"Content-Type": "application/json",
			...options?.headers,
		};

		if (token) {
			(headers as Record<string, string>).Authorization = `Bearer ${token}`;
		}

		return this.post<T>(endpoint, data, { ...options, headers });
	}

	public async healthCheck(): Promise<boolean> {
		try {
			await this.get("/health");
			return true;
		} catch {
			return false;
		}
	}

	private startHealthCheck(): void {
		if (typeof window === "undefined") return;

		this.healthCheckInterval = window.setInterval(async () => {
			const isHealthy = await this.healthCheck();

			if (!isHealthy && this.isConnected) {
				this.isConnected = false;
				this.config.onConnectionLost();
			} else if (isHealthy && !this.isConnected) {
				this.isConnected = true;
				this.config.onConnectionRestored();
			}
		}, 30_000);
	}

	public stopHealthCheck(): void {
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
			this.healthCheckInterval = undefined;
		}
	}

	public getConnectionStatus(): boolean {
		return this.isConnected;
	}

	public setAutoReloginCallback(callback: (username: string, password: string) => Promise<string | null>): void {
		this.autoReloginCallback = callback;
	}

	private async handleUnauthorized<T>(originalRequest: () => Promise<T>, retryCount: number = 0): Promise<T> {
		const maxRetries = 3;
		const retryDelay = 2000;

		if (this.autoReloginCallback && retryCount < maxRetries) {
			try {
				const sessionManager = (globalThis as GlobalThis).sessionManager;
				if (sessionManager?.getUsername && sessionManager?.getPassword && sessionManager?.isAutoLoginEnabled()) {
					const username = sessionManager.getUsername();
					const password = sessionManager.getPassword();

					if (username && password) {
						if (retryCount === 0) {
							const globalState = globalThis as GlobalThis;
							if (globalState.setIsAutoLogging) {
								globalState.setIsAutoLogging(true);
							}
						}

						const authToken = await this.autoReloginCallback(username, password);
						if (authToken) {
							const globalState = globalThis as GlobalThis;
							if (globalState.setIsAutoLogging) {
								globalState.setIsAutoLogging(false);
							}

							return await originalRequest();
						} else {
							await this.delay(retryDelay);
							return await this.handleUnauthorized(originalRequest, retryCount + 1);
						}
					}
				}
			} catch {
				if (retryCount < maxRetries - 1) {
					await this.delay(retryDelay);
					return await this.handleUnauthorized(originalRequest, retryCount + 1);
				}
			}
		}

		const globalState = globalThis as GlobalThis;

		if (globalState.setIsAutoLogging) {
			globalState.setIsAutoLogging(false);
		}

		const error = new Error("Session expired. Please login again.") as ApiError;
		error.status = 401;
		throw error;
	}

	public async getWithAuthAndRetry<T = unknown>(endpoint: string, getToken: () => string | null, options?: RequestInit): Promise<T> {
		const makeRequest = async (): Promise<T> => {
			const token = getToken();
			if (!token) {
				const error = new Error("No authentication token available") as ApiError;
				error.status = 401;
				throw error;
			}
			return this.getWithAuth<T>(endpoint, token, options);
		};

		try {
			return await makeRequest();
		} catch (error: unknown) {
			if (error instanceof Error && "status" in error && (error as ApiError).status === 401) {
				return this.handleUnauthorized(makeRequest);
			}
			throw error;
		}
	}

	public async postWithAuthAndRetry<T = unknown>(endpoint: string, data: unknown, getToken: () => string | null, options?: RequestInit): Promise<T> {
		const makeRequest = async (): Promise<T> => {
			const token = getToken();
			if (!token) {
				const error = new Error("No authentication token available") as ApiError;
				error.status = 401;
				throw error;
			}
			return this.postWithAuth<T>(endpoint, data, token, options);
		};

		try {
			return await makeRequest();
		} catch (error: unknown) {
			if (error instanceof Error && "status" in error && (error as ApiError).status === 401) {
				return this.handleUnauthorized(makeRequest);
			}
			throw error;
		}
	}

	public destroy(): void {
		this.stopHealthCheck();
	}
}

let apiClientInstance: ResilientApiClient | null = null;

export function createResilientApiClient(config: ApiClientConfig): ResilientApiClient {
	if (apiClientInstance) {
		apiClientInstance.destroy();
	}

	apiClientInstance = new ResilientApiClient(config);
	return apiClientInstance;
}

export function getResilientApiClient(): ResilientApiClient {
	if (!apiClientInstance) {
		throw new Error("API client not initialized. Call createResilientApiClient first.");
	}
	return apiClientInstance;
}

export function getAuthHeaders(token?: string): Record<string, string> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	return headers;
}
