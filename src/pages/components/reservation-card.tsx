import type { ScheduleReservation } from "@cmru-comsci-66/cmru-api";
import { CheckCircle2, Clock, Loader2, MapPin, QrCode, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { formatTime } from "../../lib/time-formatter";

interface ReservationCardProperties {
	actionLoading: number | null;
	item: ScheduleReservation;
	onCancel?: (item: ScheduleReservation) => void;
	onConfirm?: (item: ScheduleReservation) => void;
	showTimeLeft?: boolean;
}

export function ReservationCard({ actionLoading, item, onCancel, onConfirm, showTimeLeft }: ReservationCardProperties) {
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		if (!showTimeLeft) return;

		const interval = setInterval(() => {
			setCurrentTime(new Date());
		}, 60_000);

		return () => clearInterval(interval);
	}, [showTimeLeft]);

	const getTimeLeft = () => {
		if (!showTimeLeft) return null;

		const [hours, minutes] = (item.departureTime?.replace(".", ":") || "00:00").split(":");
		const departureTime = new Date();
		departureTime.setHours(Number.parseInt(hours || "0", 10), Number.parseInt(minutes || "0", 10), 0, 0);

		if (departureTime <= currentTime) return null;

		const diff = departureTime.getTime() - currentTime.getTime();
		const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
		const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		return { hoursLeft, minutesLeft };
	};

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

				{(item.confirmation.canConfirm || item.confirmation.canCancel) && !item.travelStatus.hasCompleted && (
					<div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
						{item.confirmation.canConfirm && !item.confirmation.isConfirmed && onConfirm && (
							<Button
								onClick={() => onConfirm(item)}
								disabled={actionLoading === item.id}
								className="h-11 flex-1 gap-2 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium shadow-lg hover:from-blue-700 hover:to-indigo-700 sm:h-11 dark:from-blue-500 dark:to-indigo-500">
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
								className="h-11 flex-1 gap-2 rounded-md border-red-200 px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-all hover:scale-105 hover:border-red-300 hover:bg-red-50 hover:text-red-700 hover:shadow-lg active:scale-95 sm:h-11 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
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
					</div>
				)}
			</CardContent>
		</Card>
	);
}
