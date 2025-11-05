import { type LucideIcon } from "lucide-react";

import { Card, CardContent } from "../../components/ui/card";

interface StatCardProperties {
	gradient: string;
	icon: LucideIcon;
	iconBg: string;
	isActive?: boolean;
	label: string;
	onClick?: () => void;
	value: number | string;
}

export function StatCard({ gradient, icon: Icon, iconBg, isActive, label, onClick, value }: StatCardProperties) {
	return (
		<Card
			onClick={onClick}
			className={`group border-0 bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-900/90 ${
				onClick ? "cursor-pointer" : ""
			} ${isActive ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-blue-400" : ""}`}>
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div>
						<p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
						<p className="text-2xl font-bold">
							<span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{value}</span>
						</p>
					</div>
					<div className={`rounded-lg ${iconBg} p-2 transition-all group-hover:scale-110`}>
						<Icon
							className={`h-5 w-5 ${gradient.includes("blue") ? "text-blue-600 dark:text-blue-400" : gradient.includes("green") ? "text-green-600 dark:text-green-400" : gradient.includes("purple") ? "text-purple-600 dark:text-purple-400" : "text-orange-600 dark:text-orange-400"}`}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
