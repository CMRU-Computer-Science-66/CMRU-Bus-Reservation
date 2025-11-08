import { type LucideIcon } from "lucide-react";

import { Card, CardContent } from "../../components/ui/card";

interface StatCardProperties {
	gradient: string;
	icon: LucideIcon;
	iconBg?: string;
	isActive?: boolean;
	isLoading?: boolean;
	label: string;
	onClick?: () => void;
	value: number | string;
}

function getIconColor(gradient: string): string {
	if (gradient.includes("blue")) return "h-5 w-5 text-blue-600 dark:text-blue-400";
	if (gradient.includes("green")) return "h-5 w-5 text-green-600 dark:text-green-400";
	if (gradient.includes("purple")) return "h-5 w-5 text-purple-600 dark:text-purple-400";
	return "h-5 w-5 text-orange-600 dark:text-orange-400";
}

export function StatCard({ gradient, icon: Icon, iconBg, isActive, isLoading = false, label, onClick, value }: StatCardProperties) {
	return (
		<Card
			onClick={onClick}
			className={`group border-0 bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-900/90 ${
				onClick ? "cursor-pointer" : ""
			} ${isActive ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-blue-400" : ""}`}>
			<CardContent className="p-4">
				<div className="flex items-center justify-between gap-3">
					<div className="flex-1">
						<div className="mb-1 h-4">
							<p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
						</div>

						<div className="flex h-9 items-center">
							{isLoading ? (
								<div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
							) : (
								<p className="text-2xl font-bold">
									<span className={`bg-linear-to-r ${gradient} bg-clip-text text-transparent`}>{value}</span>
								</p>
							)}
						</div>
					</div>

					<div className={`rounded-lg ${iconBg || "bg-gray-100 dark:bg-gray-800"} shrink-0 p-2 transition-all group-hover:scale-110`}>
						<Icon className={getIconColor(gradient)} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
