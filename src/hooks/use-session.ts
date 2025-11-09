import { useEffect, useState } from "react";

import { getSessionManager } from "../lib/session-manager";

export type TimeFormat = "24hour" | "thai";

const sessionManager = getSessionManager();

export interface UseSessionReturn {
	handleTimeFormatChange: (format: TimeFormat) => void;
	oneClickEnabled: boolean;
	refreshSessionSettings: () => void;
	showStatistics: boolean;
	timeFormat: TimeFormat;
	toggleOneClick: () => void;
	toggleShowStatistics: () => void;
	username: string;
}

export function useSession(): UseSessionReturn {
	const [username] = useState<string>(() => sessionManager.getUsername() || "");
	const [oneClickEnabled, setOneClickEnabled] = useState(() => sessionManager.getOneClickEnabled());
	const [showStatistics, setShowStatistics] = useState(() => sessionManager.getShowStatistics());
	const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
		const format = localStorage.getItem("timeFormat") as TimeFormat | null;
		return format || "thai";
	});

	const handleTimeFormatChange = (format: TimeFormat) => {
		setTimeFormat(format);
		localStorage.setItem("timeFormat", format);
	};

	const toggleOneClick = () => {
		const isOneClickEnabled = !oneClickEnabled;
		setOneClickEnabled(isOneClickEnabled);
		sessionManager.setOneClickEnabled(isOneClickEnabled);
	};

	const toggleShowStatistics = () => {
		const isShowStatistics = !showStatistics;
		setShowStatistics(isShowStatistics);
		sessionManager.setShowStatistics(isShowStatistics);
	};

	const refreshSessionSettings = () => {
		setOneClickEnabled(sessionManager.getOneClickEnabled());
		setShowStatistics(sessionManager.getShowStatistics());
	};

	useEffect(() => {
		const handleFocus = () => {
			refreshSessionSettings();
		};

		window.addEventListener("focus", handleFocus);
		return () => window.removeEventListener("focus", handleFocus);
	}, []);

	return {
		username,
		oneClickEnabled,
		showStatistics,
		timeFormat,
		handleTimeFormatChange,
		toggleOneClick,
		toggleShowStatistics,
		refreshSessionSettings,
	};
}
