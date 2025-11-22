import type { ScheduleReservation } from "@cmru-comsci-66/cmru-api";
import { Calendar } from "lucide-react";

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
	refreshTrigger?: number;
	showTimeLeft?: boolean;
}

export function DateSection({
	actionLoading = null,
	dateGroup,
	isLoading = false,
	onCancel,
	onConfirm,
	oneClickMode = false,
	refreshTrigger,
	showTimeLeft = false,
}: DateSectionProperties) {
	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2.5 shadow-md dark:bg-gray-700">
						<Calendar className="text-secondary h-4 w-4" />
						<div className="loading-bg-light h-5 w-28 rounded" />
						<div className="loading-bg-light h-4 w-12 rounded-full" />
					</div>
					<div className="loading-bg-medium h-px flex-1"></div>
					<div className="loading-bg-medium h-5 w-10 rounded" />
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
					<Calendar className="text-icon-blue h-4 w-4" />
				</div>
				<div>
					<h3 className="text-primary-bold font-bold">{dateGroup.displayDate}</h3>
					<p className="text-secondary text-sm">{dateGroup.items.length} รายการ</p>
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
						refreshTrigger={refreshTrigger}
						showTimeLeft={showTimeLeft}
					/>
				))}
			</div>
		</div>
	);
}
