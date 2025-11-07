import type { ScheduleReservation } from "@cmru-comsci-66/cmru-api";
import { Calendar, CheckCircle2, LogOut, Menu, Plus, QrCode, RefreshCw, Settings, TrendingUp, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ROUTE_METADATA, ROUTES } from "../config/routes";
import { useApi } from "../contexts/api-context";
import { useSchedule } from "../hooks/use-schedule";
import { getSessionManager } from "../lib/session-manager";
import { DateSection } from "./components/date-section";
import { formatThaiDateShort, getRelativeDay } from "./components/date-utils";
import { ErrorScreen } from "./components/error-screen";
import { PageHeader } from "./components/page-header";
import { ReservationCard } from "./components/reservation-card";
import { StatCard } from "./components/stat-card";
import { ThemeToggle } from "./components/theme-toggle";

export function SchedulePage() {
	const navigate = useNavigate();
	const { logout } = useApi();
	const [currentPage, setCurrentPage] = useState(1);
	const { error, isLoading, refetch, schedule } = useSchedule(true, currentPage);
	const { cancelReservation, confirmReservation, deleteReservation } = useApi();
	const sessionManager = getSessionManager();
	const [oneClickMode, setOneClickMode] = useState(sessionManager.getOneClickEnabled());
	const [showStatistics, setShowStatistics] = useState(sessionManager.getShowStatistics());
	const [actionLoading, setActionLoading] = useState<number | null>(null);
	const [isDark, setIsDark] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [filterStatus, setFilterStatus] = useState<"all" | "confirmed" | "completed" | "hasQR">("all");
	const [qrRefreshTrigger, setQrRefreshTrigger] = useState(0);

	const handleRefresh = async () => {
		await refetch(currentPage);
		setQrRefreshTrigger((previous) => previous + 1);
	};

	useEffect(() => {
		setOneClickMode(sessionManager.getOneClickEnabled());
		setShowStatistics(sessionManager.getShowStatistics());
	}, [sessionManager]);

	useEffect(() => {
		const handleFocus = () => {
			setOneClickMode(sessionManager.getOneClickEnabled());
			setShowStatistics(sessionManager.getShowStatistics());
		};

		window.addEventListener("focus", handleFocus);
		return () => window.removeEventListener("focus", handleFocus);
	}, [sessionManager]);

	useEffect(() => {
		const theme = localStorage.getItem("theme");
		const prefersDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
		const shouldBeDark = theme === "dark" || (!theme && prefersDark);
		// eslint-disable-next-line react-hooks/set-state-in-effect
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
					.filter((item) => {
						const now = new Date();
						const today = new Date();
						today.setHours(0, 0, 0, 0);
						const itemDate = new Date(item.date);
						itemDate.setHours(0, 0, 0, 0);

						if (itemDate.getTime() !== today.getTime()) return true;

						const [hours, minutes] = (item.departureTime?.replace(".", ":") || "00:00").split(":");
						const departureTime = new Date();
						departureTime.setHours(Number.parseInt(hours || "0", 10), Number.parseInt(minutes || "0", 10), 0, 0);

						return departureTime <= now;
					})
					.reduce(
						(accumulator, item) => {
							const dateObject = new Date(item.date);
							const dateKey = dateObject.toISOString().split("T")[0];

							if (!dateKey) return accumulator;

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
				.sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime())
				.map((dateGroup) => ({
					...dateGroup,
					items: dateGroup.items.sort((a, b) => {
						const destinationA = a.destination.name.toLowerCase();
						const destinationB = b.destination.name.toLowerCase();
						const isMaeRimA = destinationA.includes("แม่ริม");
						const isMaeRimB = destinationB.includes("แม่ริม");

						if (isMaeRimA && !isMaeRimB) return -1;
						if (!isMaeRimA && isMaeRimB) return 1;

						const timeA = a.departureTime?.replace(".", ":") || "";
						const timeB = b.departureTime?.replace(".", ":") || "";
						return timeB.localeCompare(timeA);
					}),
				}))
		: [];

	const handleConfirm = async (item: ScheduleReservation) => {
		if (!item.confirmation.confirmData) return;

		setActionLoading(item.id);
		const success = await confirmReservation(item.confirmation.confirmData);

		if (success) {
			await refetch(currentPage);
			setQrRefreshTrigger((previous) => previous + 1);
		}
		setActionLoading(null);
	};

	const handleCancel = async (item: ScheduleReservation) => {
		setActionLoading(item.id);
		let success = false;

		if (item.confirmation.unconfirmData) {
			success = await cancelReservation(item.confirmation.unconfirmData);
		} else if (item.confirmation.canConfirm && item.actions.reservationId) {
			success = await deleteReservation(item.actions.reservationId);
		}

		if (success) {
			await refetch(currentPage);
			setQrRefreshTrigger((previous) => previous + 1);
		}
		setActionLoading(null);
	};

	if (error) {
		return <ErrorScreen error={error} onRetry={handleRefresh} />;
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
			<Button
				size="sm"
				onClick={() => navigate(ROUTES.BOOKING)}
				className="hidden gap-2 bg-linear-to-r from-green-600 to-emerald-600 shadow-lg transition-all hover:scale-105 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl md:flex dark:from-green-500 dark:to-emerald-500">
				<Plus className="h-4 w-4" />
				จองรถ
			</Button>
			<Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="hidden gap-2 shadow-sm hover:shadow-lg md:flex">
				<RefreshCw className={`h-4 w-4 transition-transform ${isLoading ? "animate-spin" : "hover:rotate-180"}`} />
				รีเฟรช
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
			<Button
				variant="outline"
				size="icon"
				onClick={handleRefresh}
				disabled={isLoading}
				className="h-10 w-10 rounded-full transition-all hover:scale-110 active:scale-95 md:hidden">
				<RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${isLoading ? "animate-spin" : ""}`} />
			</Button>
			<Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="h-10 w-10 transition-all hover:scale-110 active:scale-95 md:hidden">
				{mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
			</Button>
		</>
	);

	return (
		<div className="relative min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
			<Helmet>
				<title>{ROUTE_METADATA["/schedule"].title}</title>
				<meta name="description" content={ROUTE_METADATA["/schedule"].description} />
			</Helmet>
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
				<div className="animate-in slide-in-from-top-4 fade-in-0 container mx-auto border-b border-gray-200 bg-white/80 px-4 py-4 backdrop-blur-md duration-200 md:hidden dark:border-gray-800 dark:bg-gray-900/80">
					<div className="space-y-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								navigate(ROUTES.STATISTICS);
								setMobileMenuOpen(false);
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

			{showStatistics ? (
				<div className="container mx-auto px-4 py-6 sm:px-6">
					<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
						<StatCard
							label="ยืนยันแล้ว"
							value={schedule?.reservations ? schedule.reservations.filter((r) => r.confirmation.isConfirmed).length : 0}
							icon={CheckCircle2}
							gradient="from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"
							iconBg="bg-blue-100 dark:bg-blue-900"
							onClick={() => setFilterStatus(filterStatus === "confirmed" ? "all" : "confirmed")}
							isActive={filterStatus === "confirmed"}
							isLoading={isLoading}
						/>
						<StatCard
							label="เดินทางแล้ว"
							value={schedule?.reservations ? schedule.reservations.filter((r) => r.travelStatus.hasCompleted === true).length : 0}
							icon={TrendingUp}
							gradient="from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400"
							iconBg="bg-green-100 dark:bg-green-900"
							onClick={() => setFilterStatus(filterStatus === "completed" ? "all" : "completed")}
							isActive={filterStatus === "completed"}
							isLoading={isLoading}
						/>
						<StatCard
							label="มี QR Code"
							value={schedule?.reservations ? schedule.reservations.filter((r) => r.ticket.hasQRCode).length : 0}
							icon={QrCode}
							gradient="from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400"
							iconBg="bg-purple-100 dark:bg-purple-900"
							onClick={() => setFilterStatus(filterStatus === "hasQR" ? "all" : "hasQR")}
							isActive={filterStatus === "hasQR"}
							isLoading={isLoading}
						/>
						<StatCard
							label="ทั้งหมด"
							value={schedule?.totalReservations || 0}
							icon={User}
							gradient="from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400"
							iconBg="bg-orange-100 dark:bg-orange-900"
							onClick={() => setFilterStatus("all")}
							isActive={filterStatus === "all"}
							isLoading={isLoading}
						/>
					</div>
				</div>
			) : (
				<div className="py-2"></div>
			)}

			{schedule &&
				schedule.reservations &&
				(() => {
					const now = new Date();
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const todayReservations = schedule.reservations
						.filter((item) => {
							const itemDate = new Date(item.date);
							itemDate.setHours(0, 0, 0, 0);
							if (itemDate.getTime() !== today.getTime()) return false;
							const [hours, minutes] = (item.departureTime?.replace(".", ":") || "00:00").split(":");
							const departureTime = new Date();
							departureTime.setHours(Number.parseInt(hours || "0", 10), Number.parseInt(minutes || "0", 10), 0, 0);

							return departureTime > now;
						})
						.sort((a, b) => {
							const destinationA = a.destination.name.toLowerCase();
							const destinationB = b.destination.name.toLowerCase();
							const isMaeRimA = destinationA.includes("แม่ริม");
							const isMaeRimB = destinationB.includes("แม่ริม");

							if (isMaeRimA && !isMaeRimB) return -1;
							if (!isMaeRimA && isMaeRimB) return 1;

							const timeA = a.departureTime?.replace(".", ":") || "";
							const timeB = b.departureTime?.replace(".", ":") || "";
							return timeB.localeCompare(timeA);
						});

					if (todayReservations.length === 0) return null;

					return (
						<div className="container mx-auto px-4 pb-8 sm:px-6">
							<div className="mb-4">
								<h2 className="text-lg font-semibold text-gray-900 dark:text-white">รายการจองในวันนี้</h2>
								<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{todayReservations.length} รายการ</p>
							</div>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{todayReservations.map((item) => (
									<ReservationCard
										key={item.id}
										item={item}
										actionLoading={actionLoading}
										onConfirm={handleConfirm}
										onCancel={handleCancel}
										oneClickMode={oneClickMode}
										showTimeLeft={true}
										refreshTrigger={qrRefreshTrigger}
									/>
								))}
							</div>
						</div>
					);
				})()}

			<div className="container mx-auto px-4 pb-8 sm:px-6">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white">รายการจองทั้งหมด</h2>
						{groupedByDate && groupedByDate.length > 0 && (
							<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
								{(() => {
									const currentPageData = groupedByDate;
									if (currentPageData.length === 0 || !currentPageData[0]) return null;
									const firstDate = new Date(currentPageData[0].dateISO);
									const buddhistYear = firstDate.getFullYear() + 543;
									const currentYear = new Date().getFullYear() + 543;

									if (buddhistYear === currentYear) {
										return null;
									}
									return `ใน ปี ${buddhistYear}`;
								})()}
							</p>
						)}
					</div>
				</div>

				<div className="space-y-6">
					{isLoading && !groupedByDate ? (
						<>
							{Array.from({ length: 3 }).map((_, index) => (
								<DateSection key={index} isLoading={true} />
							))}
						</>
					) : groupedByDate && groupedByDate.length > 0 ? (
						<>
							{groupedByDate.map((group) => (
								<div key={group.date} className="space-y-4">
									<div className="flex items-center gap-3">
										<div className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2.5 shadow-md dark:bg-gray-700">
											<Calendar className="h-4 w-4 text-gray-800 dark:text-gray-200" />
											<span className="font-semibold text-gray-900 dark:text-white">{group.displayDate}</span>
											{getRelativeDay(group.date) && (
												<Badge variant="outline" className="ml-1 gap-1 border-gray-400 bg-white text-gray-800 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-200">
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
											<ReservationCard
												key={item.id}
												item={item}
												actionLoading={actionLoading}
												onConfirm={handleConfirm}
												onCancel={handleCancel}
												oneClickMode={oneClickMode}
												refreshTrigger={qrRefreshTrigger}
											/>
										))}
									</div>
								</div>
							))}

							{schedule && schedule.totalPages > 0 && (
								<div className="flex flex-col items-center gap-3 pt-6">
									<div className="hidden items-center gap-2 md:flex">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
											disabled={!schedule.hasPrevPage || isLoading}
											className="gap-2">
											ก่อนหน้า
										</Button>
										<div className="flex gap-1">
											{Array.from({ length: schedule.totalPages }, (_, index) => (
												<Button
													key={index + 1}
													variant={currentPage === index + 1 ? "default" : "outline"}
													size="sm"
													onClick={() => setCurrentPage(index + 1)}
													disabled={isLoading}
													className={`min-w-10 ${currentPage === index + 1 ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500" : ""}`}>
													{index + 1}
												</Button>
											))}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage((previous) => Math.min(schedule.totalPages, previous + 1))}
											disabled={!schedule.hasNextPage || isLoading}
											className="gap-2">
											ถัดไป
										</Button>
									</div>

									<div className="flex w-full items-center gap-2 md:hidden">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
											disabled={!schedule.hasPrevPage || isLoading}
											className="shrink-0">
											ก่อนหน้า
										</Button>
										<div className="scrollbar-hide flex flex-1 gap-1 overflow-x-auto px-1">
											{(() => {
												const pages = [];
												const totalPages = schedule.totalPages;
												const current = currentPage;

												if (current > 3) {
													pages.push(1);
													if (current > 4) pages.push("...");
												}

												for (let index = Math.max(1, current - 2); index <= Math.min(totalPages, current + 2); index++) {
													pages.push(index);
												}

												if (current < totalPages - 2) {
													if (current < totalPages - 3) pages.push("...");
													pages.push(totalPages);
												}

												return pages.map((page, index) =>
													page === "..." ? (
														<span key={`ellipsis-${index}`} className="flex min-w-10 items-center justify-center text-gray-500">
															...
														</span>
													) : (
														<Button
															key={page}
															variant={currentPage === page ? "default" : "outline"}
															size="sm"
															onClick={() => setCurrentPage(page as number)}
															disabled={isLoading}
															className={`min-w-10 shrink-0 ${currentPage === page ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500" : ""}`}>
															{page}
														</Button>
													),
												);
											})()}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage((previous) => Math.min(schedule.totalPages, previous + 1))}
											disabled={!schedule.hasNextPage || isLoading}
											className="shrink-0">
											ถัดไป
										</Button>
									</div>
									<div className="text-sm text-gray-600 dark:text-gray-400">
										หน้า {currentPage} จาก {schedule.totalPages}
									</div>
								</div>
							)}
						</>
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
									<Button
										onClick={() => navigate(ROUTES.BOOKING)}
										className="mt-4 gap-2 bg-linear-to-r from-blue-600 to-indigo-600 shadow-lg hover:from-blue-700 hover:to-indigo-700">
										<Plus className="h-4 w-4" />
										จองรถบัสเลย
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
