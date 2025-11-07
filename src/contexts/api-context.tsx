import type { AvailableBusData, ParsedScheduleData } from "@cmru-comsci-66/cmru-api";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { API_CONFIG, getApiUrl } from "../config/api";
import { getSessionManager } from "../lib/session-manager";

interface ApiContextType {
	bookBus: (scheduleId: number, scheduleDate: string, destinationType: 1 | 2) => Promise<{ message: string; success: boolean }>;
	cancelReservation: (data: string) => Promise<boolean>;
	confirmReservation: (data: string) => Promise<boolean>;
	deleteReservation: (reservationId: string | number) => Promise<boolean>;
	error: string | null;
	getAvailableBuses: (month?: string) => Promise<AvailableBusData | null>;
	getSchedule: (page?: number, perPage?: number) => Promise<ParsedScheduleData | null>;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>;
	logout: () => void;
	unconfirmReservation: (data: string) => Promise<boolean>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);
const sessionManager = getSessionManager();

export function ApiProvider({ children }: { children: ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const autoLogin = async () => {
			const session = sessionManager.loadSession();
			if (session && session.isAuthenticated) {
				setIsLoading(true);
				try {
					const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.BUS.LOGIN), {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ username: session.username, password: session.password }),
					});

					const data = await response.json();

					if (response.ok && (data.success || data.valid === true)) {
						setIsAuthenticated(true);
						sessionManager.updateLastValidated();
					} else {
						sessionManager.clearSession();
					}
				} catch (error_) {
					console.error("Auto-login failed:", error_);
					sessionManager.clearSession();
				}
			}
			setIsLoading(false);
		};

		autoLogin();
	}, []);

	const login = useCallback(async (username: string, password: string, rememberMe: boolean = true): Promise<boolean> => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.BUS.LOGIN), {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password }),
			});

			const data = await response.json();

			if (response.ok && data.success) {
				setIsAuthenticated(true);

				if (rememberMe) {
					sessionManager.saveSession(username, password);
				} else {
					sessionManager.clearSession();
				}

				return true;
			}

			setError(data.message || "เข้าสู่ระบบไม่สำเร็จ");
			return false;
		} catch (error_) {
			const errorMessage = error_ instanceof Error ? error_.message : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
			setError(errorMessage);
			return false;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const logout = useCallback(() => {
		setIsAuthenticated(false);
		setError(null);
		sessionManager.clearSession();
	}, []);

	const getSchedule = useCallback(
		async (page?: number, perPage: number = 10): Promise<ParsedScheduleData | null> => {
			if (!isAuthenticated) {
				setError("กรุณาเข้าสู่ระบบก่อน");
				return null;
			}
			setIsLoading(true);
			setError(null);

			try {
				const params = new URLSearchParams();
				if (page) params.append("page", page.toString());
				params.append("perPage", perPage.toString());

				const url = `${API_CONFIG.ENDPOINTS.BUS.SCHEDULE}?${params.toString()}`;
				const response = await fetch(getApiUrl(url), {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});

				const result = await response.json();

				if (response.ok) {
					sessionManager.updateLastValidated();
					return result as ParsedScheduleData;
				}

				setError(result.message || "ไม่สามารถดึงข้อมูลตารางเวลาได้");

				if (result.message?.includes("login") || result.message?.includes("Session")) {
					sessionManager.markSessionInvalid();
					setIsAuthenticated(false);
				}

				return null;
			} catch (error_) {
				const errorMessage = error_ instanceof Error ? error_.message : "ไม่สามารถดึงข้อมูลตารางเวลาได้";
				setError(errorMessage);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const confirmReservation = useCallback(
		async (data: string): Promise<boolean> => {
			if (!isAuthenticated) {
				setError("กรุณาเข้าสู่ระบบก่อน");
				return false;
			}
			setIsLoading(true);
			setError(null);

			try {
				const oneClickEnabled = sessionManager.getOneClickEnabled();
				const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.BUS.CONFIRM), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ data, oneClick: oneClickEnabled }),
				});

				const result = await response.json();

				if (response.ok && (result.success === true || result.data)) {
					sessionManager.updateLastValidated();
					return true;
				}

				setError(result.message || "ไม่สามารถยืนยันการจองได้");

				if (result.message?.includes("login") || result.message?.includes("Session")) {
					sessionManager.markSessionInvalid();
					setIsAuthenticated(false);
				}

				return false;
			} catch (error_) {
				const errorMessage = error_ instanceof Error ? error_.message : "ไม่สามารถยืนยันการจองได้";
				setError(errorMessage);
				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const unconfirmReservation = useCallback(
		async (data: string): Promise<boolean> => {
			if (!isAuthenticated) {
				setError("กรุณาเข้าสู่ระบบก่อน");
				return false;
			}
			setIsLoading(true);
			setError(null);

			try {
				const oneClickEnabled = sessionManager.getOneClickEnabled();
				const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.BUS.UNCONFIRM), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ data, oneClick: oneClickEnabled }),
				});

				const result = await response.json();

				if (response.ok && (result.success === true || result.data)) {
					sessionManager.updateLastValidated();
					return true;
				}

				setError(result.message || "ไม่สามารถยกเลิกการยืนยันได้");

				if (result.message?.includes("login") || result.message?.includes("Session")) {
					sessionManager.markSessionInvalid();
					setIsAuthenticated(false);
				}

				return false;
			} catch (error_) {
				const errorMessage = error_ instanceof Error ? error_.message : "ไม่สามารถยกเลิกการยืนยันได้";
				setError(errorMessage);
				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const cancelReservation = useCallback(
		async (data: string): Promise<boolean> => {
			return unconfirmReservation(data);
		},
		[unconfirmReservation],
	);

	const deleteReservation = useCallback(
		async (data: string | number): Promise<boolean> => {
			if (!isAuthenticated) {
				setError("กรุณาเข้าสู่ระบบก่อน");
				return false;
			}
			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.BUS.DELETE), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ reservationId: data }),
				});

				const result = await response.json();

				if (response.ok && (result.success === true || result.data)) {
					sessionManager.updateLastValidated();
					return true;
				}

				setError(result.message || "ไม่สามารถลบการจองได้");

				if (result.message?.includes("login") || result.message?.includes("Session")) {
					sessionManager.markSessionInvalid();
					setIsAuthenticated(false);
				}

				return false;
			} catch (error_) {
				const errorMessage = error_ instanceof Error ? error_.message : "ไม่สามารถลบการจองได้";
				setError(errorMessage);
				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const getAvailableBuses = useCallback(
		async (month?: string): Promise<AvailableBusData | null> => {
			if (!isAuthenticated) {
				setError("กรุณาเข้าสู่ระบบก่อน");
				return null;
			}
			setIsLoading(true);
			setError(null);

			try {
				const url = API_CONFIG.ENDPOINTS.BUS.AVAILABLE + (month ? `?month=${encodeURIComponent(month)}` : "");
				const response = await fetch(getApiUrl(url), {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});

				const result = await response.json();

				if (response.ok) {
					sessionManager.updateLastValidated();
					return result as AvailableBusData;
				}

				setError(result.message || "ไม่สามารถดึงข้อมูลตารางรถที่สามารถจองได้");

				if (result.message?.includes("login") || result.message?.includes("Session")) {
					sessionManager.markSessionInvalid();
					setIsAuthenticated(false);
				}

				return null;
			} catch (error_) {
				const errorMessage = error_ instanceof Error ? error_.message : "ไม่สามารถดึงข้อมูลตารางรถที่สามารถจองได้";
				setError(errorMessage);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const bookBus = useCallback(
		async (scheduleId: number, scheduleDate: string, destinationType: 1 | 2): Promise<{ message: string; success: boolean }> => {
			if (!isAuthenticated) {
				setError("กรุณาเข้าสู่ระบบก่อน");
				return { success: false, message: "กรุณาเข้าสู่ระบบก่อน" };
			}
			setIsLoading(true);
			setError(null);

			try {
				const oneClickEnabled = sessionManager.getOneClickEnabled();
				const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.BUS.BOOK), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ scheduleId, scheduleDate, destinationType, oneClick: oneClickEnabled }),
				});

				const result = await response.json();

				if (response.ok && result.success) {
					sessionManager.updateLastValidated();
					return { success: true, message: result.message || "จองสำเร็จ" };
				}

				const errorMessage = result.message || "ไม่สามารถจองรถได้";
				setError(errorMessage);

				if (result.message?.includes("login") || result.message?.includes("Session")) {
					sessionManager.markSessionInvalid();
					setIsAuthenticated(false);
				}

				return { success: false, message: errorMessage };
			} catch (error_) {
				const errorMessage = error_ instanceof Error ? error_.message : "ไม่สามารถจองรถได้";
				setError(errorMessage);
				return { success: false, message: errorMessage };
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	return (
		<ApiContext.Provider
			value={{
				isAuthenticated,
				isLoading,
				error,
				login,
				logout,
				getSchedule,
				confirmReservation,
				unconfirmReservation,
				deleteReservation,
				cancelReservation,
				getAvailableBuses,
				bookBus,
			}}>
			{children}
		</ApiContext.Provider>
	);
}

export function useApi() {
	const context = useContext(ApiContext);
	if (context === undefined) {
		throw new Error("useApi must be used within an ApiProvider");
	}
	return context;
}
