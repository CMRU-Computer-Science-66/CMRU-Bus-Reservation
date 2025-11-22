import {
	ArrowLeft,
	Bell,
	BellOff,
	Bus,
	Calendar,
	Check,
	ChevronDown,
	Clock,
	Github,
	Globe,
	LogOut,
	Menu,
	Moon,
	Palette,
	Settings,
	Sun,
	Tag,
	TrendingUp,
	User,
	UserCheck,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { BASE_URL, EXTERNAL_URLS, ROUTE_METADATA, ROUTES } from "../config/routes";
import { useApi } from "../contexts/api-context";
import { useMobileMenu } from "../hooks/use-mobile-menu";
import { useSession } from "../hooks/use-session";
import { useTheme } from "../hooks/use-theme";

export function SettingsPage() {
	const navigate = useNavigate();
	const { logout } = useApi();
	const { handleThemeChange, isDark, themeMode } = useTheme();
	const { handleTimeFormatChange, oneClickEnabled, showStatistics, timeFormat, toggleOneClick, toggleShowStatistics, username } = useSession();
	const { closeMobileMenu, getMobileMenuClasses, mobileMenuOpen, toggleMobileMenu } = useMobileMenu();
	const [apiVersion, setApiVersion] = useState<string>("...");
	const [contributors, setContributors] = useState<Array<{ avatar_url: string; html_url: string; login: string }>>([]);
	const [showAllContributors, setShowAllContributors] = useState(false);

	useEffect(() => {
		fetch(`${BASE_URL}/api`)
			.then((response) => response.json())
			.then((data) => {
				if (data.version) {
					setApiVersion(data.version);
				}
			})
			.catch(() => {
				setApiVersion("N/A");
			});

		fetch(`https://api.github.com/repos/${EXTERNAL_URLS.GITHUB_REPO.split("github.com/")[1]}/contributors`)
			.then((response) => response.json())
			.then((data) => {
				if (Array.isArray(data)) {
					setContributors(data);
				}
			})
			.catch(() => {});
	}, []);

	return (
		<div className="bg-app-gradient min-h-screen">
			<Helmet>
				<title>{ROUTE_METADATA["/settings"].title}</title>
				<meta name="description" content={ROUTE_METADATA["/schedule"].description} />
			</Helmet>
			<div className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
				<div className="container mx-auto px-4 py-4 sm:px-6">
					<div className="flex items-center justify-between gap-4">
						<div className="flex min-w-0 flex-1 items-center gap-3">
							<div className="bg-header-gradient rounded-xl p-2 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl">
								<Settings className="h-5 w-5 text-white sm:h-6 sm:w-6" />
							</div>
							<div className="min-w-0 flex-1">
								<h1 className="text-primary-bold truncate text-lg font-bold sm:text-xl">ตั้งค่า</h1>
								<p className="text-secondary truncate text-xs sm:text-sm">จัดการการตั้งค่าและข้อมูลส่วนตัว</p>
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							<Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.SCHEDULE)} className="h-10 w-10 shrink-0 rounded-full hover:scale-110">
								<ArrowLeft className="h-5 w-5" />
							</Button>
							<Button variant="outline" size="sm" onClick={() => navigate(ROUTES.SCHEDULE)} className="hidden gap-2 shadow-sm hover:shadow-lg md:flex">
								<Calendar className="h-4 w-4" />
								รายการจอง
							</Button>
							<Button variant="outline" size="sm" onClick={() => navigate(ROUTES.BOOKING)} className="hidden gap-2 shadow-sm hover:shadow-lg md:flex">
								<Bus className="h-4 w-4" />
								จองรถบัส
							</Button>
							<Button variant="outline" size="sm" onClick={() => navigate(ROUTES.STATISTICS)} className="hidden gap-2 shadow-sm hover:shadow-lg md:flex">
								<TrendingUp className="h-4 w-4" />
								สถิติ
							</Button>
							<Button variant="outline" size="sm" onClick={logout} className="hover-red-soft hidden gap-2 shadow-sm hover:shadow-lg md:flex">
								<LogOut className="h-4 w-4" />
								ออกจากระบบ
							</Button>
							<Button variant="outline" size="icon" onClick={toggleMobileMenu} className="h-10 w-10 transition-all hover:scale-110 active:scale-95 md:hidden">
								{mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
							</Button>
						</div>
					</div>
				</div>
			</div>

			{mobileMenuOpen && (
				<div
					className={`sticky top-[73px] z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md transition-all duration-200 md:hidden dark:border-gray-800 dark:bg-gray-900/80 ${getMobileMenuClasses()}`}>
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
								รายการจองรถบัส
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									navigate(ROUTES.BOOKING);
									closeMobileMenu();
								}}
								className="w-full justify-start gap-2">
								<Bus className="h-4 w-4" />
								จองรถบัส
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
								สถิติการเดินทาง
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									logout();
									closeMobileMenu();
								}}
								className="hover-red-soft w-full justify-start gap-2">
								<LogOut className="h-4 w-4" />
								ออกจากระบบ
							</Button>
						</div>
					</div>
				</div>
			)}

			<div className="container mx-auto max-w-5xl px-3 py-4 sm:px-4">
				<div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
					<Card className="border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
						<CardHeader>
							<div className="flex items-center gap-2">
								<div className="bg-icon-blue rounded-full p-2">
									<User className="text-icon-blue h-4 w-4" />
								</div>
								<div>
									<CardTitle className="text-base">ข้อมูลผู้ใช้</CardTitle>
									<CardDescription className="text-sm">ข้อมูลบัญชีของคุณ</CardDescription>
								</div>
							</div>
						</CardHeader>
						<Separator className="separator-dark" />
						<CardContent>
							{username ? (
								<div className="flex items-center justify-between">
									<div>
										<p className="text-secondary text-sm font-medium">รหัสนักศึกษา</p>
										<p className="text-primary-bold mt-1 text-base font-semibold">{username}</p>
									</div>
								</div>
							) : (
								<div className="py-4 text-center">
									<p className="text-secondary-muted">ไม่พบข้อมูลผู้ใช้</p>
								</div>
							)}
						</CardContent>
					</Card>
					<Card className="border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
						<CardHeader>
							<div className="flex items-center gap-2">
								<div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900">
									<Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
								</div>
								<div>
									<CardTitle className="text-base">การจองอัตโนมัติ</CardTitle>
									<CardDescription className="text-sm">ยืนยันหรือยกเลิกการจองแบบคลิกเดียว</CardDescription>
								</div>
							</div>
						</CardHeader>
						<Separator className="separator-dark" />
						<CardContent>
							<button
								type="button"
								onClick={toggleOneClick}
								className="separator-dark flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600">
								<div className="flex items-center gap-2">
									<div className={`rounded-full p-1.5 ${oneClickEnabled ? "bg-indigo-100 dark:bg-indigo-900" : "bg-gray-100 dark:bg-gray-700"}`}>
										<Check className={`h-4 w-4 ${oneClickEnabled ? "text-indigo-600 dark:text-indigo-400" : "text-secondary"}`} />
									</div>
									<div className="text-left">
										<div className="flex items-center gap-2">
											<p className="text-primary-bold text-sm font-semibold">โหมดคลิกเดียว</p>
											<Badge variant="secondary" className="h-4 px-1 py-0 text-[9px] font-medium">
												ใหม่
											</Badge>
										</div>
										<p className="text-secondary text-xs">{oneClickEnabled ? "จองและยืนยัน / ยกเลิก ในคลิกเดียว" : "ต้องกดยืนยันหรือยกเลิก 2 รอบ (ปกติ)"}</p>
									</div>
								</div>
								<Badge variant={oneClickEnabled ? "default" : "secondary"} className={oneClickEnabled ? "bg-indigo-600 dark:bg-indigo-500" : ""}>
									{oneClickEnabled ? "เปิด" : "ปิด"}
								</Badge>
							</button>
						</CardContent>
					</Card>
					<Card className="border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
						<CardHeader>
							<div className="flex items-center gap-2">
								<div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
									<TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
								</div>
								<div>
									<CardTitle className="text-base">การแสดง Statistics</CardTitle>
									<CardDescription className="text-sm">เลือกแสดงหรือซ่อนส่วน Statistics ในหน้าต่างๆ</CardDescription>
								</div>
							</div>
						</CardHeader>
						<Separator className="separator-dark" />
						<CardContent>
							<button
								type="button"
								onClick={toggleShowStatistics}
								className="separator-dark flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600">
								<div className="flex items-center gap-2">
									<div className={`rounded-full p-1.5 ${showStatistics ? "bg-green-100 dark:bg-green-900" : "bg-gray-100 dark:bg-gray-700"}`}>
										<TrendingUp className={`h-4 w-4 ${showStatistics ? "text-green-600 dark:text-green-400" : "text-secondary"}`} />
									</div>
									<div className="text-left">
										<div className="flex items-center gap-2">
											<p className="text-primary-bold text-sm font-semibold">แสดง Statistics</p>
										</div>
										<p className="text-secondary text-xs">{showStatistics ? "แสดงข้อมูลสถิติในหน้า Schedule และ Booking" : "ซ่อนข้อมูลสถิติในหน้าต่างๆ"}</p>
									</div>
								</div>
								<Badge variant={showStatistics ? "default" : "secondary"} className={showStatistics ? "bg-green-600 dark:bg-green-500" : ""}>
									{showStatistics ? "เปิด" : "ปิด"}
								</Badge>
							</button>
						</CardContent>
					</Card>
					<Card className="border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
						<CardHeader>
							<div className="flex items-center gap-2">
								<div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900">
									<Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
								</div>
								<div>
									<CardTitle className="text-base">รูปแบบเวลา</CardTitle>
									<CardDescription className="text-sm">เลือกวิธีแสดงเวลาที่คุณต้องการ</CardDescription>
								</div>
							</div>
						</CardHeader>
						<Separator className="separator-dark" />
						<CardContent className="space-y-2">
							<button
								type="button"
								onClick={() => handleTimeFormatChange("thai")}
								className="group separator-dark flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600"
								style={timeFormat === "thai" ? { borderColor: "rgb(37 99 235)", backgroundColor: isDark ? "rgb(30 41 59)" : "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-2">
									<div className="rounded-full bg-orange-100 p-1.5 dark:bg-orange-900">
										<Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
									</div>
									<div className="text-left">
										<div className="flex items-center gap-2">
											<p className="text-primary-bold text-sm font-semibold">แบบไทยแท้</p>
											<Badge variant="secondary" className="h-4 px-1 py-0 text-[9px] font-medium">
												ทดลอง
											</Badge>
										</div>
										<p className="text-secondary text-xs">แสดงเวลาแบบ บ่ายโมง, บ่าย 2 โมงครึ่ง</p>
									</div>
								</div>
								{timeFormat === "thai" && (
									<div className="rounded-full bg-blue-600 p-1">
										<Check className="h-4 w-4 text-white" />
									</div>
								)}
							</button>

							<button
								type="button"
								onClick={() => handleTimeFormatChange("24hour")}
								className="group separator-dark flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600"
								style={timeFormat === "24hour" ? { borderColor: "rgb(37 99 235)", backgroundColor: isDark ? "rgb(30 41 59)" : "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-2">
									<div className="rounded-full bg-blue-100 p-1.5 dark:bg-blue-900">
										<Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
									</div>
									<div className="text-left">
										<p className="text-primary-bold text-sm font-semibold">24 ชั่วโมง</p>
										<p className="text-secondary text-xs">แสดงเวลาแบบ 13:00, 14:30</p>
									</div>
								</div>
								{timeFormat === "24hour" && (
									<div className="rounded-full bg-blue-600 p-1">
										<Check className="h-4 w-4 text-white" />
									</div>
								)}
							</button>
						</CardContent>
					</Card>
					<Card className="border-0 bg-white/90 shadow-md backdrop-blur-md md:col-span-2 dark:bg-gray-900/90">
						<CardHeader>
							<div className="flex items-center gap-2">
								<div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
									<Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
								</div>
								<div>
									<CardTitle className="text-base">ธีม</CardTitle>
									<CardDescription className="text-sm">เลือกธีมที่คุณชอบ</CardDescription>
								</div>
							</div>
						</CardHeader>
						<Separator className="separator-dark" />
						<CardContent className="grid space-y-3 md:grid-cols-3 md:gap-4 md:space-y-0">
							<button
								type="button"
								onClick={() => handleThemeChange("light")}
								className="group separator-dark flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600"
								style={themeMode === "light" ? { borderColor: "rgb(37 99 235)", backgroundColor: "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-2">
									<div className="rounded-full bg-yellow-100 p-1.5 dark:bg-yellow-900">
										<Sun className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
									</div>
									<div className="text-left">
										<p className="text-primary-bold text-sm font-semibold">โหมดสว่าง</p>
										<p className="text-secondary text-xs">ใช้ธีมสว่างตลอดเวลา</p>
									</div>
								</div>
								{themeMode === "light" && (
									<div className="rounded-full bg-blue-600 p-1">
										<Check className="h-4 w-4 text-white" />
									</div>
								)}
							</button>

							<button
								type="button"
								onClick={() => handleThemeChange("dark")}
								className="group separator-dark flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600"
								style={themeMode === "dark" ? { borderColor: "rgb(37 99 235)", backgroundColor: isDark ? "rgb(30 41 59)" : "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-2">
									<div className="rounded-full bg-indigo-100 p-1.5 dark:bg-indigo-900">
										<Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
									</div>
									<div className="text-left">
										<div className="flex items-center gap-2">
											<p className="text-primary-bold text-sm font-semibold">โหมดมืด</p>
											<Badge variant="secondary" className="h-4 px-1 py-0 text-[9px] font-medium">
												ทดลอง
											</Badge>
										</div>
										<p className="text-secondary text-xs">ใช้ธีมมืดตลอดเวลา</p>
									</div>
								</div>
								{themeMode === "dark" && (
									<div className="rounded-full bg-blue-600 p-1">
										<Check className="h-4 w-4 text-white" />
									</div>
								)}
							</button>

							<button
								type="button"
								onClick={() => handleThemeChange("system")}
								className="group separator-dark flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600"
								style={themeMode === "system" ? { borderColor: "rgb(37 99 235)", backgroundColor: isDark ? "rgb(30 41 59)" : "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-2">
									<div className="rounded-full bg-gray-100 p-1.5 dark:bg-gray-700">
										<Globe className="text-secondary h-4 w-4" />
									</div>
									<div className="text-left">
										<p className="text-primary-bold text-sm font-semibold">ตามระบบ</p>
										<p className="text-secondary text-xs">ปรับตามการตั้งค่าของอุปกรณ์</p>
									</div>
								</div>
								{themeMode === "system" && (
									<div className="rounded-full bg-blue-600 p-1">
										<Check className="h-4 w-4 text-white" />
									</div>
								)}
							</button>
						</CardContent>
					</Card>

					<Card className="border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
						<CardHeader>
							<div className="flex items-center gap-2">
								<div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
									<Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
								</div>
								<div>
									<CardTitle className="text-base">การแจ้งเตือน</CardTitle>
									<CardDescription className="text-sm">จัดการการแจ้งเตือนของคุณ</CardDescription>
								</div>
							</div>
						</CardHeader>
						<Separator className="separator-dark" />
						<CardContent>
							<button
								type="button"
								disabled
								className="separator-dark flex w-full cursor-not-allowed items-center justify-between rounded-lg border-2 border-gray-200 bg-gray-50 p-3 opacity-60 dark:border-gray-700/50">
								<div className="flex items-center gap-2">
									<div className="rounded-full bg-gray-100 p-1.5 dark:bg-gray-700">
										<BellOff className="text-secondary h-4 w-4" />
									</div>
									<div className="text-left">
										<div className="flex items-center gap-2">
											<p className="text-primary-bold text-sm font-semibold">การแจ้งเตือนทั่วไป</p>
											<Badge variant="secondary" className="h-4 px-1 py-0 text-[9px] font-medium">
												ยังไม่พร้อม
											</Badge>
										</div>
										<p className="text-secondary text-xs">รับการแจ้งเตือนเกี่ยวกับการจองและรอบรถ</p>
									</div>
								</div>
								<Badge variant="secondary">ปิด</Badge>
							</button>
						</CardContent>
					</Card>

					<Card className="border-0 bg-white/90 shadow-md backdrop-blur-md md:col-span-2 dark:bg-gray-900/90">
						<CardHeader>
							<div className="flex items-center gap-2">
								<div className="rounded-full bg-gray-100 p-2 dark:bg-gray-700">
									<Settings className="text-secondary h-4 w-4" />
								</div>
								<div>
									<CardTitle className="text-base">เกี่ยวกับ</CardTitle>
									<CardDescription className="text-sm">ข้อมูลการพัฒนา</CardDescription>
								</div>
							</div>
						</CardHeader>
						<Separator className="separator-dark" />
						<CardContent className="space-y-4">
							{/* <div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Briefcase className="text-secondary h-4 w-4" />
									<p className="text-secondary text-sm font-medium">ชื่อ Project</p>
								</div>
								<p className="text-primary-bold text-base font-semibold">CMRU Bus Reservation</p>
							</div>
							<Separator className="separator-dark" /> */}

							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Github className="text-secondary h-4 w-4" />
									<p className="text-secondary text-sm font-medium">GitHub</p>
								</div>
								<a
									href={EXTERNAL_URLS.GITHUB_REPO}
									target="_blank"
									rel="noopener noreferrer"
									className="font-mono text-sm text-blue-600 hover:underline dark:text-blue-400">
									CMRU-Bus-Reservation
								</a>
							</div>
							<Separator className="separator-dark" />
							<div>
								<button onClick={() => setShowAllContributors(!showAllContributors)} className="flex w-full items-center justify-between">
									<div className="flex items-center gap-2">
										<UserCheck className="text-secondary h-4 w-4" />
										<p className="text-secondary text-sm font-medium">พัฒนาโดย</p>
									</div>
									<div className="flex items-center gap-2">
										<div className="flex -space-x-2">
											{contributors.length > 0 ? (
												contributors
													.slice(0, 3)
													.map((contributor) => (
														<img
															key={contributor.login}
															src={contributor.avatar_url}
															alt={contributor.login}
															className="h-6 w-6 rounded-full border-2 border-white dark:border-gray-900"
														/>
													))
											) : (
												<img
													src="https://avatars.githubusercontent.com/u/191374469?s=200&v=4"
													alt="CMRU Computer Science 66"
													className="h-6 w-6 rounded-full border-2 border-white dark:border-gray-900"
												/>
											)}
										</div>
										{contributors.length > 3 && <span className="text-secondary text-xs font-medium">+{contributors.length - 3}</span>}
										<ChevronDown className={`h-4 w-4 text-gray-600 transition-transform dark:text-gray-400 ${showAllContributors ? "rotate-180" : ""}`} />
									</div>
								</button>
								{showAllContributors && (
									<div className="animate-in slide-in-from-top-2 fade-in-0 mt-3 border-t pt-3 duration-200 dark:border-gray-800">
										<div className="space-y-2">
											{contributors.length > 0 ? (
												contributors.map((contributor) => (
													<a
														key={contributor.login}
														href={contributor.html_url}
														target="_blank"
														rel="noopener noreferrer"
														className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
														<img
															src={contributor.avatar_url}
															alt={contributor.login}
															className="h-8 w-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
														/>
														<span className="text-primary-bold text-sm font-medium">{contributor.login}</span>
													</a>
												))
											) : (
												<a
													href={EXTERNAL_URLS.GITHUB_ORG}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
													<img
														src="https://avatars.githubusercontent.com/u/191374469?s=200&v=4"
														alt="CMRU Computer Science 66"
														className="h-8 w-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
													/>
													<span className="text-primary-bold text-sm font-medium">CMRU Computer Science 66</span>
												</a>
											)}
										</div>
									</div>
								)}
							</div>

							<Separator className="separator-dark" />
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Tag className="text-secondary h-4 w-4" />
									<p className="text-secondary text-sm font-medium">เวอร์ชัน API</p>
								</div>
								<a href={EXTERNAL_URLS.API_REPO} target="_blank" rel="noopener noreferrer">
									<Badge variant="outline" className="cursor-pointer font-mono transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
										{apiVersion}
									</Badge>
								</a>
							</div>
							<Separator className="separator-dark" />
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Tag className="text-secondary h-4 w-4" />
									<p className="text-secondary text-sm font-medium">เวอร์ชัน Web</p>
								</div>
								<a href={EXTERNAL_URLS.GITHUB_REPO} target="_blank" rel="noopener noreferrer">
									<Badge variant="outline" className="cursor-pointer font-mono transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
										{process.env.NODE_ENV === "production" ? process.env.APP_VERSION || "Development" : "local"}
									</Badge>
								</a>
							</div>
						</CardContent>
					</Card>

					<Card className="border-0 border-red-200 bg-white/90 shadow-md backdrop-blur-md md:col-span-2 dark:border-red-900 dark:bg-gray-900/90">
						<CardContent className="p-4">
							<div className="hidden md:block">
								<Button
									onClick={logout}
									variant="destructive"
									size="default"
									className="h-10 w-full gap-2 text-sm font-semibold shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]">
									<LogOut className="h-4 w-4" />
									ออกจากระบบ
								</Button>
							</div>
							<div className="block md:hidden">
								<p className="text-secondary text-center text-sm">
									ใช้เมนู <Menu className="inline h-4 w-4" /> ด้านบนเพื่อออกจากระบบ
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
