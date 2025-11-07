/* eslint-disable unicorn/no-keyword-prefix */
import { Moon, Sun } from "lucide-react";

import { Button } from "../../components/ui/button";

interface ThemeToggleProperties {
	"aria-label"?: string;
	className?: string;
	isDark: boolean;
	onToggle: () => void;
}

export function ThemeToggle({ "aria-label": ariaLabel, className = "", isDark, onToggle }: ThemeToggleProperties) {
	return (
		<Button
			variant="outline"
			size="icon"
			onClick={onToggle}
			className={`h-10 w-10 rounded-full transition-all hover:scale-110 ${className}`}
			aria-label={ariaLabel || (isDark ? "Switch to light theme" : "Switch to dark theme")}>
			{isDark ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-blue-600" />}
		</Button>
	);
}
