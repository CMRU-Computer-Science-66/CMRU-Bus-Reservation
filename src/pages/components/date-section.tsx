import type { ScheduleReservation } from "@cmru-comsci-66/cmru-api";
import { Calendar } from "lucide-react";

import { Skeleton } from "../../components/ui/skeleton";
import { ReservationCard } from "./reservation-card";

interface DateSectionProperties {
	actionLoading?: number | null;
	dateGroup?: {
		date: string;
		displayDate: string;
		items: ScheduleReservation[];
	};
	isLoading?: boolean;
	onCancel?: (item: ScheduleReservation) => void;
	onConfirm?: (item: ScheduleReservation) => void;
	oneClickMode?: boolean;
	showTimeLeft?: boolean;
}

export function DateSection({ actionLoading = null, dateGroup, isLoading = false, onCancel, onConfirm, oneClickMode = false, showTimeLeft = false }: DateSectionProperties) {
	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-3 rounded-lg bg-white/80 p-4 shadow-sm backdrop-blur-md dark:bg-gray-900/80">
					<div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
						<Skeleton className="h-4 w-4" />
					</div>
					<div>
						<Skeleton className="mb-1 h-5 w-24" />
						<Skeleton className="h-4 w-16" />
					</div>
				</div>

				<div className="space-y-4">
					{Array.from({ length: 2 }).map((_, index) => (
						<ReservationCard key={index} actionLoading={null} isLoading={true} />
					))}
				</div>
			</div>
		);
	}

	if (!dateGroup) return null;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3 rounded-lg bg-white/80 p-4 shadow-sm backdrop-blur-md dark:bg-gray-900/80">
				<div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
					<Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
				</div>
				<div>
					<h3 className="font-bold text-gray-900 dark:text-white">{dateGroup.displayDate}</h3>
					<p className="text-sm text-gray-600 dark:text-gray-400">{dateGroup.items.length} รายการ</p>
				</div>
			</div>

			<div className="space-y-4">
				{dateGroup.items.map((item) => (
					<ReservationCard
						key={item.id}
						item={item}
						actionLoading={actionLoading}
						onConfirm={onConfirm}
						onCancel={onCancel}
						oneClickMode={oneClickMode}
						showTimeLeft={showTimeLeft}
					/>
				))}
			</div>
		</div>
	);
}
