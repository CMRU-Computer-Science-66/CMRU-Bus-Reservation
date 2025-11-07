import type { ParsedScheduleData, ScheduleReservation } from "@cmru-comsci-66/cmru-api";
import { Calendar, Car, ChevronDown, ChevronUp, LogOut, MapPin, Menu, Plus, RefreshCw, Settings, TrendingUp, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ROUTE_METADATA, ROUTES } from "../config/routes";
import { useApi } from "../contexts/api-context";
import { ErrorScreen } from "./components/error-screen";
import { PageHeader } from "./components/page-header";
import { StatCard } from "./components/stat-card";
import { ThemeToggle } from "./components/theme-toggle";

interface StatisticsData {
	averageBookingsPerMonth: number;
	cancelledBookings: number;
	completedTrips: number;
	confirmedBookings: number;
	dayOfWeekStatistics: {
		count: number;
		day: string;
		dayName: string;
	}[];
	monthlyStatistics: {
		bookings: number;
		completed: number;
		month: string;
	}[];
	mostFrequentDay: string;
	mostFrequentRoute: string;
	routeStatistics: {
		count: number;
		percentage: number;
		route: string;
	}[];
	statusDistribution: {
		color: string;
		count: number;
		percentage: number;
		status: string;
	}[];
	totalBookings: number;
}

const thaiDayNames = {
	"0": "อาทิตย์",
	"1": "จันทร์",
	"2": "อังคาร",
	"3": "พุธ",
	"4": "พฤหัสบดี",
	"5": "ศุกร์",
	"6": "เสาร์",
} as const;

const thaiMonthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

const statusColors = {
	รอยืนยัน: "#f59e0b",
	ยืนยันแล้ว: "#10b981",
	เดินทางแล้ว: "#3b82f6",
	ยกเลิก: "#ef4444",
} as const;

function getRouteDisplayName(route: string): string {
	if (route.includes("เวียงบัว")) return "เวียงบัว → แม่ริม";
	if (route.includes("แม่ริม")) return "แม่ริม → เวียงบัว";
	return route;
}

function processScheduleData(scheduleData: ParsedScheduleData): StatisticsData {
	const allItems = scheduleData.reservations || [];
	const totalBookings = allItems.length;
	const confirmedBookings = allItems.filter((item) => item.confirmation?.isConfirmed).length;
	const completedTrips = allItems.filter((item) => item.travelStatus?.hasCompleted === true).length;
	const cancelledBookings = allItems.filter((item) => !item.confirmation?.isConfirmed && !item.travelStatus?.hasCompleted).length;
	const routeCounts = allItems.reduce(
		(accumulator: Record<string, number>, item) => {
			const route = getRouteDisplayName(item.destination?.name || "ไม่ระบุ");
			accumulator[route] = (accumulator[route] || 0) + 1;
			return accumulator;
		},
		{} as Record<string, number>,
	);

	const routeStatistics = Object.entries(routeCounts)
		.map(([route, count]) => ({
			route,
			count: count as number,
			percentage: Math.round((count / totalBookings) * 100),
		}))
		.sort((a, b) => b.count - a.count);

	const mostFrequentRoute = routeStatistics[0]?.route || "ไม่มีข้อมูล";
	const dayOfWeekCounts = allItems.reduce(
		(accumulator: Record<string, number>, item) => {
			const date = new Date(item.date);
			const dayOfWeek = date.getDay().toString();
			accumulator[dayOfWeek] = (accumulator[dayOfWeek] || 0) + 1;
			return accumulator;
		},
		{} as Record<string, number>,
	);

	const dayOfWeekStatistics = Object.entries(dayOfWeekCounts)
		.map(([day, count]) => ({
			day,
			dayName: thaiDayNames[day as keyof typeof thaiDayNames],
			count: count as number,
		}))
		.sort((a, b) => b.count - a.count);

	const mostFrequentDay = dayOfWeekStatistics[0]?.dayName || "ไม่มีข้อมูล";
	const monthlyData = allItems.reduce(
		(accumulator: Record<number, { bookings: number; completed: number; month: string }>, item) => {
			const date = new Date(item.date);
			const monthIndex = date.getMonth();
			const monthName = thaiMonthNames[monthIndex] || "ไม่ระบุ";

			if (!accumulator[monthIndex]) {
				accumulator[monthIndex] = { month: monthName, bookings: 0, completed: 0 };
			}

			const monthData = accumulator[monthIndex];
			if (monthData) {
				monthData.bookings += 1;
				if (item.travelStatus?.hasCompleted === true) {
					monthData.completed += 1;
				}
			}

			return accumulator;
		},
		{} as Record<number, { bookings: number; completed: number; month: string }>,
	);

	const monthlyStatistics = Object.values(monthlyData).sort((a, b) => {
		const aIndex = thaiMonthNames.indexOf(a.month);
		const bIndex = thaiMonthNames.indexOf(b.month);
		return aIndex - bIndex;
	});

	const averageBookingsPerMonth = monthlyStatistics.length > 0 ? Math.round(totalBookings / monthlyStatistics.length) : 0;
	const statusCounts: Record<string, number> = {};

	for (const item of allItems) {
		let status: string;
		if (item.travelStatus?.hasCompleted === true) {
			status = "เดินทางแล้ว";
		} else if (item.confirmation?.isConfirmed) {
			status = "ยืนยันแล้ว";
		} else {
			status = "รอยืนยัน";
		}
		statusCounts[status] = (statusCounts[status] || 0) + 1;
	}

	const statusDistribution = Object.entries(statusCounts)
		.map(([status, count]) => ({
			status,
			count: count as number,
			percentage: Math.round((count / totalBookings) * 100),
			color: statusColors[status as keyof typeof statusColors] || "#6b7280",
		}))
		.sort((a, b) => b.count - a.count);

	return {
		totalBookings,
		confirmedBookings,
		completedTrips,
		cancelledBookings,
		mostFrequentRoute,
		mostFrequentDay,
		averageBookingsPerMonth,
		routeStatistics,
		monthlyStatistics,
		dayOfWeekStatistics,
		statusDistribution,
	};
}

export function StatisticsPage() {
	const navigate = useNavigate();
	const { error, getSchedule, logout } = useApi();
	const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
	const [allReservations, setAllReservations] = useState<ScheduleReservation[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDark, setIsDark] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

	useEffect(() => {
		const theme = localStorage.getItem("theme");
		const prefersDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
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

	const toggleMonthExpansion = (month: string) => {
		const updatedExpanded = new Set(expandedMonths);
		if (updatedExpanded.has(month)) {
			updatedExpanded.delete(month);
		} else {
			updatedExpanded.add(month);
		}
		setExpandedMonths(updatedExpanded);
	};

	const getReservationsForMonth = (monthName: string) => {
		const monthIndex = thaiMonthNames.indexOf(monthName);
		if (monthIndex === -1) return [];

		return allReservations
			.filter((reservation) => {
				const date = new Date(reservation.date);
				return date.getMonth() === monthIndex;
			})
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	};

	useEffect(() => {
		const loadAllScheduleData = async () => {
			setIsLoading(true);

			try {
				const allReservations: ScheduleReservation[] = [];
				let currentPage = 1;
				let hasMore = true;

				while (hasMore) {
					const scheduleData = await getSchedule(currentPage, 50);
					if (scheduleData && scheduleData.reservations && scheduleData.reservations.length > 0) {
						allReservations.push(...scheduleData.reservations);

						currentPage++;
						hasMore = scheduleData.hasNextPage || false;
					} else {
						hasMore = false;
					}
				}

				if (allReservations.length > 0) {
					setAllReservations(allReservations);
					const mockScheduleData: ParsedScheduleData = {
						reservations: allReservations,
						totalReservations: allReservations.length,
						userInfo: { name: "" },
						currentPage: 1,
						totalPages: 1,
						hasNextPage: false,
						hasPrevPage: false,
					};
					const stats = processScheduleData(mockScheduleData);
					setStatisticsData(stats);
				}
			} finally {
				setIsLoading(false);
			}
		};

		loadAllScheduleData();
	}, [getSchedule]);

	if (error) {
		return <ErrorScreen error={error} onRetry={() => window.location.reload()} />;
	}

	const metadata = ROUTE_METADATA[ROUTES.STATISTICS];

	const subtitle = (
		<>
			<span className="font-medium text-blue-600 dark:text-blue-400">{isLoading ? "กำลังโหลด..." : "ข้อมูลสถิติ"}</span>
			{" • "}
			<span>{statisticsData?.totalBookings || 0} รายการ</span>
		</>
	);

	const desktopActions = (
		<>
			<ThemeToggle isDark={isDark} onToggle={toggleTheme} className="hidden md:flex" />
			<Button
				size="sm"
				onClick={() => navigate(ROUTES.BOOKING)}
				className="hidden gap-2 bg-linear-to-r from-green-600 to-emerald-600 shadow-lg transition-all hover:scale-105 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl md:flex dark:from-green-500 dark:to-emerald-500">
				<Plus className="h-4 w-4" />
				จองรถ
			</Button>
			<Button variant="outline" size="sm" onClick={() => navigate(ROUTES.SCHEDULE)} className="hidden gap-2 shadow-sm hover:shadow-lg md:flex">
				<Car className="h-4 w-4" />
				รายการจอง
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
		</>
	);

	const mobileMenuButton = (
		<>
			<Button
				onClick={() => navigate(ROUTES.BOOKING)}
				size="icon"
				className="h-10 w-10 rounded-full bg-white text-green-600 shadow-md transition-all hover:scale-110 hover:bg-orange-50 active:scale-95 md:hidden dark:bg-gray-800 dark:text-orange-400 dark:hover:bg-gray-700">
				<Plus className="h-4 w-4 sm:h-5 sm:w-5" />
			</Button>
			<Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="h-10 w-10 transition-all hover:scale-110 active:scale-95 md:hidden">
				{mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
			</Button>
		</>
	);

	return (
		<div className="relative min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
			<Helmet>
				<title>{metadata.title}</title>
				<meta name="description" content={metadata.description} />
			</Helmet>
			<PageHeader
				title="สถิติการเดินทาง"
				subtitle={subtitle}
				actions={
					<>
						{desktopActions}
						{mobileMenuButton}
					</>
				}
			/>

			{mobileMenuOpen && (
				<div className="animate-in slide-in-from-top-4 fade-in-0 container mx-auto border-b border-gray-200 bg-white/80 px-4 py-4 backdrop-blur-md duration-200 md:hidden dark:border-gray-800 dark:bg-gray-900/80">
					<div className="space-y-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								navigate(ROUTES.SCHEDULE);
								setMobileMenuOpen(false);
							}}
							className="w-full justify-start gap-2">
							<RefreshCw className="h-4 w-4" />
							รายการจอง
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								navigate(ROUTES.SETTINGS);
								setMobileMenuOpen(false);
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
			)}

			<div className="container mx-auto px-4 py-6 sm:px-6">
				<div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<StatCard label="จองทั้งหมด" value={statisticsData?.totalBookings?.toString() || "0"} icon={Calendar} gradient="from-blue-600 to-indigo-600" isLoading={isLoading} />
					<StatCard
						label="ยืนยันแล้ว"
						value={statisticsData?.confirmedBookings?.toString() || "0"}
						icon={Users}
						gradient="from-green-600 to-emerald-600"
						isLoading={isLoading}
					/>
					<StatCard label="เดินทางแล้ว" value={statisticsData?.completedTrips?.toString() || "0"} icon={MapPin} gradient="from-purple-600 to-pink-600" isLoading={isLoading} />
					<StatCard
						label="เฉลีย/เดือน"
						value={statisticsData?.averageBookingsPerMonth?.toString() || "0"}
						icon={TrendingUp}
						gradient="from-orange-600 to-red-600"
						isLoading={isLoading}
					/>
				</div>

				{isLoading ? (
					<div className="grid gap-6 md:grid-cols-2">
						{[1, 2, 3, 4].map((index) => (
							<Card key={index}>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<div className="h-5 w-5 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
										<div className="h-5 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
									</CardTitle>
									<div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{[1, 2, 3].map((item) => (
											<div key={item} className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="h-4 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
													<div className="h-5 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
												</div>
												<div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MapPin className="h-5 w-5" />
									สถิติตามเส้นทาง
								</CardTitle>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									เส้นทางที่เดินทางบ่อยที่สุด: <strong>{statisticsData?.mostFrequentRoute || "กำลังโหลด..."}</strong>
								</p>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{statisticsData?.routeStatistics?.map((route) => (
										<div key={route.route} className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="font-medium">{route.route}</div>
												<Badge variant="secondary">{route.percentage}%</Badge>
											</div>
											<div className="text-sm text-gray-600 dark:text-gray-400">{route.count} ครั้ง</div>
										</div>
									)) ||
										[1, 2, 3].map((index) => (
											<div key={index} className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="h-4 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
													<div className="h-5 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
												</div>
												<div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
											</div>
										))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<TrendingUp className="h-5 w-5" />
									การกระจายตามสถานะ
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{statisticsData?.statusDistribution?.map((status) => (
										<div key={status.status} className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="h-4 w-4 rounded-full" style={{ backgroundColor: status.color }} />
												<div className="font-medium">{status.status}</div>
												<Badge variant="secondary">{status.percentage}%</Badge>
											</div>
											<div className="text-sm text-gray-600 dark:text-gray-400">{status.count} ครั้ง</div>
										</div>
									)) ||
										[1, 2, 3].map((index) => (
											<div key={index} className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="h-4 w-4 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
													<div className="h-4 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
													<div className="h-5 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
												</div>
												<div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
											</div>
										))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Calendar className="h-5 w-5" />
									สถิติตามวันในสัปดาห์
								</CardTitle>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									วันที่เดินทางบ่อยที่สุด: <strong>วัน{statisticsData?.mostFrequentDay || "กำลังโหลด..."}</strong>
								</p>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{statisticsData?.dayOfWeekStatistics?.map((day) => (
										<div key={day.day} className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="font-medium">วัน{day.dayName}</div>
												<Badge variant="secondary">{Math.round((day.count / (statisticsData?.totalBookings || 1)) * 100)}%</Badge>
											</div>
											<div className="text-sm text-gray-600 dark:text-gray-400">{day.count} ครั้ง</div>
										</div>
									)) ||
										[1, 2, 3, 4].map((index) => (
											<div key={index} className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
													<div className="h-5 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
												</div>
												<div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
											</div>
										))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<TrendingUp className="h-5 w-5" />
									สถิติรายเดือน
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{statisticsData?.monthlyStatistics?.map((month) => {
										const isExpanded = expandedMonths.has(month.month);
										const monthReservations = getReservationsForMonth(month.month);

										return (
											<div key={month.month} className="space-y-2">
												<div className="flex items-center justify-between">
													<button
														onClick={() => toggleMonthExpansion(month.month)}
														className="flex items-center gap-2 text-left font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400">
														<span>{month.month}</span>
														{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
													</button>
													<div className="text-sm text-gray-600 dark:text-gray-400">
														จอง: {month.bookings} | เดินทาง: {month.completed}
													</div>
												</div>
												<div className="flex gap-2">
													<Badge variant="outline">เดินทางแล้ว: {month.bookings > 0 ? Math.round((month.completed / month.bookings) * 100) : 0}%</Badge>
												</div>

												{isExpanded && (
													<div className="mt-3 ml-6 space-y-2 border-l-2 border-blue-200 pl-4 dark:border-blue-800">
														{monthReservations.length > 0 ? (
															monthReservations.map((reservation) => (
																<div
																	key={`${reservation.date}-${reservation.departureTime}`}
																	className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
																	<div className="flex items-center gap-3">
																		<div className="text-sm">
																			<div className="font-medium">
																				{new Date(reservation.date).toLocaleDateString("th-TH", {
																					year: "numeric",
																					month: "short",
																					day: "numeric",
																				})}
																			</div>
																			<div className="text-xs text-gray-600 dark:text-gray-400">
																				{reservation.departureTime} • {reservation.destination?.name}
																			</div>
																		</div>
																	</div>
																	<div className="flex items-center gap-2">
																		{reservation.travelStatus?.hasCompleted ? (
																			<Badge className="bg-blue-600 text-xs">เดินทางแล้ว</Badge>
																		) : reservation.confirmation?.isConfirmed ? (
																			<Badge className="bg-green-600 text-xs">ยืนยันแล้ว</Badge>
																		) : (
																			<Badge variant="secondary" className="text-xs">
																				รอยืนยัน
																			</Badge>
																		)}
																	</div>
																</div>
															))
														) : (
															<div className="text-sm text-gray-500 italic dark:text-gray-400">ไม่มีข้อมูลการจองในเดือนนี้</div>
														)}
													</div>
												)}
											</div>
										);
									}) ||
										[1, 2, 3].map((index) => (
											<div key={index} className="space-y-2">
												<div className="flex items-center justify-between">
													<div className="h-4 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
													<div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
												</div>
												<div className="flex gap-2">
													<div className="h-5 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
												</div>
											</div>
										))}
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}
