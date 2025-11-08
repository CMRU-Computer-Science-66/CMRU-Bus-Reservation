import type { AvailableBusData, ParsedScheduleData } from "@cmru-comsci-66/cmru-api";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { getApiClient } from "../config/api";
import { encryptCredentials } from "../lib/crypto-utils";
import { getSessionManager } from "../lib/session-manager";
import type { ApiError, GlobalThis } from "../types/global";

(globalThis as GlobalThis).sessionManager = getSessionManager();

interface ApiContextType {
	bookBus: (scheduleId: number, scheduleDate: string, destinationType: 1 | 2) => Promise<{ message: string; success: boolean }>;
	cancelReservation: (data: string) => Promise<boolean>;
	confirmReservation: (data: string) => Promise<boolean>;
	deleteReservation: (reservationId: string | number) => Promise<boolean>;
	error: string | null;
	getAvailableBuses: (month?: string) => Promise<AvailableBusData | null>;
	getSchedule: (page?: number, perPage?: number) => Promise<ParsedScheduleData | null>;
	isAuthenticated: boolean;
	isAutoLogging: boolean;
	isLoading: boolean;
	login: (username: string, password: string, rememberMe?: boolean, enableAutoLogin?: boolean) => Promise<boolean>;
	logout: () => void;
	unconfirmReservation: (data: string) => Promise<boolean>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);
const sessionManager = getSessionManager();

export function ApiProvider({ children }: { children: ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(() => {
		const session = sessionManager.loadSession();

		return !!(session?.isAuthenticated && session.token);
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isAutoLogging, setIsAutoLogging] = useState(false);

	useEffect(() => {
		(globalThis as GlobalThis).setIsAutoLogging = setIsAutoLogging;
		return () => {
			delete (globalThis as GlobalThis).setIsAutoLogging;
		};
	}, []);

	const autoRelogin = useCallback(async (username: string, password: string): Promise<string | null> => {
		try {
			const apiClient = getApiClient();

			const encryptedCredentials = encryptCredentials(username, password);
			const response = await apiClient.post<{ message?: string; success: boolean; token?: string }>("/bus/login", {
				encryptedUsername: encryptedCredentials.encryptedUsername,
				encryptedPassword: encryptedCredentials.encryptedPassword,
				encrypted: true,
			});

			if (response.success && response.token) {
				sessionManager.saveSession(username, response.token, password, true);
				setIsAuthenticated(true);
				setError(null);
				return response.token;
			}

			return null;
		} catch {
			return null;
		}
	}, []);

	useEffect(() => {
		const apiClient = getApiClient();
		apiClient.setAutoReloginCallback(autoRelogin);
	}, [autoRelogin]);

	const autoLogin = useCallback(
		async (username: string, password: string): Promise<boolean> => {
			try {
				const token = await autoRelogin(username, password);
				return !!token;
			} catch {
				return false;
			}
		},
		[autoRelogin],
	);

	useEffect(() => {
		const attemptAutoLogin = async () => {
			const session = sessionManager.loadSession();

			if (session?.isAuthenticated && session.token) {
				setIsAuthenticated(true);
				return;
			}

			if (session?.autoLogin && session.username && session.password && !isAutoLogging) {
				setIsAutoLogging(true);
				toast.loading("กำลังเข้าสู่ระบบ...", {
					id: "auto-login",
				});

				try {
					const success = await autoLogin(session.username, session.password);
					if (success) {
						setError(null);
						toast.dismiss("auto-login");
						toast.success("เข้าสู่ระบบสำเร็จ");
					} else {
						toast.dismiss("auto-login");
						toast.error("เข้าสู่ระบบไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่");
						setError("เข้าสู่ระบบไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่");
					}
				} catch {
					toast.dismiss("auto-login");
					toast.error("การเชื่อมต่อล้มเหลว กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
					setError("การเชื่อมต่อล้มเหลว กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
				} finally {
					setIsAutoLogging(false);
				}
			} else if (!session?.isAuthenticated) {
				setIsAuthenticated(false);
				sessionManager.clearSession();
			}
		};

		attemptAutoLogin();
	}, [autoLogin, isAutoLogging]);

	const login = useCallback(async (username: string, password: string, rememberMe: boolean = true, enableAutoLogin: boolean = true): Promise<boolean> => {
		setIsLoading(true);
		setError(null);

		try {
			const apiClient = getApiClient();
			const encryptedCredentials = encryptCredentials(username, password);
			const response = await apiClient.post<{ message?: string; success: boolean; token?: string }>("/bus/login", {
				encryptedUsername: encryptedCredentials.encryptedUsername,
				encryptedPassword: encryptedCredentials.encryptedPassword,
				encrypted: true,
			});

			if (response.success && response.token) {
				setIsAuthenticated(true);

				if (rememberMe) {
					sessionManager.saveSession(username, response.token, enableAutoLogin ? password : undefined, enableAutoLogin);
				} else {
					sessionManager.clearSession();
				}

				toast.success("เข้าสู่ระบบสำเร็จ");
				return true;
			}

			const errorMessage = response.message || "เข้าสู่ระบบไม่สำเร็จ";
			setError(errorMessage);
			toast.error(errorMessage);
			return false;
		} catch (error_) {
			const errorMessage = error_ instanceof Error ? error_.message : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
			setError(errorMessage);
			toast.error(errorMessage);
			return false;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const logout = useCallback(() => {
		setIsAuthenticated(false);
		setError(null);
		sessionManager.clearSession();
		toast.success("ออกจากระบบสำเร็จ");
	}, []);

	const getSchedule = useCallback(
		async (page?: number, perPage: number = 10): Promise<ParsedScheduleData | null> => {
			if (!isAuthenticated && !sessionManager.hasSession()) {
				setError("กรุณาเข้าสู่ระบบก่อน");
				return null;
			}

			setIsLoading(true);
			setError(null);

			try {
				const apiClient = getApiClient();
				const parameters = new URLSearchParams();
				if (page) parameters.append("page", page.toString());
				parameters.append("perPage", perPage.toString());

				const endpoint = `/bus/schedule?${parameters.toString()}`;
				const result = await apiClient.getWithAuthAndRetry<ParsedScheduleData>(endpoint, () => sessionManager.getToken());

				sessionManager.updateLastValidated();
				return result;
			} catch (error_: unknown) {
				const errorMessage = error_ instanceof Error ? error_.message : "ไม่สามารถดึงข้อมูลตารางเวลาได้";
				setError(errorMessage);

				if (error_ instanceof Error && "status" in error_ && (error_ as ApiError).status === 401) {
					const session = sessionManager.loadSession();

					if (session?.autoLogin === false || !session?.autoLogin) {
						sessionManager.clearSession();
						setIsAuthenticated(false);
					} else {
						setError(null);
					}
				}

				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const confirmReservation = useCallback(
		async (data: string): Promise<boolean> => {
			if (!isAuthenticated && !sessionManager.hasSession()) {
				setError("กรุณาเข้าสู่ระบบก่อน");
				return false;
			}

			setIsLoading(true);
			setError(null);

			try {
				const apiClient = getApiClient();
				const oneClickEnabled = sessionManager.getOneClickEnabled();
				const response = await apiClient.postWithAuthAndRetry<{ data?: unknown; message?: string; success: boolean }>("/bus/confirm", { data, oneClick: oneClickEnabled }, () =>
					sessionManager.getToken(),
				);

				if (response.success || response.data) {
					sessionManager.updateLastValidated();
					return true;
				}

				setError(response.message || "ไม่สามารถยืนยันการจองได้");
				return false;
			} catch (error_: unknown) {
				const errorMessage = error_ instanceof Error ? error_.message : "ไม่สามารถยืนยันการจองได้";
				setError(errorMessage);

				if (error_ instanceof Error && "status" in error_ && (error_ as ApiError).status === 401) {
					const session = sessionManager.loadSession();

					if (session?.autoLogin === false) {
						sessionManager.clearSession();
						setIsAuthenticated(false);
					} else {
						setError(null);
					}
				}

				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const unconfirmReservation = useCallback(
		async (data: string): Promise<boolean> => {
			if (!isAuthenticated && !sessionManager.hasSession()) {
				setError("กรุณาเข้าสู่ระบบก่อน");
				return false;
			}

			setIsLoading(true);
			setError(null);

			try {
				const apiClient = getApiClient();
				const oneClickEnabled = sessionManager.getOneClickEnabled();
				const response = await apiClient.postWithAuthAndRetry<{ data?: unknown; message?: string; success: boolean }>(
					"/bus/unconfirm",
					{ data, oneClick: oneClickEnabled },
					() => sessionManager.getToken(),
				);

				if (response.success || response.data) {
					sessionManager.updateLastValidated();
					return true;
				}

				setError(response.message || "ไม่สามารถยกเลิกการยืนยันได้");
				return false;
			} catch (error_: unknown) {
				const errorMessage = error_ instanceof Error ? error_.message : "ไม่สามารถยกเลิกการยืนยันได้";
				setError(errorMessage);

				if (error_ instanceof Error && "status" in error_ && (error_ as ApiError).status === 401) {
					const session = sessionManager.loadSession();

					if (session?.autoLogin === false) {
						sessionManager.clearSession();
						setIsAuthenticated(false);
					} else {
						setError(null);
					}
				}

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
			if (!isAuthenticated && !sessionManager.hasSession()) {
				setError("กรุณาเข้าสู่ระบบก่อน");
				return false;
			}

			setIsLoading(true);
			setError(null);

			try {
				const apiClient = getApiClient();
				const response = await apiClient.postWithAuthAndRetry<{ data?: unknown; message?: string; success: boolean }>("/bus/delete", { reservationId: data }, () =>
					sessionManager.getToken(),
				);

				if (response.success || response.data) {
					sessionManager.updateLastValidated();
					return true;
				}

				setError(response.message || "ไม่สามารถลบการจองได้");
				return false;
			} catch (error_: unknown) {
				const errorMessage = error_ instanceof Error ? error_.message : "ไม่สามารถลบการจองได้";
				setError(errorMessage);

				if (error_ instanceof Error && "status" in error_ && (error_ as ApiError).status === 401) {
					const session = sessionManager.loadSession();

					if (session?.autoLogin === false) {
						sessionManager.clearSession();
						setIsAuthenticated(false);
					} else {
						setError(null);
					}
				}

				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const getAvailableBuses = useCallback(
		async (month?: string): Promise<AvailableBusData | null> => {
			if (!isAuthenticated && !sessionManager.hasSession()) {
				setError("กรุณาเข้าสู่ระบบก่อน");
				return null;
			}

			setIsLoading(true);
			setError(null);

			try {
				const apiClient = getApiClient();
				const endpoint = "/bus/available" + (month ? `?month=${encodeURIComponent(month)}` : "");
				const result = await apiClient.getWithAuthAndRetry<AvailableBusData>(endpoint, () => sessionManager.getToken());

				sessionManager.updateLastValidated();
				return result;
			} catch (error_: unknown) {
				const errorMessage = error_ instanceof Error ? error_.message : "ไม่สามารถดึงข้อมูลตารางรถที่สามารถจองได้";
				setError(errorMessage);

				if (error_ instanceof Error && "status" in error_ && (error_ as ApiError).status === 401) {
					const session = sessionManager.loadSession();

					if (session?.autoLogin === false) {
						sessionManager.clearSession();
						setIsAuthenticated(false);
					} else {
						setError(null);
					}
				}

				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const bookBus = useCallback(
		async (scheduleId: number, scheduleDate: string, destinationType: 1 | 2): Promise<{ message: string; success: boolean }> => {
			if (!isAuthenticated && !sessionManager.hasSession()) {
				setError("กรุณาเข้าสู่ระบบก่อน");
				return { success: false, message: "กรุณาเข้าสู่ระบบก่อน" };
			}

			setIsLoading(true);
			setError(null);

			try {
				const apiClient = getApiClient();
				const oneClickEnabled = sessionManager.getOneClickEnabled();
				const response = await apiClient.postWithAuthAndRetry<{ message?: string; success: boolean }>(
					"/bus/book",
					{ scheduleId, scheduleDate, destinationType, oneClick: oneClickEnabled },
					() => sessionManager.getToken(),
				);

				if (response.success) {
					sessionManager.updateLastValidated();
					return { success: true, message: response.message || "จองสำเร็จ" };
				}

				const errorMessage = response.message || "ไม่สามารถจองรถได้";
				setError(errorMessage);
				return { success: false, message: errorMessage };
			} catch (error_: unknown) {
				const errorMessage = error_ instanceof Error ? error_.message : "ไม่สามารถจองรถได้";
				setError(errorMessage);

				if (error_ instanceof Error && "status" in error_ && (error_ as ApiError).status === 401) {
					const session = sessionManager.loadSession();

					if (session?.autoLogin === false) {
						sessionManager.clearSession();
						setIsAuthenticated(false);
					} else {
						setError(null);
					}
				}

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
				isAutoLogging,
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
