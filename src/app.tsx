import "./index.css";

import { useState } from "react";

import { ApiProvider, useApi } from "./contexts/api-context";
import { BookingPage } from "./pages/booking-page";
import { LoginPage } from "./pages/login-page";
import { SchedulePage } from "./pages/schedule-page";
import { SettingsPage } from "./pages/settings-page";

type Page = "schedule" | "booking" | "settings";

function AppContent() {
	const { isAuthenticated } = useApi();
	const [currentPage, setCurrentPage] = useState<Page>("schedule");

	if (!isAuthenticated) {
		return <LoginPage onLoginSuccess={() => {}} />;
	}

	if (currentPage === "booking") {
		return <BookingPage onNavigateToSchedule={() => setCurrentPage("schedule")} onNavigateToSettings={() => setCurrentPage("settings")} />;
	}

	if (currentPage === "settings") {
		return <SettingsPage onNavigateBack={() => setCurrentPage("schedule")} />;
	}

	return <SchedulePage onNavigateToBooking={() => setCurrentPage("booking")} onNavigateToSettings={() => setCurrentPage("settings")} />;
}

export function App() {
	return (
		<ApiProvider>
			<AppContent />
		</ApiProvider>
	);
}

export default App;
