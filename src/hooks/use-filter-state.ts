import { useState } from "react";

export type FilterState = "all" | "confirmed" | "completed" | "cancelled" | "hasQR";

export interface FilterStatistics {
	all: number;
	cancelled: number;
	completed: number;
	confirmed: number;
	hasQR?: number;
}

export function useFilterState(initialFilter: FilterState = "all") {
	const [currentFilter, setCurrentFilter] = useState<FilterState>(initialFilter);

	const handleFilterChange = (filter: FilterState) => {
		if (currentFilter === filter) {
			setCurrentFilter("all");
		} else {
			setCurrentFilter(filter);
		}
	};

	const getFilterLabel = (filter: FilterState) => {
		switch (filter) {
			case "all": {
				return "ทั้งหมด";
			}
			case "confirmed": {
				return "ยืนยันแล้ว";
			}
			case "completed": {
				return "เดินทางแล้ว";
			}
			case "cancelled": {
				return "ยกเลิกแล้ว";
			}
			case "hasQR": {
				return "มี QR Code";
			}
			default: {
				return "ทั้งหมด";
			}
		}
	};

	const getCurrentFilterLabel = () => getFilterLabel(currentFilter);

	return {
		currentFilter,
		setCurrentFilter,
		handleFilterChange,
		getFilterLabel,
		getCurrentFilterLabel,
	};
}
