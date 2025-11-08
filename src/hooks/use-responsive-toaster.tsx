import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export function useResponsiveToaster() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkScreenSize();
		window.addEventListener("resize", checkScreenSize);

		return () => window.removeEventListener("resize", checkScreenSize);
	}, []);

	return { isMobile };
}

export function ResponsiveToaster() {
	const { isMobile } = useResponsiveToaster();

	return <Toaster position={isMobile ? "top-center" : "top-right"} />;
}
