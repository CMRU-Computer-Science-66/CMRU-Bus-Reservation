import "./index.css";

import { Analytics } from "@vercel/analytics/react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "./components/error-boundary";
import { ROUTES } from "./config/routes";
import { ApiProvider, useApi } from "./contexts/api-context";
import { BookingPage } from "./pages/booking-page";
import { LoginPage } from "./pages/login-page";
import { SchedulePage } from "./pages/schedule-page";
import { SettingsPage } from "./pages/settings-page";
import { StatisticsPage } from "./pages/statistics-page";
import { QueryProvider } from "./providers/query-provider";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { isAuthenticated } = useApi();

	if (!isAuthenticated) {
		return <Navigate to={ROUTES.LOGIN} replace />;
	}

	return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
	const { isAuthenticated } = useApi();

	if (isAuthenticated) {
		return <Navigate to={ROUTES.SCHEDULE} replace />;
	}

	return <>{children}</>;
}

function AppRoutes() {
	return (
		<Routes>
			<Route
				path={ROUTES.LOGIN}
				element={
					<PublicRoute>
						<LoginPage />
					</PublicRoute>
				}
			/>

			<Route
				path={ROUTES.SCHEDULE}
				element={
					<ProtectedRoute>
						<SchedulePage />
					</ProtectedRoute>
				}
			/>
			<Route
				path={ROUTES.BOOKING}
				element={
					<ProtectedRoute>
						<BookingPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path={ROUTES.SETTINGS}
				element={
					<ProtectedRoute>
						<SettingsPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path={ROUTES.STATISTICS}
				element={
					<ProtectedRoute>
						<StatisticsPage />
					</ProtectedRoute>
				}
			/>

			<Route path={ROUTES.HOME} element={<Navigate to={ROUTES.SCHEDULE} replace />} />
			<Route path="*" element={<Navigate to={ROUTES.SCHEDULE} replace />} />
		</Routes>
	);
}

export function App() {
	return (
		<ErrorBoundary>
			<HelmetProvider>
				<BrowserRouter>
					<QueryProvider>
						<ApiProvider>
							<AppRoutes />
						</ApiProvider>
					</QueryProvider>
				</BrowserRouter>
				{process.env.NODE_ENV === "production" && <Analytics />}
			</HelmetProvider>
		</ErrorBoundary>
	);
}

export default App;
