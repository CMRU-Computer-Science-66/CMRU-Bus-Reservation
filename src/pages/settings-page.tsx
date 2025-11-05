import { ArrowLeft, Bell, BellOff, Check, Clock, Globe, LogOut, Moon, Palette, Settings, Sun, User } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { useApi } from "../contexts/api-context";
import { getSessionManager } from "../lib/session-manager";

interface SettingsPageProperties {
	onNavigateBack?: () => void;
}

type ThemeMode = "light" | "dark" | "system";
type TimeFormat = "24hour" | "thai";
const sessionManager = getSessionManager();

export function SettingsPage({ onNavigateBack }: SettingsPageProperties) {
	const { logout } = useApi();
	const [username, setUsername] = useState<string>("");
	const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
		const theme = localStorage.getItem("theme") as ThemeMode | null;
		return theme || "system";
	});
	const [isDark, setIsDark] = useState(() => {
		const theme = localStorage.getItem("theme") as ThemeMode | null;
		const prefersDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
		return theme === "dark" || (!theme && prefersDark);
	});
	const [notifications, setNotifications] = useState(() => {
		const saved = localStorage.getItem("notifications");
		return saved === null ? true : saved === "true";
	});
	const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
		const format = localStorage.getItem("timeFormat") as TimeFormat | null;
		return format || "thai";
	});

	useEffect(() => {
		const session = sessionManager.loadSession();
		if (session?.username) {
			setUsername(session.username);
		}
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

	const toggleNotifications = () => {
		const newValue = !notifications;
		setNotifications(newValue);
		localStorage.setItem("notifications", String(newValue));
	};

	const handleTimeFormatChange = (format: TimeFormat) => {
		setTimeFormat(format);
		localStorage.setItem("timeFormat", format);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
			<div className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
				<div className="container mx-auto px-4 py-4 sm:px-6">
					<div className="flex items-center justify-between gap-4">
						<div className="flex min-w-0 flex-1 items-center gap-3">
							{onNavigateBack && (
								<Button variant="ghost" size="icon" onClick={onNavigateBack} className="h-10 w-10 shrink-0 rounded-full hover:scale-110">
									<ArrowLeft className="h-5 w-5" />
								</Button>
							)}
							<div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl">
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

			<div className="container mx-auto max-w-4xl px-4 py-6 sm:px-6">
				<div className="space-y-6">
					<Card className="border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
									<User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
								</div>
								<div>
									<CardTitle className="text-lg">ข้อมูลผู้ใช้</CardTitle>
									<CardDescription>ข้อมูลบัญชีของคุณ</CardDescription>
								</div>
							</div>
						</CardHeader>
						<Separator className="dark:bg-gray-800" />
						<CardContent className="space-y-4 pt-6">
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
							<div className="flex items-center gap-3">
								<div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
									<Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
								</div>
								<div>
									<CardTitle className="text-lg">รูปแบบเวลา</CardTitle>
									<CardDescription>เลือกวิธีแสดงเวลาที่คุณต้องการ</CardDescription>
								</div>
							</div>
						</CardHeader>
						<Separator className="dark:bg-gray-800" />
						<CardContent className="space-y-3 pt-6">
							<button
								type="button"
								onClick={() => handleTimeFormatChange("thai")}
								className="group flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
								style={timeFormat === "thai" ? { borderColor: "rgb(37 99 235)", backgroundColor: isDark ? "rgb(30 41 59)" : "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-3">
									<div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900">
										<Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
									</div>
									<div className="text-left">
										<div className="flex items-center gap-2">
											<p className="font-semibold text-gray-900 dark:text-white">แบบไทยแท้้</p>
											<Badge variant="secondary" className="h-5 px-1.5 py-0 text-[10px] font-medium">
												ทดลอง
											</Badge>
										</div>
										<p className="text-sm text-gray-600 dark:text-gray-400">แสดงเวลาแบบ บ่ายโมง, บ่าย 2 โมงครึ่ง</p>
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
								className="group flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
								style={timeFormat === "24hour" ? { borderColor: "rgb(37 99 235)", backgroundColor: isDark ? "rgb(30 41 59)" : "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-3">
									<div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
										<Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
									</div>
									<div className="text-left">
										<p className="font-semibold text-gray-900 dark:text-white">24 ชั่วโมง</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">แสดงเวลาแบบ 13:00, 14:30</p>
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
					<Card className="border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
									<Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
								</div>
								<div>
									<CardTitle className="text-lg">ธีม</CardTitle>
									<CardDescription>เลือกธีมที่คุณชอบ</CardDescription>
								</div>
							</div>
						</CardHeader>
						<Separator className="dark:bg-gray-800" />
						<CardContent className="space-y-3 pt-6">
							<button
								type="button"
								onClick={() => handleThemeChange("light")}
								className="group flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
								style={themeMode === "light" ? { borderColor: "rgb(37 99 235)", backgroundColor: "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-3">
									<div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900">
										<Sun className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
									</div>
									<div className="text-left">
										<p className="font-semibold text-gray-900 dark:text-white">โหมดสว่าง</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">ใช้ธีมสว่างตลอดเวลา</p>
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
								className="group flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
								style={themeMode === "dark" ? { borderColor: "rgb(37 99 235)", backgroundColor: isDark ? "rgb(30 41 59)" : "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-3">
									<div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900">
										<Moon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
									</div>
									<div className="text-left">
										<div className="flex items-center gap-2">
											<p className="font-semibold text-gray-900 dark:text-white">โหมดมืด</p>
											<Badge variant="secondary" className="h-5 px-1.5 py-0 text-[10px] font-medium">
												ทดลอง
											</Badge>
										</div>
										<p className="text-sm text-gray-600 dark:text-gray-400">ใช้ธีมมืดตลอดเวลา</p>
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
								className="group flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
								style={themeMode === "system" ? { borderColor: "rgb(37 99 235)", backgroundColor: isDark ? "rgb(30 41 59)" : "rgb(239 246 255)" } : {}}>
								<div className="flex items-center gap-3">
									<div className="rounded-full bg-gray-100 p-2 dark:bg-gray-700">
										<Globe className="h-5 w-5 text-gray-600 dark:text-gray-400" />
									</div>
									<div className="text-left">
										<p className="font-semibold text-gray-900 dark:text-white">ตามระบบ</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">ปรับตามการตั้งค่าของอุปกรณ์</p>
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
							<div className="flex items-center gap-3">
								<div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
									<Bell className="h-6 w-6 text-green-600 dark:text-green-400" />
								</div>
								<div>
									<CardTitle className="text-lg">การแจ้งเตือน</CardTitle>
									<CardDescription>จัดการการแจ้งเตือนของคุณ</CardDescription>
								</div>
							</div>
						</CardHeader>
						<Separator className="dark:bg-gray-800" />
						<CardContent className="pt-6">
							<button
								type="button"
								onClick={toggleNotifications}
								className="flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600">
								<div className="flex items-center gap-3">
									<div className={`rounded-full p-2 ${notifications ? "bg-green-100 dark:bg-green-900" : "bg-gray-100 dark:bg-gray-700"}`}>
										{notifications ? <Bell className="h-5 w-5 text-green-600 dark:text-green-400" /> : <BellOff className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
									</div>
									<div className="text-left">
										<p className="font-semibold text-gray-900 dark:text-white">การแจ้งเตือนทั่วไป</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">รับการแจ้งเตือนเกี่ยวกับการจองและรอบรถ</p>
									</div>
								</div>
								<Badge variant={notifications ? "default" : "secondary"} className={notifications ? "bg-green-600 dark:bg-green-500" : ""}>
									{notifications ? "เปิด" : "ปิด"}
								</Badge>
							</button>
						</CardContent>
					</Card>

					<Card className="border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="rounded-full bg-gray-100 p-3 dark:bg-gray-700">
									<Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
								</div>
								<div>
									<CardTitle className="text-lg">เกี่ยวกับ</CardTitle>
									<CardDescription>ข้อมูลการพัณนา</CardDescription>
								</div>
							</div>
						</CardHeader>
						<Separator className="dark:bg-gray-800" />
						<CardContent className="space-y-4 pt-6">
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-400">ชื่อ Project</p>
								<p className="text-base font-semibold text-gray-900 dark:text-white">CMRU Bus Reservation</p>
							</div>
							<Separator className="dark:bg-gray-800" />
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-400">พัฒนาโดย</p>
								<p className="text-base font-semibold text-gray-900 dark:text-white">CMRU Computer Science 66</p>
							</div>
							<Separator className="dark:bg-gray-800" />
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-400">เวอร์ชัน</p>
								<Badge variant="outline" className="font-mono">
									1.0.0
								</Badge>
							</div>
						</CardContent>
					</Card>

					<Card className="border-0 border-red-200 bg-white/90 shadow-md backdrop-blur-md dark:border-red-900 dark:bg-gray-900/90">
						<CardContent className="p-6">
							<Button
								onClick={logout}
								variant="destructive"
								size="lg"
								className="h-12 w-full gap-2 text-base font-semibold shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]">
								<LogOut className="h-5 w-5" />
								ออกจากระบบ
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
