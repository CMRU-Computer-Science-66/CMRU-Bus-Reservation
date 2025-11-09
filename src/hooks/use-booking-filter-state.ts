import { useState } from "react";

export type BookingFilterState = "all" | "available" | "canReserve";

export function useBookingFilterState(initialFilter: BookingFilterState = "all") {
	const [currentFilter, setCurrentFilter] = useState<BookingFilterState>(initialFilter);

	const handleFilterChange = (filter: BookingFilterState) => {
		if (currentFilter === filter) {
			setCurrentFilter("all");
		} else {
			setCurrentFilter(filter);
		}
	};

	const getFilterLabel = (filter: BookingFilterState) => {
		switch (filter) {
			case "all": {
				return "ทั้งหมด";
			}
			case "available": {
				return "มีรอบว่าง";
			}
			case "canReserve": {
				return "จำนวนรอบจองได้";
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
