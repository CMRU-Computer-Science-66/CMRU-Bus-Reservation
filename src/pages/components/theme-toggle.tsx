import { Moon, Sun } from "lucide-react";

import { Button } from "../../components/ui/button";

interface ThemeToggleProperties {
	className?: string;
	isDark: boolean;
	onToggle: () => void;
}

export function ThemeToggle({ className = "", isDark, onToggle }: ThemeToggleProperties) {
	return (
		<Button variant="outline" size="icon" onClick={onToggle} className={`h-10 w-10 rounded-full transition-all hover:scale-110 ${className}`}>
			{isDark ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-blue-600" />}
		</Button>
	);
}
