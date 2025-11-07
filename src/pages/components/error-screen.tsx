import { AlertCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

interface ErrorScreenProperties {
	error: string;
	onRetry: () => void;
}

export function ErrorScreen({ error, onRetry }: ErrorScreenProperties) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
			<Card className="w-full max-w-md border-0 bg-white/90 shadow-2xl backdrop-blur-md dark:bg-gray-900/90">
				<CardContent className="p-6">
					<Alert variant="destructive" className="border-red-200 dark:border-red-900">
						<AlertCircle className="h-5 w-5" />
						<AlertTitle className="mb-2 text-lg font-semibold">เกิดข้อผิดพลาด</AlertTitle>
						<AlertDescription className="mb-4 text-sm">{error}</AlertDescription>
					</Alert>
					<Button onClick={onRetry} className="mt-4 w-full" size="lg">
						<RefreshCw className="mr-2 h-5 w-5" />
						ลองอีกครั้ง
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
