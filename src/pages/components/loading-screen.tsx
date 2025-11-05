import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";

export function LoadingScreen() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
			<div className="container mx-auto space-y-4 p-4 sm:space-y-6 sm:p-6">
				<Card className="border-0 bg-white/90 shadow-lg backdrop-blur-md dark:bg-gray-900/90">
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center justify-between">
							<Skeleton className="h-8 w-48" />
							<div className="flex gap-2">
								<Skeleton className="h-10 w-10 rounded-md" />
								<Skeleton className="h-10 w-32 rounded-md" />
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{[1, 2, 3, 4].map((index) => (
						<Card key={index} className="border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
							<CardContent className="p-4">
								<Skeleton className="mb-2 h-4 w-20" />
								<Skeleton className="h-8 w-16" />
							</CardContent>
						</Card>
					))}
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3, 4, 5, 6].map((index) => (
						<Card key={index} className="border-0 bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-900/90">
							<CardContent className="space-y-3 p-4">
								<div className="flex justify-between">
									<Skeleton className="h-6 w-40" />
									<Skeleton className="h-6 w-24 rounded-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-10 w-full rounded-md" />
									<Skeleton className="h-10 w-full rounded-md" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}
