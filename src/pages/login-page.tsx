import { AlertCircle, Bus, Eye, EyeOff, Loader2, Lock, LogIn, User } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useApi } from "../contexts/api-context";
import { ThemeToggle } from "./components/theme-toggle";

export function LoginPage() {
	const { login } = useApi();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | undefined>();
	const [showPassword, setShowPassword] = useState(false);
	const [isDark, setIsDark] = useState(() => {
		const theme = localStorage.getItem("theme");
		return theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
	});

	useState(() => {
		document.documentElement.classList.toggle("dark", isDark);
	});

	const toggleTheme = () => {
		const userTheme = !isDark;
		setIsDark(userTheme);
		localStorage.setItem("theme", userTheme ? "dark" : "light");
		document.documentElement.classList.toggle("dark", userTheme);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(undefined);

		if (!username.trim() || !password.trim()) {
			setError("กรุณากรอกข้อมูลให้ครบถ้วน");
			return;
		}

		setIsLoading(true);

		try {
			const result = await login(username, password);
			if (!result) {
				setError("เข้าสู่ระบบไม่สำเร็จ");
			}
		} catch (error_) {
			setError(error_ instanceof Error ? error_.message : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
			<div className="absolute inset-0 overflow-hidden">
				<div className="animate-blob absolute top-0 -left-4 h-72 w-72 rounded-full bg-purple-300 opacity-70 mix-blend-multiply blur-xl filter dark:bg-purple-900 dark:opacity-30"></div>
				<div className="animation-delay-2000 animate-blob absolute top-0 -right-4 h-72 w-72 rounded-full bg-yellow-300 opacity-70 mix-blend-multiply blur-xl filter dark:bg-yellow-900 dark:opacity-30"></div>
				<div className="animation-delay-4000 animate-blob absolute -bottom-8 left-20 h-72 w-72 rounded-full bg-pink-300 opacity-70 mix-blend-multiply blur-xl filter dark:bg-pink-900 dark:opacity-30"></div>
			</div>

			<ThemeToggle isDark={isDark} onToggle={toggleTheme} className="absolute top-4 right-4 z-10 border-2 shadow-lg backdrop-blur-sm" />

			<Card className="relative z-10 w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-md dark:bg-gray-900/95">
				<CardHeader className="space-y-4 pb-6 text-center">
					<div className="flex justify-center">
						<div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 shadow-2xl">
							<Bus className="h-12 w-12 text-white" />
						</div>
					</div>
					<div className="space-y-2">
						<CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">ระบบจองรถบัส</CardTitle>
						<CardDescription className="text-base text-gray-600 dark:text-gray-400">มหาวิทยาลัยราชภัฏเชียงใหม่</CardDescription>
					</div>
				</CardHeader>

				<CardContent className="space-y-6">
					{error && (
						<Alert variant="destructive" className="border-red-200 dark:border-red-900">
							<AlertCircle className="h-5 w-5" />
							<AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
							<AlertDescription className="text-sm">{error}</AlertDescription>
						</Alert>
					)}

					<form onSubmit={handleSubmit} className="space-y-5">
						<div className="space-y-2">
							<Label htmlFor="username" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
								ชื่อผู้ใช้
							</Label>
							<div className="relative">
								<User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
								<Input
									id="username"
									type="text"
									placeholder="กรอกชื่อผู้ใช้"
									value={username}
									onChange={(event) => setUsername(event.target.value)}
									disabled={isLoading}
									className="h-12 border-gray-200 pl-11 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-900"
									autoComplete="username"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
								รหัสผ่าน
							</Label>
							<div className="relative">
								<Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="กรอกรหัสผ่าน"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									disabled={isLoading}
									className="h-12 border-gray-200 pr-11 pl-11 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-900"
									autoComplete="current-password"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
									disabled={isLoading}>
									{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
								</button>
							</div>
						</div>

						<Button
							type="submit"
							disabled={isLoading || !username.trim() || !password.trim()}
							className="h-13 w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold shadow-lg transition-all hover:scale-[1.02] hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98] disabled:hover:scale-100 dark:from-blue-500 dark:to-indigo-500">
							{isLoading ? (
								<>
									<Loader2 className="h-5 w-5 animate-spin" />
									<span>กำลังเข้าสู่ระบบ...</span>
								</>
							) : (
								<>
									<LogIn className="h-5 w-5" />
									<span>เข้าสู่ระบบ</span>
								</>
							)}
						</Button>
					</form>

					<div className="space-y-3 border-t border-gray-200 pt-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
						<p>ใช้บัญชี CMU Account เพื่อเข้าสู่ระบบ</p>
						{/* <p className="text-xs text-gray-500 dark:text-gray-500">© 2025 สาขาวิทยาการคอมพิวเตอร์ & มหาวิทยาลัยราชภัฏเชียงใหม่</p> */}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
