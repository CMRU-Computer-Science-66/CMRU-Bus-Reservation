import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface UseThemeReturn {
	applyTheme: () => void;
	handleThemeChange: (mode: ThemeMode) => void;
	isDark: boolean;
	themeMode: ThemeMode;
}

export function useTheme(): UseThemeReturn {
	const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
		const theme = localStorage.getItem("theme") as ThemeMode | null;
		return theme || "light";
	});

	const [isDark, setIsDark] = useState(() => {
		const theme = localStorage.getItem("theme") as ThemeMode | null;
		const prefersDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
		return theme === "dark" || (theme === "system" && prefersDark);
	});

	// eslint-disable-next-line unicorn/consistent-function-scoping
	const applyTheme = () => {
		const theme = localStorage.getItem("theme");
		const prefersDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
		const shouldBeDark = theme === "dark" || (theme === "system" && prefersDark);
		document.documentElement.classList.toggle("dark", shouldBeDark);
	};

	const handleThemeChange = (mode: ThemeMode) => {
		setThemeMode(mode);
		localStorage.setItem("theme", mode);
		const prefersDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
		const shouldBeDark = mode === "dark" || (mode === "system" && prefersDark);
		setIsDark(shouldBeDark);
	};

	useEffect(() => {
		document.documentElement.classList.toggle("dark", isDark);
	}, [isDark]);

	return {
		themeMode,
		isDark,
		handleThemeChange,
		applyTheme,
	};
}
