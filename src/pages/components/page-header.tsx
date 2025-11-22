import { Bus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProperties {
	actions?: ReactNode;
	icon?: LucideIcon;
	subtitle?: string | ReactNode;
	title: string;
}

export function PageHeader({ actions, icon: Icon = Bus, subtitle, title }: PageHeaderProperties) {
	return (
		<div className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
			<div className="container mx-auto px-4 py-4 sm:px-6">
				<div className="flex items-center justify-between gap-4">
					<div className="flex min-w-0 flex-1 items-center gap-3">
						<div className="bg-header-gradient rounded-xl p-2 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl">
							<Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
						</div>
						<div className="min-w-0 flex-1">
							<h1 className="text-primary-bold truncate text-lg font-bold sm:text-xl">{title}</h1>
							{subtitle && <div className="text-secondary truncate text-xs sm:text-sm">{subtitle}</div>}
						</div>
					</div>
					{actions && <div className="flex items-center gap-2">{actions}</div>}
				</div>
			</div>
		</div>
	);
}
