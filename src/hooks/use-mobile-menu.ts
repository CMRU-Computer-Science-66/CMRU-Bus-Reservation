import { useState } from "react";

export interface UseMobileMenuReturn {
	closeMobileMenu: () => void;
	getMobileMenuClasses: () => string;
	mobileMenuClosing: boolean;
	mobileMenuOpen: boolean;
	toggleMobileMenu: () => void;
}

export function useMobileMenu(): UseMobileMenuReturn {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [mobileMenuClosing, setMobileMenuClosing] = useState(false);

	const toggleMobileMenu = () => {
		setMobileMenuOpen(!mobileMenuOpen);
	};

	const closeMobileMenu = () => {
		setMobileMenuClosing(true);
		setTimeout(() => {
			setMobileMenuOpen(false);
			setMobileMenuClosing(false);
		}, 200);
	};

	const getMobileMenuClasses = () => {
		return mobileMenuClosing ? "animate-out slide-out-to-top-4 fade-out-0" : "animate-in slide-in-from-top-4 fade-in-0";
	};

	return {
		mobileMenuOpen,
		mobileMenuClosing,
		toggleMobileMenu,
		closeMobileMenu,
		getMobileMenuClasses,
	};
}
