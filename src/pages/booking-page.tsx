/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AvailableBusData, AvailableBusSchedule } from "@cmru-comsci-66/cmru-api";
import { AlertCircle, ArrowLeft, Bus, Calendar, CheckCircle2, Clock, Loader2, LogOut, MapPin, RefreshCw, X } from "lucide-react";
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
import { formatTime } from "../lib/time-formatter";

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
	const { bookBus, getAvailableBuses, getSchedule, isAuthenticated, logout } = useApi();
	const [availableBuses, setAvailableBuses] = useState<AvailableBusData | undefined>();
	const [bookedScheduleIds, setBookedScheduleIds] = useState<Set<string>>(new Set());
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | undefined>();
	const [bookingLoading, setBookingLoading] = useState<number | undefined>();
	const [selectedSchedules, setSelectedSchedules] = useState<Record<string, { toMaeRim: number | undefined; toWiangBua: number | undefined }>>({});
	const [isDark, setIsDark] = useState(false);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [filterMode, setFilterMode] = useState<"all" | "available" | "canReserve">("all");

	useEffect(() => {
		const theme = localStorage.getItem("theme");
		const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		const shouldBeDark = theme === "dark" || (!theme && prefersDark);
		setIsDark(shouldBeDark);
		document.documentElement.classList.toggle("dark", shouldBeDark);
	}, []);

	const toggleTheme = () => {
		const userTheme = !isDark;
		setIsDark(userTheme);
		localStorage.setItem("theme", userTheme ? "dark" : "light");
		document.documentElement.classList.toggle("dark", userTheme);
	};

	const fetchAvailableBuses = useCallback(async () => {
		setIsLoading(true);
		setError(undefined);

		try {
			const data = await getAvailableBuses();
			setAvailableBuses(data ?? undefined);
		} catch (error_) {
			const errorMessage = error_ instanceof Error ? error_.message : "ไม่สามารถดึงข้อมูลตารางรถได้";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [getAvailableBuses]);

	const fetchBookedSchedules = useCallback(async () => {
		try {
			const schedule = await getSchedule();
			if (schedule?.reservations) {
				const bookedKeys = new Set(
					schedule.reservations.map((r) => {
						const date = new Date(r.date).toISOString().split("T")[0];
						const time = r.departureTime.replace(".", ":");
						const destinationType = r.destination.name.toLowerCase().includes("เวียงบัว") ? "2" : "1";
						return `${date}_${time}_${destinationType}`;
					}),
				);
				setBookedScheduleIds(bookedKeys);
			}
		} catch (error_) {
			console.error("Failed to fetch booked schedules:", error_);
		}
	}, [getSchedule]);

	useEffect(() => {
		if (isAuthenticated) {
			fetchAvailableBuses();
			fetchBookedSchedules();
		}
	}, [isAuthenticated, fetchAvailableBuses, fetchBookedSchedules]);

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

	const handleBook = async (dateString: string) => {
		const selections = selectedSchedules[dateString];
		if (!selections) return;

		const scheduleIds = [selections.toMaeRim, selections.toWiangBua].filter((id): id is number => id !== undefined);

		if (scheduleIds.length === 0) return;

		setBookingLoading(-1);

		let allSuccess = true;
		const results: string[] = [];

		for (const scheduleId of scheduleIds) {
			const schedule = availableBuses?.availableSchedules.find((s) => s.id === scheduleId);
			if (!schedule || !schedule.canReserve) continue;

			const dateString = typeof schedule.date === "string" ? schedule.date : new Date(schedule.date).toISOString();
			const result = await bookBus(schedule.id, dateString, schedule.destinationType);

			results.push(`${schedule.destination} ${formatTime(schedule.departureTime)} : ${result.message}`);

			if (!result.success) {
				allSuccess = false;
			}
		}

		if (allSuccess) {
			setSelectedSchedules((previous) => {
				const updatedState = { ...previous };
				delete updatedState[dateString];
				return updatedState;
			});
			await fetchAvailableBuses();
			await fetchBookedSchedules();
		}
		setBookingLoading(undefined);
	};

	if (isLoading && !availableBuses) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
				<div className="container mx-auto space-y-4 p-4 sm:space-y-6 sm:p-6">
					<Card className="border-0 bg-white/90 shadow-lg backdrop-blur-md dark:bg-gray-900/90">
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center justify-between">
								<Skeleton className="h-8 w-48" />
								<div className="flex gap-2">
									<Skeleton className="h-10 w-10 rounded-md" />
									<Skeleton className="h-10 w-32 rounded-md" />
								</div>
							</div>
						</CardContent>
					</Card>

					<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
						{[1, 2, 3, 4].map((index) => (
							<Card key={index} className="border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
								<CardContent className="p-4">
									<Skeleton className="mb-2 h-4 w-20" />
									<Skeleton className="h-8 w-16" />
								</CardContent>
							</Card>
						))}
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{[1, 2, 3, 4, 5, 6].map((index) => (
							<Card key={index} className="border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
								<CardContent className="space-y-3 p-4">
									<div className="flex justify-between">
										<Skeleton className="h-6 w-40" />
										<Skeleton className="h-6 w-24 rounded-full" />
									</div>
									<div className="space-y-2">
										<Skeleton className="h-10 w-full rounded-md" />
										<Skeleton className="h-10 w-full rounded-md" />
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
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
				<Card className="w-full max-w-md border-0 bg-white/90 shadow-2xl backdrop-blur-md dark:bg-gray-900/90">
					<CardContent className="p-6">
						<Alert variant="destructive" className="border-red-200 dark:border-red-900">
							<AlertCircle className="h-5 w-5" />
							<AlertTitle className="mb-2 text-lg font-semibold">เกิดข้อผิดพลาด</AlertTitle>
							<AlertDescription className="mb-4 text-sm">{error}</AlertDescription>
						</Alert>
						<Button onClick={fetchAvailableBuses} className="mt-4 w-full" size="lg">
							<RefreshCw className="mr-2 h-5 w-5" />
							ลองอีกครั้ง
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
			<Helmet>
				<title>${ROUTE_METADATA["/booking"].title}</title>
				<meta name="description" content={ROUTE_METADATA["/booking"].description} />
			</Helmet>
			<div className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
				<div className="container mx-auto px-4 py-4 sm:px-6">
					<div className="flex items-center justify-between gap-4">
						<div className="flex min-w-0 flex-1 items-center gap-3">
							<Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.SCHEDULE)} className="h-10 w-10 shrink-0 rounded-full hover:scale-110">
								<ArrowLeft className="h-5 w-5" />
							</Button>
							<div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl">
								<Bus className="h-5 w-5 text-white sm:h-6 sm:w-6" />
							</div>
							<div className="min-w-0 flex-1">
								<h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl dark:text-white">จองรถบัส</h1>
								<p className="truncate text-xs text-gray-600 sm:text-sm dark:text-gray-400">
									{groupedSchedules.length > 0 ? (
										<>
											<span>
												{groupedSchedules.length} วัน • {availableBuses?.totalAvailable || 0} รอบ
											</span>
										</>
									) : (
										<span>ไม่มีรอบรถที่เปิดจอง</span>
									)}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<Button variant="outline" size="icon" onClick={fetchAvailableBuses} disabled={isLoading} className="h-10 w-10 rounded-full hover:scale-110">
								<RefreshCw className={`h-5 w-5 transition-transform ${isLoading ? "animate-spin" : "hover:rotate-180"}`} />
							</Button>

							<Button
								variant="outline"
								size="icon"
								onClick={logout}
								className="h-10 w-10 rounded-full hover:scale-110 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
								<LogOut className="h-5 w-5" />
							</Button>
						</div>
					</div>
				</div>
			</div>

			{availableBuses && groupedSchedules.length > 0 && (
				<div className="container mx-auto px-4 py-6 sm:px-6">
					<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
						<Card
							className="group cursor-pointer border-0 bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-900/90"
							onClick={() => setFilterMode("all")}
							style={filterMode === "all" ? { outline: "2px solid rgb(37 99 235)", outlineOffset: "2px" } : {}}>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">วันที่มีรถ</p>
										<p className="text-2xl font-bold">
											<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
												{availableBuses.availableSchedules
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
													: 0}
											</span>
										</p>
									</div>
									<div className="rounded-lg bg-blue-100 p-2 transition-all group-hover:scale-110 dark:bg-blue-900">
										<Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
									</div>
								</div>
							</CardContent>
						</Card>

						<Card
							className="group cursor-pointer border-0 bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-900/90"
							onClick={() => setFilterMode("available")}
							style={filterMode === "available" ? { outline: "2px solid rgb(34 197 94)", outlineOffset: "2px" } : {}}>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">มีรอบว่าง</p>
										<p className="text-2xl font-bold">
											<span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-400">
												{availableBuses.availableSchedules
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
													: 0}
											</span>
										</p>
									</div>
									<div className="rounded-lg bg-green-100 p-2 transition-all group-hover:scale-110 dark:bg-green-900">
										<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
									</div>
								</div>
							</CardContent>
						</Card>

						<Card
							className="group cursor-pointer border-0 bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-900/90"
							onClick={() => setFilterMode("all")}
							style={filterMode === "all" ? { outline: "2px solid rgb(37 99 235)", outlineOffset: "2px" } : {}}>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">รอบทั้งหมด</p>
										<p className="text-2xl font-bold">
											<span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">
												{availableBuses.totalAvailable}
											</span>
										</p>
									</div>
									<div className="rounded-lg bg-purple-100 p-2 transition-all group-hover:scale-110 dark:bg-purple-900">
										<Bus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
									</div>
								</div>
							</CardContent>
						</Card>

						<Card
							className="group cursor-pointer border-0 bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-900/90"
							onClick={() => setFilterMode("canReserve")}
							style={filterMode === "canReserve" ? { outline: "2px solid rgb(234 88 12)", outlineOffset: "2px" } : {}}>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">จองได้</p>
										<p className="text-2xl font-bold">
											<span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent dark:from-orange-400 dark:to-red-400">
												{availableBuses.availableSchedules.filter((s) => s.canReserve).length}
											</span>
										</p>
									</div>
									<div className="rounded-lg bg-orange-100 p-2 transition-all group-hover:scale-110 dark:bg-orange-900">
										<CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			)}

			<div className="container mx-auto px-4 pb-8 sm:px-6">
				<div className="mb-4 flex items-center justify-between">
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
					{groupedSchedules && groupedSchedules.length > 0 ? (
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
										className="group border-0 bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-xl dark:bg-gray-900/90">
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
													<div className="flex min-h-[28px] items-center justify-between">
														<div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
															<MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
															<span>ไปแม่ริม</span>
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
														value={selectedSchedules[group.dateString]?.toMaeRim?.toString() || ""}
														onValueChange={(value) => {
															if (value) {
																const numberValue = Number.parseInt(value);
																setSelectedSchedules((previous) => ({
																	...previous,
																	[group.dateString]: {
																		toMaeRim: numberValue,
																		toWiangBua: previous[group.dateString]?.toWiangBua,
																	},
																}));
															} else {
																setSelectedSchedules((previous) => ({
																	...previous,
																	[group.dateString]: {
																		toMaeRim: undefined,
																		toWiangBua: previous[group.dateString]?.toWiangBua,
																	},
																}));
															}
														}}>
														<SelectTrigger className="h-11 border-gray-200 transition-all hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800">
															<SelectValue placeholder="-- เลือกรอบ --" />
														</SelectTrigger>
														<SelectContent className="max-h-60 overflow-y-auto">
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
																			disabled={!schedule.canReserve || isBooked}
																			className={schedule.canReserve && !isBooked ? "" : "cursor-not-allowed opacity-50"}>
																			<div className="flex items-center gap-2">
																				<Clock className="h-3.5 w-3.5 text-gray-500" />
																				<span>{formatTime(time)}</span>
																				{isBooked && (
																					<Badge variant="default" className="bg-blue-600 text-xs dark:bg-blue-500">
																						จองแล้ว
																					</Badge>
																				)}
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
													<div className="flex min-h-[28px] items-center justify-between">
														<div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
															<MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
															<span>กลับเวียงบัว</span>
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
														value={selectedSchedules[group.dateString]?.toWiangBua?.toString() || ""}
														onValueChange={(value) => {
															if (value) {
																const numberValue = Number.parseInt(value);
																setSelectedSchedules((previous) => ({
																	...previous,
																	[group.dateString]: {
																		toMaeRim: previous[group.dateString]?.toMaeRim,
																		toWiangBua: numberValue,
																	},
																}));
															} else {
																setSelectedSchedules((previous) => ({
																	...previous,
																	[group.dateString]: {
																		toMaeRim: previous[group.dateString]?.toMaeRim,
																		toWiangBua: undefined,
																	},
																}));
															}
														}}>
														<SelectTrigger className="h-11 border-gray-200 transition-all hover:border-purple-300 dark:border-gray-700 dark:bg-gray-800">
															<SelectValue placeholder="-- เลือกรอบ --" />
														</SelectTrigger>
														<SelectContent className="max-h-60 overflow-y-auto">
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
																			disabled={!schedule.canReserve || isBooked}
																			className={schedule.canReserve && !isBooked ? "" : "cursor-not-allowed opacity-50"}>
																			<div className="flex items-center gap-2">
																				<Clock className="h-3.5 w-3.5 text-gray-500" />
																				<span>{formatTime(time)}</span>
																				{isBooked && (
																					<Badge variant="default" className="bg-blue-600 text-xs dark:bg-blue-500">
																						จองแล้ว
																					</Badge>
																				)}
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

											{(selectedSchedules[group.dateString]?.toMaeRim || selectedSchedules[group.dateString]?.toWiangBua) && (
												<div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
													<p className="text-xs font-medium text-blue-600 dark:text-blue-400">รอบที่เลือก:</p>

													{selectedSchedules[group.dateString]?.toMaeRim &&
														(() => {
															const selected = group.schedules.find((s) => s.id === selectedSchedules[group.dateString]?.toMaeRim);
															if (!selected) return;
															return (
																<div className="flex flex-wrap items-center gap-2 rounded bg-white p-2 dark:bg-gray-900">
																	<Badge className="bg-blue-600 text-xs hover:bg-blue-700 dark:bg-blue-500">ไปแม่ริม</Badge>
																	<span className="text-sm font-semibold text-gray-900 dark:text-white">{formatTime(selected.departureTime)}</span>
																</div>
															);
														})()}

													{selectedSchedules[group.dateString]?.toWiangBua &&
														(() => {
															const selected = group.schedules.find((s) => s.id === selectedSchedules[group.dateString]?.toWiangBua);
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

											{(selectedSchedules[group.dateString]?.toMaeRim || selectedSchedules[group.dateString]?.toWiangBua) && (
												<Button
													onClick={() => handleBook(group.dateString)}
													disabled={bookingLoading !== undefined}
													className="h-12 w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold shadow-lg transition-all hover:scale-[1.02] hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98] disabled:hover:scale-100 dark:from-blue-500 dark:to-indigo-500"
													size="lg">
													{bookingLoading === undefined ? (
														<>
															<CheckCircle2 className="h-5 w-5" />
															<span>
																ยืนยันการจอง
																{selectedSchedules[group.dateString]?.toMaeRim && selectedSchedules[group.dateString]?.toWiangBua ? " (2 รอบ)" : " (1 รอบ)"}
															</span>
														</>
													) : (
														<>
															<Loader2 className="h-5 w-5 animate-spin" />
															<span>กำลังจอง...</span>
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
										className="mt-4 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:from-blue-700 hover:to-indigo-700">
										<ArrowLeft className="h-4 w-4" />
										กลับไปดูรายการจอง
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
