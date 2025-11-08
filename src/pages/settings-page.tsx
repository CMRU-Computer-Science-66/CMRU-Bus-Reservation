import { ArrowLeft, Bell, BellOff, Check, ChevronDown, Clock, Github, Globe, LogOut, Moon, Palette, Settings, Sun, Tag, TrendingUp, User, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { BASE_URL, EXTERNAL_URLS, ROUTE_METADATA, ROUTES } from "../config/routes";
import { useApi } from "../contexts/api-context";
import { getSessionManager } from "../lib/session-manager";

type ThemeMode = "light" | "dark" | "system";
type TimeFormat = "24hour" | "thai";
const sessionManager = getSessionManager();

export function SettingsPage() {
	const navigate = useNavigate();
	const { logout } = useApi();
	const [username, setUsername] = useState<string>("");
	const [apiVersion, setApiVersion] = useState<string>("loading...");
	const [contributors, setContributors] = useState<Array<{ avatar_url: string; html_url: string; login: string }>>([]);
	const [showAllContributors, setShowAllContributors] = useState(false);
	const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
		const theme = localStorage.getItem("theme") as ThemeMode | null;
		return theme || "light";
	});
	const [isDark, setIsDark] = useState(() => {
		const theme = localStorage.getItem("theme") as ThemeMode | null;
		const prefersDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
		return theme === "dark" || (theme === "system" && prefersDark);
	});
	const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
		const format = localStorage.getItem("timeFormat") as TimeFormat | null;
		return format || "thai";
	});
	const [oneClickEnabled, setOneClickEnabled] = useState(() => {
		return sessionManager.getOneClickEnabled();
	});
	const [showStatistics, setShowStatistics] = useState(() => {
		return sessionManager.getShowStatistics();
	});

	useEffect(() => {
		const session = sessionManager.loadSession();
		if (session?.username) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setUsername(session.username);
		}

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

	useEffect(() => {
		document.documentElement.classList.toggle("dark", isDark);
	}, [isDark]);

	const handleThemeChange = (mode: ThemeMode) => {
		setThemeMode(mode);
		localStorage.setItem("theme", mode);
		const prefersDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
		const shouldBeDark = mode === "dark" || (mode === "system" && prefersDark);
		setIsDark(shouldBeDark);
	};

	const handleTimeFormatChange = (format: TimeFormat) => {
		setTimeFormat(format);
		localStorage.setItem("timeFormat", format);
	};

	const toggleOneClick = () => {
		const isOneClickEnabled = !oneClickEnabled;
		setOneClickEnabled(isOneClickEnabled);
		sessionManager.setOneClickEnabled(isOneClickEnabled);
	};

	const toggleShowStatistics = () => {
		const isShowStatistics = !showStatistics;
		setShowStatistics(isShowStatistics);
		sessionManager.setShowStatistics(isShowStatistics);
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
			<Helmet>
				<title>{ROUTE_METADATA["/settings"].title}</title>
				<meta name="description" content={ROUTE_METADATA["/schedule"].description} />
			</Helmet>
			<div className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
				<div className="container mx-auto px-4 py-4 sm:px-6">
					<div className="flex items-center justify-between gap-4">
						<div className="flex min-w-0 flex-1 items-center gap-3">
							<Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.SCHEDULE)} className="h-10 w-10 shrink-0 rounded-full hover:scale-110">
								<ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
							</Button>
							<div className="rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 p-2 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl">
								<Settings className="h-5 w-5 text-white sm:h-6 sm:w-6" />
							</div>
							<div className="min-w-0 flex-1">
								<h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl dark:text-white">ตั้งค่า</h1>
								<p className="truncate text-xs text-gray-600 sm:text-sm dark:text-gray-400">จัดการการตั้งค่าและข้อมูลส่วนตัว</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="container mx-auto max-w-5xl px-3 py-4 sm:px-4">
				<div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
					<Card className="border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
						<CardHeader>
							<div className="flex items-center gap-2">
								<div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
									<User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
								</div>
								<div>
									<CardTitle className="text-base">ข้อมูลผู้ใช้</CardTitle>
									<CardDescription className="text-sm">ข้อมูลบัญชีของคุณ</CardDescription>
								</div>
							</div>
						</CardHeader>
						<Separator className="dark:bg-gray-800" />
						<CardContent>
							{username ? (
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">รหัสนักศึกษา</p>
										<p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{username}</p>
									</div>
								</div>
							) : (
								<div className="py-4 text-center">
									<p className="text-gray-500 dark:text-gray-400">ไม่พบข้อมูลผู้ใช้</p>
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
						<Separator className="dark:bg-gray-800" />
						<CardContent>
							<button
								type="button"
								onClick={toggleOneClick}
								className="flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600">
								<div className="flex items-center gap-2">
									<div className={`rounded-full p-1.5 ${oneClickEnabled ? "bg-indigo-100 dark:bg-indigo-900" : "bg-gray-100 dark:bg-gray-700"}`}>
										<Check className={`h-4 w-4 ${oneClickEnabled ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400"}`} />
									</div>
									<div className="text-left">
										<div className="flex items-center gap-2">
											<p className="text-sm font-semibold text-gray-900 dark:text-white">โหมดคลิกเดียว</p>
											<Badge variant="secondary" className="h-4 px-1 py-0 text-[9px] font-medium">
												ใหม่
											</Badge>
										</div>
										<p className="text-xs text-gray-600 dark:text-gray-400">
											{oneClickEnabled ? "จองและยืนยัน / ยกเลิก ในคลิกเดียว" : "ต้องกดยืนยันหรือยกเลิก 2 รอบ (ปกติ)"}
										</p>
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
						<Separator className="dark:bg-gray-800" />
						<CardContent>
							<button
								type="button"
								onClick={toggleShowStatistics}
								className="flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600">
								<div className="flex items-center gap-2">
									<div className={`rounded-full p-1.5 ${showStatistics ? "bg-green-100 dark:bg-green-900" : "bg-gray-100 dark:bg-gray-700"}`}>
										<TrendingUp className={`h-4 w-4 ${showStatistics ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`} />
									</div>
									<div className="text-left">
										<div className="flex items-center gap-2">
											<p className="text-sm font-semibold text-gray-900 dark:text-white">แสดง Statistics</p>
										</div>
										<p className="text-xs text-gray-600 dark:text-gray-400">
											{showStatistics ? "แสดงข้อมูลสถิติในหน้า Schedule และ Booking" : "ซ่อนข้อมูลสถิติในหน้าต่างๆ"}
										</p>
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
						<Separator className="dark:bg-gray-800" />
						<CardContent className="space-y-2">
							<button
								type="button"
								onClick={() => handleTimeFormatChange("thai")}
								className="group flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
								style={timeFormat === "thai" ? { borderColor: "rgb(37 99 235)", backgroundColor: isDark ? "rgb(30 41 59)" : "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-2">
									<div className="rounded-full bg-orange-100 p-1.5 dark:bg-orange-900">
										<Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
									</div>
									<div className="text-left">
										<div className="flex items-center gap-2">
											<p className="text-sm font-semibold text-gray-900 dark:text-white">แบบไทยแท้</p>
											<Badge variant="secondary" className="h-4 px-1 py-0 text-[9px] font-medium">
												ทดลอง
											</Badge>
										</div>
										<p className="text-xs text-gray-600 dark:text-gray-400">แสดงเวลาแบบ บ่ายโมง, บ่าย 2 โมงครึ่ง</p>
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
								className="group flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
								style={timeFormat === "24hour" ? { borderColor: "rgb(37 99 235)", backgroundColor: isDark ? "rgb(30 41 59)" : "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-2">
									<div className="rounded-full bg-blue-100 p-1.5 dark:bg-blue-900">
										<Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
									</div>
									<div className="text-left">
										<p className="text-sm font-semibold text-gray-900 dark:text-white">24 ชั่วโมง</p>
										<p className="text-xs text-gray-600 dark:text-gray-400">แสดงเวลาแบบ 13:00, 14:30</p>
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
						<Separator className="dark:bg-gray-800" />
						<CardContent className="grid space-y-3 md:grid-cols-3 md:gap-4 md:space-y-0">
							<button
								type="button"
								onClick={() => handleThemeChange("light")}
								className="group flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
								style={themeMode === "light" ? { borderColor: "rgb(37 99 235)", backgroundColor: "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-2">
									<div className="rounded-full bg-yellow-100 p-1.5 dark:bg-yellow-900">
										<Sun className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
									</div>
									<div className="text-left">
										<p className="text-sm font-semibold text-gray-900 dark:text-white">โหมดสว่าง</p>
										<p className="text-xs text-gray-600 dark:text-gray-400">ใช้ธีมสว่างตลอดเวลา</p>
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
								className="group flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
								style={themeMode === "dark" ? { borderColor: "rgb(37 99 235)", backgroundColor: isDark ? "rgb(30 41 59)" : "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-2">
									<div className="rounded-full bg-indigo-100 p-1.5 dark:bg-indigo-900">
										<Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
									</div>
									<div className="text-left">
										<div className="flex items-center gap-2">
											<p className="text-sm font-semibold text-gray-900 dark:text-white">โหมดมืด</p>
											<Badge variant="secondary" className="h-4 px-1 py-0 text-[9px] font-medium">
												ทดลอง
											</Badge>
										</div>
										<p className="text-xs text-gray-600 dark:text-gray-400">ใช้ธีมมืดตลอดเวลา</p>
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
								className="group flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
								style={themeMode === "system" ? { borderColor: "rgb(37 99 235)", backgroundColor: isDark ? "rgb(30 41 59)" : "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-2">
									<div className="rounded-full bg-gray-100 p-1.5 dark:bg-gray-700">
										<Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
									</div>
									<div className="text-left">
										<p className="text-sm font-semibold text-gray-900 dark:text-white">ตามระบบ</p>
										<p className="text-xs text-gray-600 dark:text-gray-400">ปรับตามการตั้งค่าของอุปกรณ์</p>
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
						<Separator className="dark:bg-gray-800" />
						<CardContent>
							<button
								type="button"
								disabled
								className="flex w-full cursor-not-allowed items-center justify-between rounded-lg border-2 border-gray-200 bg-gray-50 p-3 opacity-60 dark:border-gray-700 dark:bg-gray-800/50">
								<div className="flex items-center gap-2">
									<div className="rounded-full bg-gray-100 p-1.5 dark:bg-gray-700">
										<BellOff className="h-4 w-4 text-gray-600 dark:text-gray-400" />
									</div>
									<div className="text-left">
										<div className="flex items-center gap-2">
											<p className="text-sm font-semibold text-gray-900 dark:text-white">การแจ้งเตือนทั่วไป</p>
											<Badge variant="secondary" className="h-4 px-1 py-0 text-[9px] font-medium">
												ยังไม่พร้อม
											</Badge>
										</div>
										<p className="text-xs text-gray-600 dark:text-gray-400">รับการแจ้งเตือนเกี่ยวกับการจองและรอบรถ</p>
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
									<Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
								</div>
								<div>
									<CardTitle className="text-base">เกี่ยวกับ</CardTitle>
									<CardDescription className="text-sm">ข้อมูลการพัฒนา</CardDescription>
								</div>
							</div>
						</CardHeader>
						<Separator className="dark:bg-gray-800" />
						<CardContent className="space-y-4">
							{/* <div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Briefcase className="h-4 w-4 text-gray-600 dark:text-gray-400" />
									<p className="text-sm font-medium text-gray-600 dark:text-gray-400">ชื่อ Project</p>
								</div>
								<p className="text-base font-semibold text-gray-900 dark:text-white">CMRU Bus Reservation</p>
							</div>
							<Separator className="dark:bg-gray-800" /> */}

							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Github className="h-4 w-4 text-gray-600 dark:text-gray-400" />
									<p className="text-sm font-medium text-gray-600 dark:text-gray-400">GitHub</p>
								</div>
								<a
									href={EXTERNAL_URLS.GITHUB_REPO}
									target="_blank"
									rel="noopener noreferrer"
									className="font-mono text-sm text-blue-600 hover:underline dark:text-blue-400">
									CMRU-Bus-Reservation
								</a>
							</div>
							<Separator className="dark:bg-gray-800" />
							<div>
								<button onClick={() => setShowAllContributors(!showAllContributors)} className="flex w-full items-center justify-between">
									<div className="flex items-center gap-2">
										<UserCheck className="h-4 w-4 text-gray-600 dark:text-gray-400" />
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">พัฒนาโดย</p>
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
										{contributors.length > 3 && <span className="text-xs font-medium text-gray-600 dark:text-gray-400">+{contributors.length - 3}</span>}
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
														<span className="text-sm font-medium text-gray-900 dark:text-white">{contributor.login}</span>
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
													<span className="text-sm font-medium text-gray-900 dark:text-white">CMRU Computer Science 66</span>
												</a>
											)}
										</div>
									</div>
								)}
							</div>

							<Separator className="dark:bg-gray-800" />
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Tag className="h-4 w-4 text-gray-600 dark:text-gray-400" />
									<p className="text-sm font-medium text-gray-600 dark:text-gray-400">เวอร์ชัน API</p>
								</div>
								<a href={EXTERNAL_URLS.API_REPO} target="_blank" rel="noopener noreferrer">
									<Badge variant="outline" className="cursor-pointer font-mono transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
										{apiVersion}
									</Badge>
								</a>
							</div>
							<Separator className="dark:bg-gray-800" />
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Tag className="h-4 w-4 text-gray-600 dark:text-gray-400" />
									<p className="text-sm font-medium text-gray-600 dark:text-gray-400">เวอร์ชัน Web</p>
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
							<Button
								onClick={logout}
								variant="destructive"
								size="default"
								className="h-10 w-full gap-2 text-sm font-semibold shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]">
								<LogOut className="h-4 w-4" />
								ออกจากระบบ
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
