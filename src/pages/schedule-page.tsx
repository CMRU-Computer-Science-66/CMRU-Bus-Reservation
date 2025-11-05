import type { ScheduleReservation } from "@cmru-comsci-66/cmru-api";
import { Calendar, CheckCircle2, List, Loader2, LogOut, Menu, Plus, QrCode, RefreshCw, Settings, TrendingUp, User, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useApi } from "../contexts/api-context";
import { useSchedule } from "../hooks/use-schedule";
import { formatThaiDateShort, getRelativeDay } from "./components/date-utils";
import { ErrorScreen } from "./components/error-screen";
import { LoadingScreen } from "./components/loading-screen";
import { PageHeader } from "./components/page-header";
import { ReservationCard } from "./components/reservation-card";
import { StatCard } from "./components/stat-card";
import { ThemeToggle } from "./components/theme-toggle";

interface SchedulePageProperties {
	onNavigateToBooking?: () => void;
	onNavigateToSettings?: () => void;
}

export function SchedulePage({ onNavigateToBooking, onNavigateToSettings }: SchedulePageProperties) {
	const { logout } = useApi();
	const { error, isLoading, refetch, schedule } = useSchedule(true);
	const { cancelReservation, confirmReservation } = useApi();
	const [actionLoading, setActionLoading] = useState<number | null>(null);
	const [isDark, setIsDark] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [filterStatus, setFilterStatus] = useState<"all" | "confirmed" | "completed" | "hasQR">("all");

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

	const groupedByDate = schedule?.reservations
		? Object.values(
				schedule.reservations
					.filter((item) => {
						if (filterStatus === "confirmed") return item.confirmation.isConfirmed;
						if (filterStatus === "completed") return item.travelStatus.hasCompleted === true;
						if (filterStatus === "hasQR") return item.ticket.hasQRCode;
						return true;
					})
					.reduce(
						(accumulator, item) => {
							const dateObject = new Date(item.date);
							const dateKey = dateObject.toISOString().split("T")[0];

							if (!accumulator[dateKey]) {
								accumulator[dateKey] = {
									date: dateKey,
									dateISO: item.date,
									displayDate: formatThaiDateShort(item.date),
									items: [],
								};
							}

							accumulator[dateKey].items.push(item);
							return accumulator;
						},
						{} as Record<string, { date: string; dateISO: Date; displayDate: string; items: ScheduleReservation[] }>,
					),
			)
				.sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime())
				.map((dateGroup) => ({
					...dateGroup,
					items: dateGroup.items.sort((a, b) => {
						const timeA = a.departureTime?.replace(".", ":") || "";
						const timeB = b.departureTime?.replace(".", ":") || "";
						return timeA.localeCompare(timeB);
					}),
				}))
		: [];

	const handleConfirm = async (item: ScheduleReservation) => {
		if (!item.confirmation.confirmData) return;

		setActionLoading(item.id);
		const success = await confirmReservation(item.confirmation.confirmData);

		if (success) {
			await refetch();
		}
		setActionLoading(null);
	};

	const handleCancel = async (item: ScheduleReservation) => {
		if (!item.confirmation.unconfirmData) return;

		if (!confirm("คุณต้องการยกเลิกการจองนี้หรือไม่?")) {
			return;
		}

		setActionLoading(item.id);
		const success = await cancelReservation(item.confirmation.unconfirmData);

		if (success) {
			await refetch();
		}
		setActionLoading(null);
	};

	if (isLoading && !schedule) {
		return <LoadingScreen />;
	}

	if (error) {
		return <ErrorScreen error={error} onRetry={refetch} />;
	}

	const subtitle = (
		<>
			{schedule?.userInfo.name && <span className="font-medium text-blue-600 dark:text-blue-400">{schedule.userInfo.name}</span>}
			{schedule?.userInfo.name && " • "}
			<span>{schedule?.totalReservations || 0} รายการ</span>
		</>
	);

	const desktopActions = (
		<>
			<ThemeToggle isDark={isDark} onToggle={toggleTheme} className="hidden md:flex" />
			{onNavigateToBooking && (
				<Button
					size="sm"
					onClick={onNavigateToBooking}
					className="hidden gap-2 bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg transition-all hover:scale-105 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl md:flex dark:from-green-500 dark:to-emerald-500">
					<Plus className="h-4 w-4" />
					จองรถ
				</Button>
			)}
			<Button variant="outline" size="sm" onClick={refetch} disabled={isLoading} className="hidden gap-2 shadow-sm hover:shadow-lg md:flex">
				<RefreshCw className={`h-4 w-4 transition-transform ${isLoading ? "animate-spin" : "hover:rotate-180"}`} />
				รีเฟรช
			</Button>
			{onNavigateToSettings && (
				<Button variant="outline" size="sm" onClick={onNavigateToSettings} className="hidden gap-2 shadow-sm hover:shadow-lg md:flex">
					<Settings className="h-4 w-4" />
					ตั้งค่า
				</Button>
			)}
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
		<Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="h-10 w-10 md:hidden">
			{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
		</Button>
	);

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
			<PageHeader
				title="รายการจองรถบัส"
				subtitle={subtitle}
				actions={
					<>
						{desktopActions}
						{mobileMenuButton}
					</>
				}
			/>

			{mobileMenuOpen && (
				<div className="container mx-auto border-b border-gray-200 bg-white/80 px-4 pb-4 backdrop-blur-md md:hidden dark:border-gray-800 dark:bg-gray-900/80">
					<div className="space-y-2">
						<Button variant="outline" size="sm" onClick={toggleTheme} className="w-full justify-start gap-2">
							{isDark ? (
								<>
									<span>โหมดสว่าง</span>
								</>
							) : (
								<>
									<span>โหมดมืด</span>
								</>
							)}
						</Button>
						{onNavigateToBooking && (
							<Button
								size="sm"
								onClick={() => {
									onNavigateToBooking();
									setMobileMenuOpen(false);
								}}
								className="w-full justify-start gap-2 bg-gradient-to-r from-green-600 to-emerald-600">
								<Plus className="h-4 w-4" />
								จองรถ
							</Button>
						)}
						<Button variant="outline" size="sm" onClick={refetch} disabled={isLoading} className="w-full justify-start gap-2">
							<RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
							รีเฟรช
						</Button>
						{onNavigateToSettings && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									onNavigateToSettings();
									setMobileMenuOpen(false);
								}}
								className="w-full justify-start gap-2">
								<Settings className="h-4 w-4" />
								ตั้งค่า
							</Button>
						)}
						<Button variant="outline" size="sm" onClick={logout} className="w-full justify-start gap-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
							<LogOut className="h-4 w-4" />
							ออกจากระบบ
						</Button>
					</div>
				</div>
			)}

			{schedule && schedule.reservations && (
				<div className="container mx-auto px-4 py-6 sm:px-6">
					<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
						<StatCard
							label="ยืนยันแล้ว"
							value={schedule.reservations.filter((r) => r.confirmation.isConfirmed).length}
							icon={CheckCircle2}
							gradient="from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"
							iconBg="bg-blue-100 dark:bg-blue-900"
							onClick={() => setFilterStatus(filterStatus === "confirmed" ? "all" : "confirmed")}
							isActive={filterStatus === "confirmed"}
						/>
						<StatCard
							label="เดินทางแล้ว"
							value={schedule.reservations.filter((r) => r.travelStatus.hasCompleted === true).length}
							icon={TrendingUp}
							gradient="from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400"
							iconBg="bg-green-100 dark:bg-green-900"
							onClick={() => setFilterStatus(filterStatus === "completed" ? "all" : "completed")}
							isActive={filterStatus === "completed"}
						/>
						<StatCard
							label="มี QR Code"
							value={schedule.reservations.filter((r) => r.ticket.hasQRCode).length}
							icon={QrCode}
							gradient="from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400"
							iconBg="bg-purple-100 dark:bg-purple-900"
							onClick={() => setFilterStatus(filterStatus === "hasQR" ? "all" : "hasQR")}
							isActive={filterStatus === "hasQR"}
						/>
						<StatCard
							label="ทั้งหมด"
							value={schedule.totalReservations}
							icon={User}
							gradient="from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400"
							iconBg="bg-orange-100 dark:bg-orange-900"
							onClick={() => setFilterStatus("all")}
							isActive={filterStatus === "all"}
						/>
					</div>
				</div>
			)}

			<div className="container mx-auto px-4 pb-8 sm:px-6">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white">รายการทั้งหมด</h2>
					<div className="flex gap-2">
						<Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")} className="gap-2">
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
								/>
							</svg>
							<span className="hidden sm:inline">กริด</span>
						</Button>
						<Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className="gap-2">
							<List className="h-4 w-4" />
							<span className="hidden sm:inline">ลิสต์</span>
						</Button>
					</div>
				</div>

				<div className="space-y-6">
					{groupedByDate && groupedByDate.length > 0 ? (
						groupedByDate.map((group) => (
							<div key={group.date} className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 shadow-lg dark:from-blue-500 dark:to-indigo-500">
										<Calendar className="h-4 w-4 text-white" />
										<span className="font-semibold text-white">{group.displayDate}</span>
										{getRelativeDay(group.date) && (
											<Badge variant="outline" className="ml-1 gap-1 border-white/30 bg-white/20 text-white">
												{getRelativeDay(group.date)}
											</Badge>
										)}
									</div>
									<div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
									<Badge variant="secondary" className="text-xs font-medium dark:bg-gray-700 dark:text-gray-300">
										{group.items.length} รอบ
									</Badge>
								</div>

								<div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
									{group.items.map((item) => (
										<ReservationCard key={item.id} item={item} actionLoading={actionLoading} onConfirm={handleConfirm} onCancel={handleCancel} />
									))}
								</div>
							</div>
						))
					) : (
						<Card className="col-span-full border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
							<CardContent className="py-16">
								<div className="space-y-4 text-center">
									<div className="flex justify-center">
										<div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
											<Calendar className="h-12 w-12 text-gray-400 dark:text-gray-600" />
										</div>
									</div>
									<div>
										<p className="text-lg font-semibold text-gray-700 dark:text-gray-300">ไม่พบรายการจอง</p>
										<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">คุณยังไม่มีรายการจองรถบัส</p>
									</div>
									{onNavigateToBooking && (
										<Button
											onClick={onNavigateToBooking}
											className="mt-4 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:from-blue-700 hover:to-indigo-700">
											<Plus className="h-4 w-4" />
											จองรถบัสเลย
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
