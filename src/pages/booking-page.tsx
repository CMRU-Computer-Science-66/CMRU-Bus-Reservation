/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AvailableBusData, AvailableBusSchedule, ScheduleReservation } from "@cmru-comsci-66/cmru-api";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Bus, Calendar, CheckCircle2, Clock, Loader2, LogOut, MapPin, Menu, RefreshCw, Settings, TrendingUp, User, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import { ROUTE_METADATA, ROUTES } from "../config/routes";
import { useApi } from "../contexts/api-context";
import { useAutoScroll, useCrossPageScroll } from "../hooks/use-auto-scroll";
import { queryKeys, useAvailableBusesQuery, useBookBusMutation, useScheduleQuery } from "../hooks/use-queries";
import { getSessionManager } from "../lib/session-manager";
import { formatTime } from "../lib/time-formatter";
import { PageHeader } from "./components/page-header";
import { StatCard } from "./components/stat-card";

interface GroupedSchedule {
	canReserveCount: number;
	date: Date;
	dateString: string;
	schedules: AvailableBusSchedule[];
}

const formatDate = (date: Date) => {
	const d = new Date(date);
	const thaiDays = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
	const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

	const dayName = thaiDays[d.getDay()];
	const day = d.getDate();
	const month = thaiMonths[d.getMonth()];
	const year = (d.getFullYear() + 543) % 100;

	return `วัน${dayName}ที่ ${day} ${month} ${year}`;
};

const getRelativeDay = (date: Date) => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const targetDate = new Date(date);
	targetDate.setHours(0, 0, 0, 0);

	const diffTime = targetDate.getTime() - today.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return "วันนี้";
	if (diffDays === 1) return "พรุ่งนี้";
	if (diffDays === 2) return "มะรืนนี้";
	if (diffDays > 2 && diffDays <= 7) return `อีก ${diffDays} วัน`;
	return null;
};

export function BookingPage() {
	const navigate = useNavigate();
	const { cancelReservation, deleteReservation, isAuthenticated, logout } = useApi();
	const queryClient = useQueryClient();
	const { data: availableBuses, isLoading: isLoadingAvailableBuses, refetch: refetchAvailableBuses } = useAvailableBusesQuery(isAuthenticated);
	const { data: scheduleData, isLoading: isLoadingSchedule, refetch: refetchSchedule } = useScheduleQuery(1, isAuthenticated);
	const bookMutation = useBookBusMutation();

	const [bookedScheduleIds, setBookedScheduleIds] = useState<Set<string>>(new Set());
	const [bookedReservations, setBookedReservations] = useState<Map<string, ScheduleReservation>>(new Map());
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | undefined>();
	const [bookingLoading, setBookingLoading] = useState<number | undefined>();
	const [bookingStatus, setBookingStatus] = useState<string>("");
	const [selectedSchedules, setSelectedSchedules] = useState<Record<string, { toMaeRim: number | string | undefined; toWiangBua: number | string | undefined }>>({});
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [mobileMenuClosing, setMobileMenuClosing] = useState(false);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [filterMode, setFilterMode] = useState<"all" | "available" | "canReserve">("all");
	const [showStatistics, setShowStatistics] = useState(() => {
		return getSessionManager().getShowStatistics();
	});
	const [isRefreshing, setIsRefreshing] = useState(false);

	const closeMobileMenu = () => {
		setMobileMenuClosing(true);
		setTimeout(() => {
			setMobileMenuOpen(false);
			setMobileMenuClosing(false);
		}, 200);
	};

	const { isHighlighted: isCardHighlighted, scrollToElement: scrollToCard } = useAutoScroll<string>({
		checkViewport: true,
		highlightDuration: 2000,
		mobileOnly: true,
	});

	const handleScrollToCard = useCallback(
		(dateString: string, event?: React.MouseEvent | React.KeyboardEvent) => {
			scrollToCard(dateString, `#card-${dateString}`, event);
		},
		[scrollToCard],
	);

	const { navigateWithScroll } = useCrossPageScroll();

	const navigateToScheduleWithScroll = useCallback(
		(reservationId?: number) => {
			navigateWithScroll(ROUTES.SCHEDULE, reservationId, navigate);
		},
		[navigate, navigateWithScroll],
	);

	useEffect(() => {
		const theme = localStorage.getItem("theme");
		const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		const shouldBeDark = theme === "dark" || (theme === "system" && prefersDark);
		document.documentElement.classList.toggle("dark", shouldBeDark);
	}, []);

	useEffect(() => {
		setShowStatistics(getSessionManager().getShowStatistics());
	}, []);

	useEffect(() => {
		const handleFocus = () => {
			setShowStatistics(getSessionManager().getShowStatistics());
		};

		window.addEventListener("focus", handleFocus);
		return () => window.removeEventListener("focus", handleFocus);
	}, []);

	const handleForceRefresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			await Promise.all([
				queryClient.refetchQueries({ queryKey: queryKeys.availableBuses() }),
				queryClient.refetchQueries({ queryKey: queryKeys.schedule() }),
				new Promise((resolve) => setTimeout(resolve, 500)),
			]);
		} finally {
			setIsRefreshing(false);
		}
	}, [queryClient]);

	const fetchBookedSchedules = useCallback(async () => {
		if (scheduleData?.reservations) {
			const bookedKeys = new Set<string>();
			const reservationMap = new Map<string, ScheduleReservation>();

			for (const r of scheduleData.reservations) {
				const date = new Date(r.date).toISOString().split("T")[0];
				const time = r.departureTime.replace(".", ":");
				const destinationType = r.destination.name.toLowerCase().includes("เวียงบัว") ? "2" : "1";
				const bookingKey = `${date}_${time}_${destinationType}`;

				bookedKeys.add(bookingKey);
				reservationMap.set(bookingKey, r);
			}

			setBookedScheduleIds(bookedKeys);
			setBookedReservations(reservationMap);
		}
	}, [scheduleData]);

	useEffect(() => {
		if (isAuthenticated) {
			fetchBookedSchedules();
		}
	}, [isAuthenticated, fetchBookedSchedules]);

	const groupedSchedules: GroupedSchedule[] = availableBuses?.availableSchedules
		? Object.values(
				availableBuses.availableSchedules
					.map((schedule) => {
						const dateKey = new Date(schedule.date).toISOString().split("T")[0] || "";
						return { dateKey, schedule };
					})
					.reduce(
						(accumulator, { dateKey, schedule }) => {
							if (!accumulator[dateKey]) {
								accumulator[dateKey] = {
									date: new Date(schedule.date),
									dateString: dateKey,
									schedules: [],
									canReserveCount: 0,
								};
							}
							accumulator[dateKey].schedules.push(schedule);
							if (schedule.canReserve) {
								accumulator[dateKey].canReserveCount++;
							}
							return accumulator;
						},
						{} as Record<string, GroupedSchedule>,
					),
			)
				.filter((group) => {
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const groupDate = new Date(group.date);
					groupDate.setHours(0, 0, 0, 0);

					if (groupDate.getTime() < today.getTime()) return false;
					if (filterMode === "available") {
						return group.canReserveCount > 0;
					}
					if (filterMode === "canReserve") {
						return group.schedules.some((s) => s.canReserve);
					}
					return true;
				})
				.sort((a, b) => a.date.getTime() - b.date.getTime())
		: [];

	const handleMultipleBook = async () => {
		const allDateStrings = Object.keys(selectedSchedules).filter((dateString) => {
			const selections = selectedSchedules[dateString];
			return selections && (selections.toMaeRim || selections.toWiangBua);
		});

		if (allDateStrings.length === 0) return;

		setBookingLoading(-1);
		setBookingStatus("กำลังเตรียมการจองหลายวัน...");

		try {
			let processedCount = 0;
			for (const dateString of allDateStrings) {
				processedCount++;
				setBookingStatus(`กำลังประมวลผล ${processedCount}/${allDateStrings.length} วัน...`);
				await handleSingleBook(dateString);
			}

			setSelectedSchedules({});

			await refetchAvailableBuses();
			await refetchSchedule();
		} finally {
			setBookingLoading(undefined);
			setBookingStatus("");
		}
	};

	const handleSingleBook = async (dateString: string) => {
		const selections = selectedSchedules[dateString];
		if (!selections) return;

		const scheduleIds = [selections.toMaeRim, selections.toWiangBua].filter((id): id is number => typeof id === "number" && id !== undefined);
		const hasCancellation = selections.toMaeRim === "__CANCEL__" || selections.toWiangBua === "__CANCEL__";

		if (scheduleIds.length === 0 && !hasCancellation) return;

		try {
			const groupSchedules =
				availableBuses?.availableSchedules.filter((s) => {
					const scheduleDate = new Date(s.date).toISOString().split("T")[0];
					return scheduleDate === dateString;
				}) || [];

			const existingBookingsToCancel: typeof groupSchedules = [];

			if (selections.toMaeRim && selections.toMaeRim === "__CANCEL__") {
				const existingMaeRimBooking = groupSchedules.find((schedule) => {
					if (schedule.destinationType !== 1) return false;
					const date = new Date(schedule.date).toISOString().split("T")[0];
					const time = schedule.departureTime;
					const bookingKey = `${date}_${time}_1`;
					return bookedScheduleIds.has(bookingKey);
				});
				if (existingMaeRimBooking) {
					existingBookingsToCancel.push(existingMaeRimBooking);
				}
			} else if (typeof selections.toMaeRim === "number") {
				const existingMaeRimBooking = groupSchedules.find((schedule) => {
					if (schedule.destinationType !== 1) return false;
					const date = new Date(schedule.date).toISOString().split("T")[0];
					const time = schedule.departureTime;
					const bookingKey = `${date}_${time}_1`;
					return bookedScheduleIds.has(bookingKey);
				});
				if (existingMaeRimBooking) {
					existingBookingsToCancel.push(existingMaeRimBooking);
				}
			}

			if (selections.toWiangBua && selections.toWiangBua === "__CANCEL__") {
				const existingWiangBuaBooking = groupSchedules.find((schedule) => {
					if (schedule.destinationType !== 2) return false;
					const date = new Date(schedule.date).toISOString().split("T")[0];
					const time = schedule.departureTime;
					const bookingKey = `${date}_${time}_2`;
					return bookedScheduleIds.has(bookingKey);
				});
				if (existingWiangBuaBooking) {
					existingBookingsToCancel.push(existingWiangBuaBooking);
				}
			} else if (typeof selections.toWiangBua === "number") {
				const existingWiangBuaBooking = groupSchedules.find((schedule) => {
					if (schedule.destinationType !== 2) return false;
					const date = new Date(schedule.date).toISOString().split("T")[0];
					const time = schedule.departureTime;
					const bookingKey = `${date}_${time}_2`;
					return bookedScheduleIds.has(bookingKey);
				});
				if (existingWiangBuaBooking) {
					existingBookingsToCancel.push(existingWiangBuaBooking);
				}
			}

			if (existingBookingsToCancel.length > 0) {
				for (const existingBooking of existingBookingsToCancel) {
					try {
						const date = new Date(existingBooking.date).toISOString().split("T")[0];
						const time = existingBooking.departureTime;
						const destinationType = existingBooking.destinationType.toString();
						const bookingKey = `${date}_${time}_${destinationType}`;
						const reservationData = bookedReservations.get(bookingKey);

						if (reservationData) {
							let success = false;

							if (reservationData.confirmation?.unconfirmData) {
								success = await cancelReservation(reservationData.confirmation.unconfirmData);
							} else if (reservationData.confirmation?.canConfirm && reservationData.actions?.reservationId) {
								success = await deleteReservation(reservationData.actions.reservationId);
							}
						}
					} catch {
						/* empty */
					}
				}
			}

			if (scheduleIds.length > 0) {
				for (const scheduleId of scheduleIds) {
					const schedule = availableBuses?.availableSchedules.find((s) => s.id === scheduleId);
					if (!schedule || !schedule.canReserve) continue;

					const bookingDateString = typeof schedule.date === "string" ? schedule.date : new Date(schedule.date).toISOString();
					await bookMutation.mutateAsync({
						scheduleId: schedule.id,
						date: bookingDateString,
						destinationType: schedule.destinationType,
					});
				}
			}
		} catch {
			throw error;
		}
	};

	const handleBook = async (dateString: string) => {
		const selections = selectedSchedules[dateString];
		if (!selections) return;

		const scheduleIds = [selections.toMaeRim, selections.toWiangBua].filter((id): id is number => typeof id === "number" && id !== undefined);
		const hasCancellation = selections.toMaeRim === "__CANCEL__" || selections.toWiangBua === "__CANCEL__";

		if (scheduleIds.length === 0 && !hasCancellation) return;

		if (
			Object.keys(selectedSchedules).filter((ds) => {
				const sel = selectedSchedules[ds];
				return sel && (sel.toMaeRim || sel.toWiangBua);
			}).length <= 1
		) {
			setBookingLoading(-1);
			setBookingStatus("กำลังเตรียมการจอง...");
		}

		try {
			await handleSingleBook(dateString);

			setBookingStatus("กำลังอัพเดทข้อมูล...");
			setSelectedSchedules((previous) => {
				const updatedState = { ...previous };
				delete updatedState[dateString];
				return updatedState;
			});
			await refetchSchedule();
		} catch {
			setBookingStatus("เกิดข้อผิดพลาด");
		} finally {
			setBookingLoading(undefined);
			setBookingStatus("");
		}
	};

	if (isLoading && !availableBuses) {
		return (
			<div className="relative min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
				<Helmet>
					<title>{ROUTE_METADATA["/booking"].title}</title>
					<meta name="description" content={ROUTE_METADATA["/booking"].description} />
				</Helmet>
				<PageHeader
					title="จองรถบัส"
					subtitle="กำลังโหลดข้อมูล..."
					actions={
						<>
							<Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.SCHEDULE)} className="h-10 w-10 shrink-0 rounded-full hover:scale-110">
								<ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
							</Button>
							<Button variant="outline" size="icon" disabled className="hidden h-10 w-10 rounded-full md:flex">
								<RefreshCw className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={logout}
								className="hidden gap-2 shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-lg md:flex dark:hover:bg-red-950">
								<LogOut className="h-4 w-4" />
								ออกจากระบบ
							</Button>
							<Button variant="outline" size="icon" disabled className="h-10 w-10 rounded-full transition-all active:scale-95 md:hidden">
								<RefreshCw className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								className="h-10 w-10 transition-all hover:scale-110 active:scale-95 md:hidden">
								{mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
							</Button>
						</>
					}
				/>

				{mobileMenuOpen && (
					<div
						className={`sticky top-[73px] z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md transition-all duration-200 md:hidden dark:border-gray-800 dark:bg-gray-900/80 ${
							mobileMenuClosing ? "animate-out slide-out-to-top-4 fade-out-0" : "animate-in slide-in-from-top-4 fade-in-0"
						}`}>
						<div className="container mx-auto px-4 py-4">
							<div className="space-y-2">
								<Button variant="outline" size="sm" disabled className="w-full justify-start gap-2">
									<RefreshCw className="h-4 w-4 animate-spin" />
									กำลังโหลด...
								</Button>
								<Button variant="outline" size="sm" onClick={logout} className="w-full justify-start gap-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
									<LogOut className="h-4 w-4" />
									ออกจากระบบ
								</Button>
							</div>
						</div>
					</div>
				)}

				{showStatistics ? (
					<div className="container mx-auto px-4 py-6 sm:px-6">
						<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
							<StatCard
								label="วันที่มีรถ"
								value={0}
								icon={CheckCircle2}
								gradient="from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"
								iconBg="bg-blue-100 dark:bg-blue-900"
								isLoading={true}
							/>
							<StatCard
								label="มีรอบว่าง"
								value={0}
								icon={TrendingUp}
								gradient="from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400"
								iconBg="bg-green-100 dark:bg-green-900"
								isLoading={true}
							/>
							<StatCard
								label="รอบทั้งหมด"
								value={0}
								icon={Bus}
								gradient="from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400"
								iconBg="bg-purple-100 dark:bg-purple-900"
								isLoading={true}
							/>
							<StatCard
								label="จองได้"
								value={0}
								icon={User}
								gradient="from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400"
								iconBg="bg-orange-100 dark:bg-orange-900"
								isLoading={true}
							/>
						</div>
					</div>
				) : (
					<div className="py-2"></div>
				)}

				<div className="container mx-auto px-4 pb-8 sm:px-6">
					<div className="mb-4 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white">รอบรถที่เปิดจอง</h2>
							<div className="inline-flex h-6 min-w-0"></div>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{[1, 2, 3, 4, 5, 6].map((index) => (
							<Card key={index} className="group border-0 bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-xl dark:bg-gray-900/90">
								<CardContent className="space-y-4 p-4">
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<Skeleton className="h-4 w-4 shrink-0" />
												<Skeleton className="h-5 w-32" />
											</div>
											<Skeleton className="mt-1.5 h-3 w-20" />
										</div>
										<Skeleton className="h-6 w-20 rounded-full" />
									</div>
									<div className="h-px bg-gray-200 dark:bg-gray-800"></div>
									<div className="flex items-center gap-2">
										<div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900">
											<Skeleton className="h-4 w-4" />
										</div>
										<div className="flex-1">
											<Skeleton className="mb-1 h-3 w-8" />
											<Skeleton className="h-4 w-16" />
										</div>
									</div>
									<div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
										<Skeleton className="h-11 flex-1 rounded-md" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
				<Card className="w-full max-w-md border-0 bg-white/90 shadow-2xl backdrop-blur-md dark:bg-gray-900/90">
					<CardContent className="p-6">
						<Alert variant="destructive" className="border-red-200 dark:border-red-900">
							<AlertCircle className="h-5 w-5" />
							<AlertTitle className="mb-2 text-lg font-semibold">เกิดข้อผิดพลาด</AlertTitle>
							<AlertDescription className="mb-4 text-sm">{error}</AlertDescription>
						</Alert>
						<Button
							onClick={async () => {
								await refetchAvailableBuses();
								await refetchSchedule();
							}}
							className="mt-4 w-full"
							size="lg"
							disabled={isLoadingAvailableBuses || isLoadingSchedule}>
							<RefreshCw className={`mr-2 h-5 w-5 ${isLoadingAvailableBuses || isLoadingSchedule ? "animate-spin" : ""}`} />
							{isLoadingAvailableBuses || isLoadingSchedule ? "กำลังโหลด..." : "ลองอีกครั้ง"}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="relative min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
			<Helmet>
				<title>{ROUTE_METADATA["/booking"].title}</title>
				<meta name="description" content={ROUTE_METADATA["/booking"].description} />
			</Helmet>
			<PageHeader
				title="จองรถบัส"
				subtitle={
					groupedSchedules.length > 0 ? (
						<>
							{groupedSchedules.length} วัน • {availableBuses?.totalAvailable || 0} รอบ
						</>
					) : (
						"ไม่มีรอบรถที่เปิดจอง"
					)
				}
				actions={
					<>
						<Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.SCHEDULE)} className="h-10 w-10 shrink-0 rounded-full hover:scale-110">
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleForceRefresh}
							disabled={isRefreshing || isLoading || isLoadingAvailableBuses || isLoadingSchedule}
							className="hidden gap-2 shadow-sm hover:shadow-lg md:flex">
							<RefreshCw className={`h-4 w-4 transition-transform ${isRefreshing || isLoadingAvailableBuses || isLoadingSchedule ? "animate-spin" : "hover:rotate-180"}`} />
							{isRefreshing || isLoading || isLoadingAvailableBuses || isLoadingSchedule ? "กำลังรีเฟรช..." : "รีเฟรช"}
						</Button>
						<Button variant="outline" size="sm" onClick={() => navigate(ROUTES.SCHEDULE)} className="hidden gap-2 shadow-sm hover:shadow-lg md:flex">
							<Calendar className="h-4 w-4" />
							รายการจอง
						</Button>
						<Button variant="outline" size="sm" onClick={() => navigate(ROUTES.STATISTICS)} className="hidden gap-2 shadow-sm hover:shadow-lg md:flex">
							<TrendingUp className="h-4 w-4" />
							สถิติ
						</Button>
						<Button variant="outline" size="sm" onClick={() => navigate(ROUTES.SETTINGS)} className="hidden gap-2 shadow-sm hover:shadow-lg md:flex">
							<Settings className="h-4 w-4" />
							ตั้งค่า
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={logout}
							className="hidden gap-2 shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-lg md:flex dark:hover:bg-red-950">
							<LogOut className="h-4 w-4" />
							ออกจากระบบ
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={handleForceRefresh}
							disabled={isRefreshing || isLoading || isLoadingAvailableBuses || isLoadingSchedule}
							className="h-10 w-10 rounded-full transition-all hover:scale-110 active:scale-95 md:hidden">
							<RefreshCw className={`h-4 w-4 transition-transform sm:h-5 sm:w-5 ${isRefreshing || isLoadingAvailableBuses || isLoadingSchedule ? "animate-spin" : ""}`} />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="h-10 w-10 transition-all hover:scale-110 active:scale-95 md:hidden">
							{mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
						</Button>
					</>
				}
			/>

			{mobileMenuOpen && (
				<div
					className={`sticky top-[73px] z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md transition-all duration-200 md:hidden dark:border-gray-800 dark:bg-gray-900/80 ${
						mobileMenuClosing ? "animate-out slide-out-to-top-4 fade-out-0" : "animate-in slide-in-from-top-4 fade-in-0"
					}`}>
					<div className="container mx-auto px-4 py-4">
						<div className="space-y-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									navigate(ROUTES.SCHEDULE);
									closeMobileMenu();
								}}
								className="w-full justify-start gap-2">
								<Calendar className="h-4 w-4" />
								รายการจอง
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									navigate(ROUTES.STATISTICS);
									closeMobileMenu();
								}}
								className="w-full justify-start gap-2">
								<TrendingUp className="h-4 w-4" />
								สถิติ
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									navigate(ROUTES.SETTINGS);
									closeMobileMenu();
								}}
								className="w-full justify-start gap-2">
								<Settings className="h-4 w-4" />
								ตั้งค่า
							</Button>
							<Button variant="outline" size="sm" onClick={logout} className="w-full justify-start gap-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
								<LogOut className="h-4 w-4" />
								ออกจากระบบ
							</Button>
						</div>
					</div>
				</div>
			)}

			{showStatistics ? (
				<div className="container mx-auto px-4 py-6 sm:px-6">
					<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
						<StatCard
							label="วันที่มีรถ"
							value={
								availableBuses?.availableSchedules
									? Object.keys(
											availableBuses.availableSchedules.reduce(
												(accumulator, schedule) => {
													const dateKey = new Date(schedule.date).toISOString().split("T")[0] || "";
													const groupDate = new Date(schedule.date);
													groupDate.setHours(0, 0, 0, 0);
													const today = new Date();
													today.setHours(0, 0, 0, 0);
													if (groupDate.getTime() >= today.getTime()) {
														accumulator[dateKey] = true;
													}
													return accumulator;
												},
												{} as Record<string, boolean>,
											),
										).length
									: 0
							}
							icon={CheckCircle2}
							gradient="from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"
							iconBg="bg-blue-100 dark:bg-blue-900"
							onClick={() => setFilterMode(filterMode === "all" ? "all" : "all")}
							isActive={filterMode === "all"}
							isLoading={isLoading}
						/>
						<StatCard
							label="มีรอบว่าง"
							value={
								availableBuses?.availableSchedules
									? Object.values(
											availableBuses.availableSchedules.reduce(
												(accumulator, schedule) => {
													const dateKey = new Date(schedule.date).toISOString().split("T")[0] || "";
													const groupDate = new Date(schedule.date);
													groupDate.setHours(0, 0, 0, 0);
													const today = new Date();
													today.setHours(0, 0, 0, 0);
													if (groupDate.getTime() >= today.getTime()) {
														if (!accumulator[dateKey]) {
															accumulator[dateKey] = { canReserveCount: 0 };
														}
														if (schedule.canReserve) {
															accumulator[dateKey].canReserveCount++;
														}
													}
													return accumulator;
												},
												{} as Record<string, { canReserveCount: number }>,
											),
										).filter((g) => g.canReserveCount > 0).length
									: 0
							}
							icon={TrendingUp}
							gradient="from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400"
							iconBg="bg-green-100 dark:bg-green-900"
							onClick={() => setFilterMode(filterMode === "available" ? "all" : "available")}
							isActive={filterMode === "available"}
							isLoading={isLoading}
						/>
						<StatCard
							label="รอบทั้งหมด"
							value={availableBuses?.totalAvailable || 0}
							icon={Bus}
							gradient="from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400"
							iconBg="bg-purple-100 dark:bg-purple-900"
							onClick={() => setFilterMode("all")}
							isActive={filterMode === "all"}
							isLoading={isLoading}
						/>
						<StatCard
							label="จองได้"
							value={availableBuses?.availableSchedules?.filter((s) => s.canReserve).length || 0}
							icon={User}
							gradient="from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400"
							iconBg="bg-orange-100 dark:bg-orange-900"
							onClick={() => setFilterMode(filterMode === "canReserve" ? "all" : "canReserve")}
							isActive={filterMode === "canReserve"}
							isLoading={isLoading}
						/>
					</div>
				</div>
			) : (
				<div className="py-2"></div>
			)}

			<div
				className={`container mx-auto px-4 sm:px-6 ${(() => {
					const multipleSelections =
						Object.keys(selectedSchedules).filter((dateString) => {
							const sel = selectedSchedules[dateString];
							return sel && (sel.toMaeRim || sel.toWiangBua);
						}).length > 1;
					return multipleSelections ? "pb-40 sm:pb-32" : "pb-8";
				})()}`}>
				<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-2">
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white">รอบรถที่เปิดจอง</h2>
						{filterMode !== "all" && (
							<Badge variant="secondary" className="gap-1">
								{filterMode === "available" && "มีรอบว่าง"}
								{filterMode === "canReserve" && "จองได้"}
								<X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => setFilterMode("all")} />
							</Badge>
						)}
					</div>
					<div className="text-xs text-gray-500 md:hidden dark:text-gray-400">💡 แตะที่บัตรเพื่อ auto scroll</div>
					{/* <div className="flex gap-2">
						<Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")} className="gap-2">
							<Grid3x3 className="h-4 w-4" />
							<span className="hidden sm:inline">กริด</span>
						</Button>
						<Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className="gap-2">
							<List className="h-4 w-4" />
							<span className="hidden sm:inline">ลิสต์</span>
						</Button>
					</div> */}
				</div>

				<div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
					{isLoadingAvailableBuses || isLoadingSchedule ? (
						[1, 2, 3, 4, 5, 6].map((index) => (
							<Card key={index} className="group border-0 bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-xl dark:bg-gray-900/90">
								<CardContent className="space-y-4 p-4">
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<Skeleton className="h-4 w-4 shrink-0" />
												<Skeleton className="h-5 w-32" />
											</div>
											<Skeleton className="mt-1.5 h-3 w-20" />
										</div>
										<Skeleton className="h-6 w-20 rounded-full" />
									</div>
									<div className="h-px bg-gray-200 dark:bg-gray-800"></div>
									<div className="flex items-center gap-2">
										<div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900">
											<Skeleton className="h-4 w-4" />
										</div>
										<div className="flex-1">
											<Skeleton className="mb-1 h-3 w-8" />
											<Skeleton className="h-4 w-16" />
										</div>
									</div>
									<div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
										<Skeleton className="h-11 flex-1 rounded-md" />
									</div>
								</CardContent>
							</Card>
						))
					) : groupedSchedules && groupedSchedules.length > 0 ? (
						<>
							{filterMode !== "all" && (
								<div className="col-span-full mb-2">
									<p className="text-sm text-gray-600 dark:text-gray-400">
										พบ <span className="font-semibold text-blue-600 dark:text-blue-400">{groupedSchedules.length}</span> วันที่ตรงกับเงื่อนไข
									</p>
								</div>
							)}
							{groupedSchedules.map((group) => {
								const bookedCount = group.schedules.filter((schedule) => {
									const date = new Date(schedule.date).toISOString().split("T")[0];
									const time = schedule.departureTime;
									const destinationType = schedule.destinationType.toString();
									const bookingKey = `${date}_${time}_${destinationType}`;
									return bookedScheduleIds.has(bookingKey);
								}).length;

								return (
									<Card
										key={group.dateString}
										id={`card-${group.dateString}`}
										role="button"
										tabIndex={0}
										onClick={(event) => handleScrollToCard(group.dateString, event)}
										onKeyDown={(event) => {
											if (event.key === "Enter" || event.key === " ") {
												handleScrollToCard(group.dateString, event);
											}
										}}
										className={`group cursor-pointer bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-xl md:cursor-default dark:bg-gray-900/90 ${(() => {
											if (isCardHighlighted(group.dateString)) {
												return "border-2 border-blue-400 bg-blue-50/95 dark:border-blue-500 dark:bg-blue-950/95";
											}

											const current = selectedSchedules[group.dateString];
											const hasCancellation = current?.toMaeRim === "__CANCEL__" || current?.toWiangBua === "__CANCEL__";
											const hasNewBooking = (current?.toMaeRim && current.toMaeRim !== "__CANCEL__") || (current?.toWiangBua && current.toWiangBua !== "__CANCEL__");
											const hasSelection = current?.toMaeRim || current?.toWiangBua;

											if (hasSelection) {
												if (hasCancellation && hasNewBooking) {
													return "border-2 border-orange-300 dark:border-orange-600";
												} else if (hasCancellation) {
													return "border-2 border-red-300 dark:border-red-600";
												} else {
													return "border-2 border-blue-300 dark:border-blue-600";
												}
											}
											return "border-0";
										})()}`}>
										<CardHeader>
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0 flex-1">
													<CardTitle className="flex flex-col gap-2 text-base sm:flex-row sm:flex-wrap sm:items-center">
														<div className="flex items-center gap-2">
															<Calendar className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
															<span className="font-bold text-gray-900 dark:text-white">{formatDate(group.date)}</span>
														</div>
														{getRelativeDay(group.date) && (
															<Badge
																variant="outline"
																className="w-fit gap-1 border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-950 dark:text-orange-400">
																{getRelativeDay(group.date)}
															</Badge>
														)}
													</CardTitle>
													<CardDescription className="mt-1.5 text-xs dark:text-gray-400">
														<span>
															{group.schedules.length} รอบ • {group.canReserveCount} รอบว่าง
															{bookedCount > 0 && ` • ${bookedCount} จองแล้ว`}
														</span>
													</CardDescription>
												</div>
												<Badge
													variant={group.canReserveCount > 0 ? "default" : "secondary"}
													className={`shrink-0 ${group.canReserveCount > 0 ? "bg-green-600 hover:bg-green-700 dark:bg-green-500" : "dark:bg-gray-700"}`}>
													{group.canReserveCount > 0 ? (
														<span className="flex items-center gap-1">
															<CheckCircle2 className="h-3 w-3" />
															<span className="text-xs">ว่าง</span>
														</span>
													) : (
														<span className="flex items-center gap-1">
															<X className="h-3 w-3" />
															<span className="text-xs">หมดเวลาจอง</span>
														</span>
													)}
												</Badge>
											</div>
										</CardHeader>

										<Separator className="dark:bg-gray-800" />

										<CardContent className="space-y-4">
											<div className="grid grid-cols-2 gap-3">
												<div className="space-y-2">
													<div className="flex min-h-7 items-center justify-between">
														<div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
															<MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
															<span>แม่ริม</span>
															{(() => {
																const bookedSchedule = group.schedules
																	.filter((s) => s.destinationType === 1)
																	.find((schedule) => {
																		const date = new Date(schedule.date).toISOString().split("T")[0];
																		const time = schedule.departureTime;
																		const bookingKey = `${date}_${time}_1`;
																		return bookedScheduleIds.has(bookingKey);
																	});

																return bookedSchedule ? "จองแล้ว" : null;
															})()}
														</div>
														{selectedSchedules[group.dateString]?.toMaeRim && (
															<Button
																variant="ghost"
																size="sm"
																onClick={() => {
																	setSelectedSchedules((previous) => ({
																		...previous,
																		[group.dateString]: {
																			toMaeRim: undefined,
																			toWiangBua: previous[group.dateString]?.toWiangBua,
																		},
																	}));
																}}
																className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950">
																<X className="h-3 w-3" />
															</Button>
														)}
													</div>
													<Select
														value={
															selectedSchedules[group.dateString]?.toMaeRim?.toString() ||
															(() => {
																const bookedSchedule = group.schedules
																	.filter((s) => s.destinationType === 1)
																	.find((schedule) => {
																		const date = new Date(schedule.date).toISOString().split("T")[0];
																		const time = schedule.departureTime;
																		const bookingKey = `${date}_${time}_1`;
																		return bookedScheduleIds.has(bookingKey);
																	});

																return bookedSchedule ? bookedSchedule.id.toString() : "";
															})()
														}
														onValueChange={(value) => {
															if (value === "__CANCEL__") {
																setSelectedSchedules((previous) => ({
																	...previous,
																	[group.dateString]: {
																		toMaeRim: "__CANCEL__",
																		toWiangBua: previous[group.dateString]?.toWiangBua,
																	},
																}));
																handleScrollToCard(group.dateString);
															} else if (value) {
																const numberValue = Number.parseInt(value);
																const selectedSchedule = group.schedules.find((s) => s.id === numberValue);

																if (selectedSchedule) {
																	const date = new Date(selectedSchedule.date).toISOString().split("T")[0];
																	const time = selectedSchedule.departureTime;
																	const bookingKey = `${date}_${time}_1`;
																	const isBookedItem = bookedScheduleIds.has(bookingKey);

																	if (isBookedItem) {
																		setSelectedSchedules((previous) => ({
																			...previous,
																			[group.dateString]: {
																				toMaeRim: undefined,
																				toWiangBua: previous[group.dateString]?.toWiangBua,
																			},
																		}));
																		return;
																	}
																}

																setSelectedSchedules((previous) => ({
																	...previous,
																	[group.dateString]: {
																		toMaeRim: numberValue,
																		toWiangBua: previous[group.dateString]?.toWiangBua,
																	},
																}));
																handleScrollToCard(group.dateString);
															}
														}}>
														<SelectTrigger className="h-11 border-gray-200 transition-all hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800">
															<SelectValue placeholder="-- เลือกรอบ --" />
														</SelectTrigger>
														<SelectContent className="max-h-60 overflow-y-auto">
															{(() => {
																const hasBookedMaeRim = group.schedules
																	.filter((s) => s.destinationType === 1)
																	.some((schedule) => {
																		const date = new Date(schedule.date).toISOString().split("T")[0];
																		const time = schedule.departureTime;
																		const bookingKey = `${date}_${time}_1`;
																		return bookedScheduleIds.has(bookingKey);
																	});
																return hasBookedMaeRim;
															})() && (
																<SelectItem value="__CANCEL__" className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950">
																	<div className="flex items-center gap-2">
																		<X className="h-3.5 w-3.5" />
																		<span>ยกเลิก</span>
																	</div>
																</SelectItem>
															)}
															{group.schedules
																.filter((s) => s.destinationType === 1)
																.sort((a, b) => {
																	const timeA = a.departureTime.split(":").map(Number);
																	const timeB = b.departureTime.split(":").map(Number);
																	return (timeA[0] ?? 0) * 60 + (timeA[1] ?? 0) - ((timeB[0] ?? 0) * 60 + (timeB[1] ?? 0));
																})
																.map((schedule) => {
																	const date = new Date(schedule.date).toISOString().split("T")[0];
																	const time = schedule.departureTime;
																	const destinationType = "1";
																	const bookingKey = `${date}_${time}_${destinationType}`;
																	const isBooked = bookedScheduleIds.has(bookingKey);

																	return (
																		<SelectItem
																			key={schedule.id}
																			value={schedule.id.toString()}
																			disabled={!schedule.canReserve && !isBooked}
																			className={schedule.canReserve || isBooked ? "" : "cursor-not-allowed opacity-50"}>
																			<div className="flex items-center gap-2">
																				<Clock className={`h-3.5 w-3.5 ${isBooked ? "text-green-400" : "text-gray-500"}`} />
																				<span>{formatTime(time)}</span>
																				{!schedule.canReserve && !isBooked && (
																					<Badge variant="secondary" className="text-xs">
																						หมดเวลาจอง
																					</Badge>
																				)}
																			</div>
																		</SelectItem>
																	);
																})}
														</SelectContent>
													</Select>
												</div>

												<div className="space-y-2">
													<div className="flex min-h-7 items-center justify-between">
														<div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
															<MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
															<span>เวียงบัว</span>
															{(() => {
																const bookedSchedule = group.schedules
																	.filter((s) => s.destinationType === 2)
																	.find((schedule) => {
																		const date = new Date(schedule.date).toISOString().split("T")[0];
																		const time = schedule.departureTime;
																		const bookingKey = `${date}_${time}_2`;
																		return bookedScheduleIds.has(bookingKey);
																	});

																return bookedSchedule ? "จองแล้ว" : null;
															})()}
														</div>
														{selectedSchedules[group.dateString]?.toWiangBua && (
															<Button
																variant="ghost"
																size="sm"
																onClick={() => {
																	setSelectedSchedules((previous) => ({
																		...previous,
																		[group.dateString]: {
																			toMaeRim: previous[group.dateString]?.toMaeRim,
																			toWiangBua: undefined,
																		},
																	}));
																}}
																className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950">
																<X className="h-3 w-3" />
															</Button>
														)}
													</div>
													<Select
														value={
															selectedSchedules[group.dateString]?.toWiangBua?.toString() ||
															(() => {
																const bookedSchedule = group.schedules
																	.filter((s) => s.destinationType === 2)
																	.find((schedule) => {
																		const date = new Date(schedule.date).toISOString().split("T")[0];
																		const time = schedule.departureTime;
																		const bookingKey = `${date}_${time}_2`;
																		return bookedScheduleIds.has(bookingKey);
																	});

																return bookedSchedule ? bookedSchedule.id.toString() : "";
															})()
														}
														onValueChange={(value) => {
															if (value === "__CANCEL__") {
																setSelectedSchedules((previous) => ({
																	...previous,
																	[group.dateString]: {
																		toMaeRim: previous[group.dateString]?.toMaeRim,
																		toWiangBua: "__CANCEL__",
																	},
																}));
																handleScrollToCard(group.dateString);
															} else if (value) {
																const numberValue = Number.parseInt(value);
																const selectedSchedule = group.schedules.find((s) => s.id === numberValue);
																if (selectedSchedule) {
																	const date = new Date(selectedSchedule.date).toISOString().split("T")[0];
																	const time = selectedSchedule.departureTime;
																	const bookingKey = `${date}_${time}_2`;
																	const isBookedItem = bookedScheduleIds.has(bookingKey);

																	if (isBookedItem) {
																		setSelectedSchedules((previous) => ({
																			...previous,
																			[group.dateString]: {
																				toMaeRim: previous[group.dateString]?.toMaeRim,
																				toWiangBua: undefined,
																			},
																		}));
																		return;
																	}
																}

																setSelectedSchedules((previous) => ({
																	...previous,
																	[group.dateString]: {
																		toMaeRim: previous[group.dateString]?.toMaeRim,
																		toWiangBua: numberValue,
																	},
																}));
																handleScrollToCard(group.dateString);
															}
														}}>
														<SelectTrigger className="h-11 border-gray-200 transition-all hover:border-purple-300 dark:border-gray-700 dark:bg-gray-800">
															<SelectValue placeholder="-- เลือกรอบ --" />
														</SelectTrigger>
														<SelectContent className="max-h-60 overflow-y-auto">
															{(() => {
																const hasBookedWiangBua = group.schedules
																	.filter((s) => s.destinationType === 2)
																	.some((schedule) => {
																		const date = new Date(schedule.date).toISOString().split("T")[0];
																		const time = schedule.departureTime;
																		const bookingKey = `${date}_${time}_2`;
																		return bookedScheduleIds.has(bookingKey);
																	});
																return hasBookedWiangBua;
															})() && (
																<SelectItem value="__CANCEL__" className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950">
																	<div className="flex items-center gap-2">
																		<X className="h-3.5 w-3.5" />
																		<span>ยกเลิก</span>
																	</div>
																</SelectItem>
															)}
															{group.schedules
																.filter((s) => s.destinationType === 2)
																.sort((a, b) => {
																	const timeA = a.departureTime.split(":").map(Number);
																	const timeB = b.departureTime.split(":").map(Number);
																	return (timeA[0] ?? 0) * 60 + (timeA[1] ?? 0) - ((timeB[0] ?? 0) * 60 + (timeB[1] ?? 0));
																})
																.map((schedule) => {
																	const date = new Date(schedule.date).toISOString().split("T")[0];
																	const time = schedule.departureTime;
																	const destinationType = "2";
																	const bookingKey = `${date}_${time}_${destinationType}`;
																	const isBooked = bookedScheduleIds.has(bookingKey);

																	return (
																		<SelectItem
																			key={schedule.id}
																			value={schedule.id.toString()}
																			disabled={!schedule.canReserve && !isBooked}
																			className={schedule.canReserve || isBooked ? "" : "cursor-not-allowed opacity-50"}>
																			<div className="flex items-center gap-2">
																				<Clock className={`h-3.5 w-3.5 ${isBooked ? "text-green-400" : "text-gray-500"}`} />
																				<span>{formatTime(time)}</span>
																				{!schedule.canReserve && !isBooked && (
																					<Badge variant="secondary" className="text-xs">
																						หมดเวลาจอง
																					</Badge>
																				)}
																			</div>
																		</SelectItem>
																	);
																})}
														</SelectContent>
													</Select>
												</div>
											</div>

											{(() => {
												const hasBookedSchedules = group.schedules.some((schedule) => {
													const date = new Date(schedule.date).toISOString().split("T")[0];
													const time = schedule.departureTime;
													const destinationType = schedule.destinationType.toString();
													const bookingKey = `${date}_${time}_${destinationType}`;
													return bookedScheduleIds.has(bookingKey);
												});

												const currentSelections = selectedSchedules[group.dateString];
												const validSelectedSchedules = {
													toMaeRim:
														currentSelections?.toMaeRim === "__CANCEL__"
															? "__CANCEL__"
															: typeof currentSelections?.toMaeRim === "number"
																? currentSelections.toMaeRim
																: undefined,
													toWiangBua:
														currentSelections?.toWiangBua === "__CANCEL__"
															? "__CANCEL__"
															: typeof currentSelections?.toWiangBua === "number"
																? currentSelections.toWiangBua
																: undefined,
												};

												const hasSelectedSchedules = validSelectedSchedules.toMaeRim || validSelectedSchedules.toWiangBua;

												return (
													<>
														{hasBookedSchedules && (
															<div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
																<p className="text-xs font-medium text-green-600 dark:text-green-400">รอบที่คุณจอง:</p>

																{group.schedules
																	.filter((schedule) => {
																		const date = new Date(schedule.date).toISOString().split("T")[0];
																		const time = schedule.departureTime;
																		const destinationType = schedule.destinationType.toString();
																		const bookingKey = `${date}_${time}_${destinationType}`;
																		return bookedScheduleIds.has(bookingKey);
																	})
																	.map((bookedSchedule) => {
																		const date = new Date(bookedSchedule.date).toISOString().split("T")[0];
																		const time = bookedSchedule.departureTime;
																		const destinationType = bookedSchedule.destinationType.toString();
																		const bookingKey = `${date}_${time}_${destinationType}`;
																		const reservationData = bookedReservations.get(bookingKey);

																		return (
																			<button
																				key={bookedSchedule.id}
																				type="button"
																				className="flex w-full cursor-pointer flex-wrap items-center gap-2 rounded bg-white p-2 text-left transition-all hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] dark:bg-gray-900 dark:hover:bg-gray-800"
																				onClick={() => navigateToScheduleWithScroll(reservationData?.id)}
																				title="คลิกเพื่อดูรายละเอียดในหน้าจองรถบัส">
																				<Badge
																					className={`text-xs ${
																						bookedSchedule.destinationType === 1
																							? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500"
																							: "bg-purple-600 hover:bg-purple-700 dark:bg-purple-500"
																					}`}>
																					{bookedSchedule.destinationType === 1 ? "ไปแม่ริม" : "กลับเวียงบัว"}
																				</Badge>
																				<span className="text-sm font-semibold text-gray-900 dark:text-white">{formatTime(bookedSchedule.departureTime)}</span>
																			</button>
																		);
																	})}
															</div>
														)}

														{hasSelectedSchedules && (
															<div
																className={`space-y-2 rounded-lg border p-3 ${
																	hasBookedSchedules
																		? "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
																		: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
																}`}>
																<p
																	className={`text-xs font-medium ${(() => {
																		const current = selectedSchedules[group.dateString];
																		const hasCancellation = current?.toMaeRim === "__CANCEL__" || current?.toWiangBua === "__CANCEL__";
																		const hasNewBooking =
																			(current?.toMaeRim && current.toMaeRim !== "__CANCEL__") || (current?.toWiangBua && current.toWiangBua !== "__CANCEL__");

																		if (hasCancellation && hasNewBooking) {
																			return "text-orange-600 dark:text-orange-400";
																		} else if (hasCancellation) {
																			return "text-red-600 dark:text-red-400";
																		} else if (hasBookedSchedules) {
																			return "text-yellow-600 dark:text-yellow-400";
																		} else {
																			return "text-blue-600 dark:text-blue-400";
																		}
																	})()}`}>
																	{(() => {
																		const current = selectedSchedules[group.dateString];
																		const hasCancellation = current?.toMaeRim === "__CANCEL__" || current?.toWiangBua === "__CANCEL__";
																		const hasNewBooking =
																			(current?.toMaeRim && current.toMaeRim !== "__CANCEL__") || (current?.toWiangBua && current.toWiangBua !== "__CANCEL__");

																		if (hasCancellation && hasNewBooking) {
																			return "เปลี่ยนแปลงการจอง:";
																		} else if (hasCancellation) {
																			return "การยกเลิก:";
																		} else if (hasBookedSchedules) {
																			return "เปลี่ยนรอบเป็น:";
																		} else {
																			return "รอบที่เลือก:";
																		}
																	})()}
																</p>

																{validSelectedSchedules.toMaeRim &&
																	(() => {
																		if (validSelectedSchedules.toMaeRim === "__CANCEL__") {
																			return (
																				<div className="flex flex-wrap items-center gap-2 rounded bg-white p-2 dark:bg-gray-900">
																					<Badge className="bg-red-600 text-xs hover:bg-red-700 dark:bg-red-500">ไปแม่ริม</Badge>
																					<span className="text-sm font-semibold text-red-600 dark:text-red-400">ยกเลิก</span>
																				</div>
																			);
																		}
																		const selected = group.schedules.find((s) => s.id === validSelectedSchedules.toMaeRim);
																		if (!selected) return;
																		return (
																			<div className="flex flex-wrap items-center gap-2 rounded bg-white p-2 dark:bg-gray-900">
																				<Badge className="bg-blue-600 text-xs hover:bg-blue-700 dark:bg-blue-500">ไปแม่ริม</Badge>
																				<span className="text-sm font-semibold text-gray-900 dark:text-white">{formatTime(selected.departureTime)}</span>
																			</div>
																		);
																	})()}

																{validSelectedSchedules.toWiangBua &&
																	(() => {
																		if (validSelectedSchedules.toWiangBua === "__CANCEL__") {
																			return (
																				<div className="flex flex-wrap items-center gap-2 rounded bg-white p-2 dark:bg-gray-900">
																					<Badge className="bg-red-600 text-xs hover:bg-red-700 dark:bg-red-500">กลับเวียงบัว</Badge>
																					<span className="text-sm font-semibold text-red-600 dark:text-red-400">ยกเลิก</span>
																				</div>
																			);
																		}
																		const selected = group.schedules.find((s) => s.id === validSelectedSchedules.toWiangBua);
																		if (!selected) return;
																		return (
																			<div className="flex flex-wrap items-center gap-2 rounded bg-white p-2 dark:bg-gray-900">
																				<Badge className="bg-purple-600 text-xs hover:bg-purple-700 dark:bg-purple-500">กลับเวียงบัว</Badge>
																				<span className="text-sm font-semibold text-gray-900 dark:text-white">{formatTime(selected.departureTime)}</span>
																			</div>
																		);
																	})()}
															</div>
														)}
													</>
												);
											})()}

											{(() => {
												const current = selectedSchedules[group.dateString];
												const hasSelection = current?.toMaeRim || current?.toWiangBua;
												const hasCancellation = current?.toMaeRim === "__CANCEL__" || current?.toWiangBua === "__CANCEL__";
												const multipleSelections =
													Object.keys(selectedSchedules).filter((dateString) => {
														const sel = selectedSchedules[dateString];
														return sel && (sel.toMaeRim || sel.toWiangBua);
													}).length > 1;

												return (hasSelection || hasCancellation) && !multipleSelections;
											})() && (
												<Button
													onClick={() => handleBook(group.dateString)}
													disabled={bookingLoading !== undefined}
													className={(() => {
														const current = selectedSchedules[group.dateString];
														const hasCancellation = current?.toMaeRim === "__CANCEL__" || current?.toWiangBua === "__CANCEL__";
														const hasNewBooking =
															(current?.toMaeRim && current.toMaeRim !== "__CANCEL__") || (current?.toWiangBua && current.toWiangBua !== "__CANCEL__");

														if (hasCancellation && hasNewBooking) {
															return "h-12 w-full gap-2 bg-linear-to-r from-orange-600 to-amber-600 text-base font-semibold shadow-lg transition-all hover:scale-[1.02] hover:from-orange-700 hover:to-amber-700 hover:shadow-xl active:scale-[0.98] disabled:hover:scale-100 dark:from-orange-500 dark:to-amber-500";
														} else if (hasCancellation) {
															return "h-12 w-full gap-2 bg-linear-to-r from-red-600 to-red-700 text-base font-semibold shadow-lg transition-all hover:scale-[1.02] hover:from-red-700 hover:to-red-800 hover:shadow-xl active:scale-[0.98] disabled:hover:scale-100 dark:from-red-500 dark:to-red-600";
														} else {
															return "h-12 w-full gap-2 bg-linear-to-r from-blue-600 to-indigo-600 text-base font-semibold shadow-lg transition-all hover:scale-[1.02] hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98] disabled:hover:scale-100 dark:from-blue-500 dark:to-indigo-500";
														}
													})()}
													size="lg">
													{bookingLoading === undefined ? (
														<>
															{(() => {
																const current = selectedSchedules[group.dateString];
																const hasCancellation = current?.toMaeRim === "__CANCEL__" || current?.toWiangBua === "__CANCEL__";
																const hasNewBooking =
																	(current?.toMaeRim && current.toMaeRim !== "__CANCEL__") || (current?.toWiangBua && current.toWiangBua !== "__CANCEL__");

																if (hasCancellation && hasNewBooking) {
																	return <RefreshCw className="h-5 w-5" />;
																} else if (hasCancellation) {
																	return <X className="h-5 w-5" />;
																} else {
																	return <CheckCircle2 className="h-5 w-5" />;
																}
															})()}
															<span>
																{(() => {
																	const current = selectedSchedules[group.dateString];
																	const hasCancellation = current?.toMaeRim === "__CANCEL__" || current?.toWiangBua === "__CANCEL__";
																	const hasNewBooking =
																		(current?.toMaeRim && current.toMaeRim !== "__CANCEL__") || (current?.toWiangBua && current.toWiangBua !== "__CANCEL__");

																	if (hasCancellation && hasNewBooking) {
																		const cancelCount = (current?.toMaeRim === "__CANCEL__" ? 1 : 0) + (current?.toWiangBua === "__CANCEL__" ? 1 : 0);
																		const bookingCount =
																			(current?.toMaeRim && current.toMaeRim !== "__CANCEL__" ? 1 : 0) +
																			(current?.toWiangBua && current.toWiangBua !== "__CANCEL__" ? 1 : 0);
																		return `เปลี่ยนแปลงการจอง (ยกเลิก ${cancelCount} • จอง ${bookingCount})`;
																	} else if (hasCancellation) {
																		const cancelCount = (current?.toMaeRim === "__CANCEL__" ? 1 : 0) + (current?.toWiangBua === "__CANCEL__" ? 1 : 0);
																		return `ยืนยันการยกเลิก${cancelCount > 1 ? ` (${cancelCount} รอบ)` : ""}`;
																	} else {
																		const count =
																			(current?.toMaeRim && current.toMaeRim !== "__CANCEL__" ? 1 : 0) +
																			(current?.toWiangBua && current.toWiangBua !== "__CANCEL__" ? 1 : 0);
																		return `ยืนยันการจอง${count > 1 ? ` (${count} รอบ)` : ""}`;
																	}
																})()}
															</span>
														</>
													) : (
														<>
															<Loader2 className="h-5 w-5 animate-spin" />
															<span>{bookingStatus || "กำลังดำเนินการ..."}</span>
														</>
													)}
												</Button>
											)}
										</CardContent>
									</Card>
								);
							})}
						</>
					) : (
						<Card className="col-span-full border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
							<CardContent className="py-16">
								<div className="space-y-4 text-center">
									<div className="flex justify-center">
										<div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
											<Bus className="h-12 w-12 text-gray-400 dark:text-gray-600" />
										</div>
									</div>
									<div>
										<p className="text-lg font-semibold text-gray-700 dark:text-gray-300">ไม่พบรอบรถที่เปิดจอง</p>
										<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">ไม่มีรอบรถที่สามารถจองได้ในขณะนี้</p>
									</div>
									<Button
										onClick={() => navigate(ROUTES.SCHEDULE)}
										className="mt-4 gap-2 bg-linear-to-r from-blue-600 to-indigo-600 shadow-lg hover:from-blue-700 hover:to-indigo-700">
										<ArrowLeft className="h-4 w-4" />
										กลับไปดูรายการจอง
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				{(() => {
					const multipleSelections = Object.keys(selectedSchedules).filter((dateString) => {
						const sel = selectedSchedules[dateString];
						return sel && (sel.toMaeRim || sel.toWiangBua);
					});

					if (multipleSelections.length <= 1) return null;

					let totalNewBookings = 0;
					let totalCancellations = 0;
					const totalDays = multipleSelections.length;

					for (const dateString of multipleSelections) {
						const sel = selectedSchedules[dateString];
						if (sel?.toMaeRim === "__CANCEL__") totalCancellations++;
						else if (sel?.toMaeRim && sel.toMaeRim !== "__CANCEL__") totalNewBookings++;

						if (sel?.toWiangBua === "__CANCEL__") totalCancellations++;
						else if (sel?.toWiangBua && sel.toWiangBua !== "__CANCEL__") totalNewBookings++;
					}

					const hasBothTypes = totalNewBookings > 0 && totalCancellations > 0;
					const hasOnlyCancellation = totalCancellations > 0 && totalNewBookings === 0;

					return (
						<div className="fixed right-0 bottom-0 left-0 z-50">
							<div className="bg-linear-to-t from-white/95 to-transparent p-4 pb-6 dark:from-gray-950/95">
								<div className="mx-auto max-w-4xl">
									<div
										className={`rounded-2xl border-2 p-4 shadow-2xl backdrop-blur-md ${
											hasBothTypes
												? "border-orange-300 bg-orange-50/95 dark:border-orange-600 dark:bg-orange-950/95"
												: hasOnlyCancellation
													? "border-red-300 bg-red-50/95 dark:border-red-600 dark:bg-red-950/95"
													: "border-blue-300 bg-blue-50/95 dark:border-blue-600 dark:bg-blue-950/95"
										}`}>
										<div className="mb-3 text-center">
											<p
												className={`text-sm font-medium ${
													hasBothTypes
														? "text-orange-700 dark:text-orange-300"
														: hasOnlyCancellation
															? "text-red-700 dark:text-red-300"
															: "text-blue-700 dark:text-blue-300"
												}`}>
												เลือกแล้ว {totalDays} วัน •{totalNewBookings > 0 && ` จอง ${totalNewBookings} รอบ`}
												{totalCancellations > 0 && ` ยกเลิก ${totalCancellations} รอบ`}
											</p>
										</div>

										<Button
											onClick={handleMultipleBook}
											disabled={bookingLoading !== undefined}
											className={`h-14 w-full gap-3 text-base font-bold shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:hover:scale-100 ${
												hasBothTypes
													? "bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 dark:from-orange-500 dark:to-amber-500"
													: hasOnlyCancellation
														? "bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 dark:from-red-500 dark:to-red-600"
														: "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500"
											}`}
											size="lg">
											{bookingLoading === undefined ? (
												<>
													{hasBothTypes ? <RefreshCw className="h-6 w-6" /> : hasOnlyCancellation ? <X className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
													<span>
														{hasBothTypes
															? `ดำเนินการทั้งหมด (${totalDays} วัน)`
															: hasOnlyCancellation
																? `ยืนยันการยกเลิกทั้งหมด (${totalDays} วัน)`
																: `ยืนยันการจองทั้งหมด (${totalDays} วัน)`}
													</span>
												</>
											) : (
												<>
													<Loader2 className="h-6 w-6 animate-spin" />
													<span>{bookingStatus || "กำลังดำเนินการ..."}</span>
												</>
											)}
										</Button>
									</div>
								</div>
							</div>
						</div>
					);
				})()}
			</div>
		</div>
	);
}
