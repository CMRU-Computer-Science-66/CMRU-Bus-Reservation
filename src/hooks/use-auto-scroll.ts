import { useCallback, useState } from "react";

interface AutoScrollOptions {
	checkViewport?: boolean;
	highlightDuration?: number;
	mobileOnly?: boolean;
}

export function useAutoScroll<T = string>(options: AutoScrollOptions = {}) {
	const { checkViewport = true, highlightDuration = 2000, mobileOnly = true } = options;
	const [highlightedId, setHighlightedId] = useState<T | null>(null);

	const scrollToElement = useCallback(
		(elementId: T, elementSelector: string, event?: React.MouseEvent | React.KeyboardEvent) => {
			if (event) {
				event.preventDefault();
				event.stopPropagation();
			}

			const shouldScroll = !mobileOnly || window.innerWidth < 768;

			if (shouldScroll) {
				setHighlightedId(elementId);

				requestAnimationFrame(() => {
					const element = document.querySelector(elementSelector);
					if (element) {
						let shouldScrollToView = true;

						if (checkViewport) {
							const rect = element.getBoundingClientRect();
							const isVisible =
								rect.top >= 0 &&
								rect.left >= 0 &&
								rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
								rect.right <= (window.innerWidth || document.documentElement.clientWidth);

							shouldScrollToView = !isVisible;
						}

						if (shouldScrollToView) {
							element.scrollIntoView({
								behavior: "smooth",
								block: "center",
								inline: "nearest",
							});
						}
					}
				});

				setTimeout(() => {
					setHighlightedId(null);
				}, highlightDuration);
			}
		},
		[checkViewport, highlightDuration, mobileOnly],
	);

	const clearHighlight = useCallback(() => {
		setHighlightedId(null);
	}, []);

	const isHighlighted = useCallback(
		(elementId: T) => {
			return highlightedId === elementId;
		},
		[highlightedId],
	);

	return {
		clearHighlight,
		highlightedId,
		isHighlighted,
		scrollToElement,
		setHighlighted: setHighlightedId,
	};
}

export function useCrossPageScroll() {
	const attemptCrossPageScroll = useCallback(
		(scrollTarget: string, elementSelector: (id: string) => string, onFound?: (id: string) => void, onNotFound?: (id: string) => void) => {
			const maxAttempts = 6;

			const attemptScroll = (attempts = 0) => {
				const element = document.querySelector(elementSelector(scrollTarget));
				if (element) {
					requestAnimationFrame(() => {
						element.scrollIntoView({
							behavior: "smooth",
							block: "center",
							inline: "nearest",
						});

						setTimeout(() => {
							const rect = element.getBoundingClientRect();
							const viewportHeight = window.innerHeight;
							const elementCenter = rect.top + rect.height / 2;
							const viewportCenter = viewportHeight / 2;
							const offset = elementCenter - viewportCenter;

							if (Math.abs(offset) > 20) {
								window.scrollBy({
									top: offset,
									behavior: "smooth",
								});
							}
						}, 300);
					});

					sessionStorage.removeItem("scrollToReservation");
					onFound?.(scrollTarget);
				} else if (attempts < maxAttempts) {
					const delay = attempts < 2 ? 50 : 100 + attempts * 50;
					setTimeout(() => attemptScroll(attempts + 1), delay);
				} else {
					sessionStorage.removeItem("scrollToReservation");
					onNotFound?.(scrollTarget);
				}
			};

			requestAnimationFrame(() => attemptScroll());
		},
		[],
	);

	const navigateWithScroll = useCallback((targetPath: string, scrollTargetId?: string | number, navigate?: (path: string) => void) => {
		if (scrollTargetId) {
			sessionStorage.setItem("scrollToReservation", scrollTargetId.toString());
		}

		if (navigate) {
			navigate(targetPath);
		} else if (typeof window !== "undefined") {
			window.location.href = targetPath;
		}
	}, []);

	const navigateWithPageAndScroll = useCallback((targetPath: string, scrollTargetId?: string | number, targetPage?: number, navigate?: (path: string) => void) => {
		if (scrollTargetId) {
			sessionStorage.setItem("scrollToReservation", scrollTargetId.toString());
		}
		if (targetPage && targetPage > 1) {
			sessionStorage.setItem("targetPage", targetPage.toString());
		}

		if (navigate) {
			navigate(targetPath);
		} else if (typeof window !== "undefined") {
			window.location.href = targetPath;
		}
	}, []);

	const attemptCrossPageScrollWithPagination = useCallback(
		(
			scrollTarget: string,
			elementSelector: (id: string) => string,
			onPageChange?: (page: number) => void,
			maxPage?: number,
			onFound?: (id: string) => void,
			onNotFound?: (id: string) => void,
		) => {
			const maxAttempts = 8;
			const targetPage = sessionStorage.getItem("targetPage");

			const attemptScroll = (attempts = 0) => {
				const elementSelectorString = elementSelector(scrollTarget);
				const element = document.querySelector(elementSelectorString);

				if (element) {
					requestAnimationFrame(() => {
						element.scrollIntoView({
							behavior: "smooth",
							block: "center",
							inline: "nearest",
						});

						setTimeout(() => {
							const rect = element.getBoundingClientRect();
							const viewportHeight = window.innerHeight;
							const elementCenter = rect.top + rect.height / 2;
							const viewportCenter = viewportHeight / 2;
							const offset = elementCenter - viewportCenter;

							if (Math.abs(offset) > 20) {
								window.scrollBy({
									top: offset,
									behavior: "smooth",
								});
							}
						}, 300);
					});

					sessionStorage.removeItem("scrollToReservation");
					sessionStorage.removeItem("targetPage");
					onFound?.(scrollTarget);
				} else if (attempts < maxAttempts) {
					if (targetPage && onPageChange && attempts === 0) {
						const pageNumber = Number.parseInt(targetPage, 10);
						if (pageNumber >= 1 && pageNumber <= (maxPage || 999)) {
							onPageChange(pageNumber);
							sessionStorage.removeItem("targetPage");

							const delay = 1000;
							setTimeout(() => attemptScroll(attempts + 1), delay);
							return;
						}
					}

					const delay = attempts < 3 ? 100 : 200 + attempts * 100;
					setTimeout(() => attemptScroll(attempts + 1), delay);
				} else {
					sessionStorage.removeItem("scrollToReservation");
					sessionStorage.removeItem("targetPage");
					onNotFound?.(scrollTarget);
				}
			};

			requestAnimationFrame(() => attemptScroll());
		},
		[],
	);

	return {
		attemptCrossPageScroll,
		attemptCrossPageScrollWithPagination,
		navigateWithPageAndScroll,
		navigateWithScroll,
	};
}
