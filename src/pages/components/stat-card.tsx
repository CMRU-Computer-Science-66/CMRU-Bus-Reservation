import { type LucideIcon } from "lucide-react";

import { Card, CardContent } from "../../components/ui/card";

interface StatCardProperties {
	colorTheme: "blue" | "green" | "purple" | "red" | "orange";
	icon: LucideIcon;
	iconBg?: string;
	isActive?: boolean;
	isLoading?: boolean;
	label: string;
	onClick?: () => void;
	value: number | string;
}

function getIconColor(colorTheme: string): string {
	if (colorTheme === "blue") return "text-icon-blue h-5 w-5";
	if (colorTheme === "green") return "text-icon-green h-5 w-5";
	if (colorTheme === "purple") return "text-icon-purple h-5 w-5";
	if (colorTheme === "red") return "text-icon-red h-5 w-5";
	return "text-icon-orange h-5 w-5";
}

function getRingColor(colorTheme: string): string {
	if (colorTheme === "blue") return "ring-blue-500 dark:ring-blue-400";
	if (colorTheme === "green") return "ring-green-500 dark:ring-green-400";
	if (colorTheme === "purple") return "ring-purple-500 dark:ring-purple-400";
	if (colorTheme === "red") return "ring-red-500 dark:ring-red-400";
	return "ring-blue-500 dark:ring-blue-400";
}

function getTextGradient(colorTheme: string, isActive: boolean): string {
	if (colorTheme === "blue") return isActive ? "text-gradient-blue-active" : "text-gradient-blue";
	if (colorTheme === "green") return isActive ? "text-gradient-green-active" : "text-gradient-green";
	if (colorTheme === "purple") return isActive ? "text-gradient-purple-active" : "text-gradient-purple";
	if (colorTheme === "red") return isActive ? "text-gradient-red-active" : "text-gradient-red";
	return isActive ? "text-gradient-blue-active" : "text-gradient-blue";
}

export function StatCard({ colorTheme, icon: Icon, iconBg, isActive, isLoading = false, label, onClick, value }: StatCardProperties) {
	const shouldShowRing = isActive && !["ทั้งหมด", "จองทั้งหมด", "รอบทั้งหมด", "วันที่มีรถ"].includes(label);

	return (
		<Card
			onClick={onClick}
			className={`group border-0 bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-900/90 ${
				onClick ? "cursor-pointer" : ""
			} ${shouldShowRing ? `ring-2 ring-offset-2 ${getRingColor(colorTheme)}` : ""}`}>
			<CardContent className="p-4">
				<div className="flex items-center justify-between gap-3">
					<div className="flex-1">
						<div className="mb-1 h-4">
							<p className="text-secondary text-xs font-medium">{label}</p>
						</div>

						<div className="flex h-9 items-center">
							{isLoading ? (
								<div className="loading-bg-medium h-8 w-16 rounded" />
							) : (
								<p className="text-2xl font-bold">
									<span className={getTextGradient(colorTheme, isActive || false)}>{value}</span>
								</p>
							)}
						</div>
					</div>

					<div className={`rounded-lg ${iconBg || "bg-gray-100 dark:bg-gray-800"} shrink-0 p-2 transition-all group-hover:scale-110`}>
						<Icon className={getIconColor(colorTheme)} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
