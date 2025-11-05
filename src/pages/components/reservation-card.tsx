import type { ScheduleReservation } from "@cmru-comsci-66/cmru-api";
import { CheckCircle2, Clock, Loader2, MapPin, QrCode, XCircle } from "lucide-react";

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
}

export function ReservationCard({ actionLoading, item, onCancel, onConfirm }: ReservationCardProperties) {
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
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<CardTitle className="flex flex-wrap items-center gap-2 text-base">
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

			<CardContent className="space-y-4 p-4">
				<div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
					<div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900">
						<Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
					</div>
					<div>
						<p className="text-xs font-medium text-gray-500 dark:text-gray-400">เวลา</p>
						<p className="text-sm font-semibold">{formatTime(item.departureTime)}</p>
					</div>
				</div>

				{(item.confirmation.canConfirm || item.confirmation.canCancel) && !item.travelStatus.hasCompleted && (
					<div className="flex flex-col gap-2 sm:flex-row">
						{item.confirmation.canConfirm && !item.confirmation.isConfirmed && onConfirm && (
							<Button
								onClick={() => onConfirm(item)}
								disabled={actionLoading === item.id}
								className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500"
								size="sm">
								{actionLoading === item.id ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										<span className="text-xs">กำลังดำเนินการ...</span>
									</>
								) : (
									<>
										<CheckCircle2 className="h-4 w-4" />
										<span className="text-xs">ยืนยันการจอง</span>
									</>
								)}
							</Button>
						)}
						{item.confirmation.canCancel && onCancel && (
							<Button
								onClick={() => onCancel(item)}
								disabled={actionLoading === item.id}
								variant="outline"
								className="h-11 flex-1 gap-2 border-red-200 text-red-600 shadow-sm transition-all hover:scale-105 hover:border-red-300 hover:bg-red-50 hover:text-red-700 hover:shadow-lg active:scale-95 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
								size="sm">
								{actionLoading === item.id ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										<span className="text-sm">กำลังดำเนินการ...</span>
									</>
								) : (
									<>
										<XCircle className="h-4 w-4" />
										<span className="text-sm">ยกเลิกการจอง</span>
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
