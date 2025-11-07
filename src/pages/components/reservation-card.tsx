import type { ScheduleReservation } from "@cmru-comsci-66/cmru-api";
import { CheckCircle2, Clock, Loader2, MapPin, QrCode, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent } from "../../components/ui/dialog";
import { Separator } from "../../components/ui/separator";
import { Skeleton } from "../../components/ui/skeleton";
import { API_CONFIG, getApiUrl } from "../../config/api";
import { formatTime } from "../../lib/time-formatter";

interface ReservationCardProperties {
	actionLoading: number | null;
	isLoading?: boolean;
	item?: ScheduleReservation;
	onCancel?: (item: ScheduleReservation) => void;
	onConfirm?: (item: ScheduleReservation) => void;
	oneClickMode?: boolean;
	refreshTrigger?: number;
	showTimeLeft?: boolean;
}

export function ReservationCard({ actionLoading, isLoading = false, item, onCancel, onConfirm, oneClickMode = false, refreshTrigger, showTimeLeft }: ReservationCardProperties) {
	const [currentTime, setCurrentTime] = useState(new Date());
	const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
	const [qrImageError, setQrImageError] = useState(false);
	const [qrLoading, setQrLoading] = useState(false);
	const [qrDialogOpen, setQrDialogOpen] = useState(false);
	const [qrCountdownInterval, setQrCountdownInterval] = useState<NodeJS.Timeout | null>(null);
	const [qrCountdown, setQrCountdown] = useState<number>(0);

	const loadQRCode = useCallback(async () => {
		if (!item?.ticket.hasQRCode || !item?.ticket.id) {
			setQrCodeUrl(null);
			setQrImageError(false);
			return;
		}

		setQrLoading(true);
		setQrImageError(false);
		try {
			const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.BUS.TICKET_INFO}?ticketId=${item.ticket.id}`), {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const ticketInfo = await response.json();
				if (ticketInfo?.qrCode?.imageUrl) {
					const qrUrl = ticketInfo.qrCode.imageUrl.startsWith("http") ? ticketInfo.qrCode.imageUrl : `https://cmrubus.cmru.ac.th${ticketInfo.qrCode.imageUrl}`;
					setQrCodeUrl(qrUrl);
				} else {
					setQrImageError(true);
				}
			} else {
				setQrImageError(true);
			}
		} catch {
			setQrImageError(true);
		} finally {
			setQrLoading(false);
		}
	}, [item?.ticket.hasQRCode, item?.ticket.id]);

	useEffect(() => {
		if (!showTimeLeft) return;

		const interval = setInterval(() => {
			setCurrentTime(new Date());
		}, 60_000);

		return () => clearInterval(interval);
	}, [showTimeLeft]);

	useEffect(() => {
		if (!item) return;
		loadQRCode();
	}, [item, loadQRCode]);

	useEffect(() => {
		if (refreshTrigger && item?.ticket.hasQRCode) {
			loadQRCode();
		}
	}, [refreshTrigger, item?.ticket.hasQRCode, loadQRCode]);

	useEffect(() => {
		if (qrDialogOpen && item?.ticket.hasQRCode) {
			if (qrCountdown === 0) {
				const now = Date.now();
				const secondsElapsed = Math.floor(now / 1000) % 60;
				const initialCountdown = 60 - secondsElapsed;
				setQrCountdown(initialCountdown);
			}

			const interval = setInterval(() => {
				setQrCountdown((previous) => {
					if (previous <= 1) {
						loadQRCode();
						return 60;
					}
					return previous - 1;
				});
			}, 1000);

			setQrCountdownInterval(interval);

			return () => {
				if (interval) {
					clearInterval(interval);
				}
				setQrCountdownInterval(null);
				setQrCountdown(0);
			};
		} else {
			if (qrCountdownInterval) {
				clearInterval(qrCountdownInterval);
				setQrCountdownInterval(null);
			}
			setQrCountdown(0);
		}
	}, [qrDialogOpen, item?.ticket.hasQRCode, loadQRCode]);

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden && qrDialogOpen && item?.ticket.hasQRCode) {
				const now = Date.now();
				const currentSecond = Math.floor(now / 1000) % 60;
				const countdown = 60 - currentSecond;
				setQrCountdown(countdown);
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [qrDialogOpen, item?.ticket.hasQRCode]);

	const getTimeLeft = () => {
		if (!showTimeLeft || !item) return null;

		const [hours, minutes] = (item.departureTime?.replace(".", ":") || "00:00").split(":");
		const departureTime = new Date();
		departureTime.setHours(Number.parseInt(hours || "0", 10), Number.parseInt(minutes || "0", 10), 0, 0);

		if (departureTime <= currentTime) return null;

		const diff = departureTime.getTime() - currentTime.getTime();
		const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
		const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		return { hoursLeft, minutesLeft };
	};

	if (isLoading || !item) {
		return (
			<Card className="group border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
				<CardHeader>
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0 flex-1">
							<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
								<Skeleton className="h-4 w-4" />
								<Skeleton className="h-5 w-32" />
							</CardTitle>
							<Skeleton className="mt-1.5 h-3 w-20" />
						</div>
						<Skeleton className="h-6 w-20 rounded-full" />
					</div>
				</CardHeader>

				<Separator className="dark:bg-gray-800" />

				<CardContent className="space-y-4">
					<div className="flex items-center gap-2">
						<div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
							<Skeleton className="h-4 w-4" />
						</div>
						<div className="flex-1">
							<Skeleton className="mb-1 h-3 w-8" />
							<Skeleton className="h-4 w-16" />
						</div>
					</div>

					<div className="flex flex-col gap-2 sm:flex-row">
						<Skeleton className="h-11 flex-1" />
						<Skeleton className="h-11 flex-1" />
					</div>
				</CardContent>
			</Card>
		);
	}

	const timeLeft = getTimeLeft();
	const getStatusBadge = (item: ScheduleReservation) => {
		if (item.travelStatus.hasCompleted === true) {
			return (
				<Badge variant="default" className="gap-1.5 bg-green-600 px-3 py-1.5 text-xs font-medium hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600">
					<CheckCircle2 className="h-3.5 w-3.5" />
					เดินทางแล้ว
				</Badge>
			);
		}

		if (item.travelStatus.hasCompleted === false) {
			return (
				<Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs font-medium dark:bg-gray-700 dark:text-gray-300">
					<XCircle className="h-3.5 w-3.5" />
					ไม่ได้เดินทาง
				</Badge>
			);
		}

		if (item.confirmation.isConfirmed) {
			return (
				<Badge variant="default" className="gap-1.5 bg-blue-600 px-3 py-1.5 text-xs font-medium hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
					<CheckCircle2 className="h-3.5 w-3.5" />
					ยืนยันแล้ว
				</Badge>
			);
		}

		return (
			<Badge variant="default" className="gap-1.5 bg-amber-600 px-3 py-1.5 text-xs font-medium hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600">
				<Clock className="h-3.5 w-3.5" />
				รอยืนยัน
			</Badge>
		);
	};

	return (
		<Card className="group border-0 bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-xl dark:bg-gray-900/90">
			<CardHeader>
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
							<MapPin className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
							<span className="font-bold text-gray-900 dark:text-white">{item.destination.name}</span>
							{item.ticket.hasQRCode && (
								<Badge variant="outline" className="gap-1 border-purple-300 bg-purple-50 text-purple-600 dark:border-purple-600 dark:bg-purple-950 dark:text-purple-400">
									<QrCode className="h-3 w-3" />
									<span className="text-xs">QR</span>
								</Badge>
							)}
						</CardTitle>
						<CardDescription className="mt-1.5 text-xs dark:text-gray-400">{item.ticket.status || "รอเดินทาง"}</CardDescription>
					</div>
					{getStatusBadge(item)}
				</div>
			</CardHeader>

			<Separator className="dark:bg-gray-800" />

			<CardContent className="space-y-4">
				<div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
					<div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900">
						<Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
					</div>
					<div className="flex-1">
						<p className="text-xs font-medium text-gray-500 dark:text-gray-400">เวลา</p>
						<p className="text-sm font-semibold">{formatTime(item.departureTime)}</p>
					</div>
					{timeLeft && (
						<div className="flex items-center gap-1.5 rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-300">
							<Clock className="h-3.5 w-3.5" />
							<span>
								อีก {timeLeft.hoursLeft > 0 && `${timeLeft.hoursLeft} ชม.`} {timeLeft.minutesLeft} นาที
							</span>
						</div>
					)}
				</div>

				{item.ticket.hasQRCode && (
					<div className="flex justify-center rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
						{qrLoading ? (
							<div className="flex h-48 w-48 items-center justify-center">
								<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
							</div>
						) : qrCodeUrl && !qrImageError ? (
							<button
								type="button"
								onClick={() => {
									setQrDialogOpen(true);
									loadQRCode();
								}}
								className="cursor-pointer transition-transform hover:scale-105">
								<img
									src={qrCodeUrl}
									alt="QR Code สำหรับขึ้นรถ"
									className="h-48 w-48 rounded-lg"
									onError={() => {
										setQrImageError(true);
									}}
								/>
							</button>
						) : (
							<div className="flex h-48 w-48 flex-col items-center justify-center gap-2">
								<QrCode className="h-16 w-16 text-gray-400" />
								{qrImageError && <p className="text-center text-xs text-gray-500 dark:text-gray-400">ไม่สามารถโหลด QR Code ได้</p>}
							</div>
						)}
					</div>
				)}

				{(item.confirmation.canConfirm || item.confirmation.canCancel) && !item.travelStatus.hasCompleted && (
					<div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
						{oneClickMode ? (
							<>
								{item.confirmation.canConfirm && !item.confirmation.isConfirmed && onConfirm && (
									<Button
										onClick={() => onConfirm(item)}
										disabled={actionLoading === item.id}
										className="h-11 w-full gap-2 rounded-md bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium shadow-lg hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500">
										{actionLoading === item.id ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin" />
												<span>กำลังดำเนินการ...</span>
											</>
										) : (
											<>
												<CheckCircle2 className="h-4 w-4" />
												<span>ยืนยันการจอง</span>
											</>
										)}
									</Button>
								)}
								{item.confirmation.canCancel && onCancel && (
									<Button
										onClick={() => onCancel(item)}
										disabled={actionLoading === item.id}
										variant="outline"
										className="h-11 w-full gap-2 rounded-md border-red-200 px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-all hover:scale-105 hover:border-red-300 hover:bg-red-50 hover:text-red-700 hover:shadow-lg active:scale-95 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
										{actionLoading === item.id ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin" />
												<span>กำลังดำเนินการ...</span>
											</>
										) : (
											<>
												<XCircle className="h-4 w-4" />
												<span>ยกเลิกการจอง</span>
											</>
										)}
									</Button>
								)}
							</>
						) : (
							<>
								{item.confirmation.canConfirm && !item.confirmation.isConfirmed && onConfirm && (
									<Button
										onClick={() => onConfirm(item)}
										disabled={actionLoading === item.id}
										className="h-11 flex-1 gap-2 rounded-md bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium shadow-lg hover:from-blue-700 hover:to-indigo-700 sm:h-11 dark:from-blue-500 dark:to-indigo-500">
										{actionLoading === item.id ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin" />
												<span>กำลังดำเนินการ...</span>
											</>
										) : (
											<>
												<CheckCircle2 className="h-4 w-4" />
												<span>ยืนยันการจอง</span>
											</>
										)}
									</Button>
								)}
								{((item.confirmation.canCancel && item.confirmation.isConfirmed) || (item.confirmation.canConfirm && !item.confirmation.isConfirmed)) && onCancel && (
									<Button
										onClick={() => onCancel(item)}
										disabled={actionLoading === item.id}
										variant="outline"
										className="h-11 flex-1 gap-2 rounded-md border-red-200 px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-all hover:scale-105 hover:border-red-300 hover:bg-red-50 hover:text-red-700 hover:shadow-lg active:scale-95 sm:h-11 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
										{actionLoading === item.id ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin" />
												<span>กำลังดำเนินการ...</span>
											</>
										) : (
											<>
												<XCircle className="h-4 w-4" />
												<span>{item.confirmation.isConfirmed ? "ยกเลิกการยืนยัน" : "ยกเลิกการจอง"}</span>
											</>
										)}
									</Button>
								)}
							</>
						)}
					</div>
				)}
			</CardContent>

			<Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
				<DialogContent className="max-w-lg">
					<div className="flex flex-col items-center gap-4 p-6">
						<div className="flex w-full items-center justify-between">
							<div className="flex flex-col">
								<h3 className="text-lg font-semibold">QR Code สำหรับขึ้นรถ</h3>
								{qrCountdown > 0 && <p className="text-xs text-gray-500 dark:text-gray-400">รีโหลดอัตโนมัติใน {qrCountdown} วินาที</p>}
							</div>
							<Button
								onClick={() => {
									loadQRCode();
									setQrCountdown(60);
								}}
								variant="outline"
								size="sm"
								className="gap-1 text-xs"
								disabled={qrLoading}>
								{qrLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "รีเฟรช"}
							</Button>
						</div>
						<div className="relative">
							<div className="flex h-80 w-80 items-center justify-center rounded-lg bg-gray-100 sm:h-96 sm:w-96 dark:bg-gray-800">
								{qrLoading ? (
									<Loader2 className="h-12 w-12 animate-spin text-gray-400" />
								) : qrCodeUrl && !qrImageError ? (
									<img src={qrCodeUrl} alt="QR Code สำหรับขึ้นรถ" className="h-full w-full rounded-lg object-contain p-2" onError={() => setQrImageError(true)} />
								) : (
									<QrCode className="h-20 w-20 text-gray-400" />
								)}
							</div>
							{qrImageError && !qrLoading && <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">ไม่สามารถโหลด QR Code ได้</p>}
						</div>
						<div className="text-center">
							<p className="text-base font-semibold text-gray-800 dark:text-gray-200">{item.destination.name}</p>
							<p className="text-sm text-gray-600 dark:text-gray-400">เวลาออกเดินทาง: {formatTime(item.departureTime)}</p>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
