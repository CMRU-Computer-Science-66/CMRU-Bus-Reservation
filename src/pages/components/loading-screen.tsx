import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";

export function LoadingScreen() {
	return (
		<div className="relative min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
			<div className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
				<div className="container mx-auto px-4 py-4 sm:px-6">
					<div className="flex items-center justify-between gap-4">
						<div className="flex min-w-0 flex-1 items-center gap-3">
							<Skeleton className="h-9 w-9 rounded-xl sm:h-10 sm:w-10" />
							<div className="min-w-0 flex-1">
								<Skeleton className="mb-1 h-5 w-40 sm:h-6 sm:w-48" />
								<Skeleton className="h-3 w-24 sm:h-4 sm:w-32" />
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Skeleton className="hidden h-8 w-8 rounded-full md:block" />
							<Skeleton className="hidden h-8 w-16 rounded-md md:block" />
							<Skeleton className="hidden h-8 w-16 rounded-md md:block" />
							<Skeleton className="hidden h-8 w-16 rounded-md md:block" />
							<Skeleton className="hidden h-8 w-20 rounded-md md:block" />
							<Skeleton className="h-10 w-10 rounded-full md:hidden" />
							<Skeleton className="h-10 w-10 rounded-full md:hidden" />
							<Skeleton className="h-10 w-10 rounded-full md:hidden" />
						</div>
					</div>
				</div>
			</div>

			<div className="container mx-auto px-4 py-6 sm:px-6">
				<div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
					{[1, 2, 3, 4].map((index) => (
						<Card key={index} className="border-0 bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-900/90">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<Skeleton className="mb-1 h-3 w-16" />
										<Skeleton className="h-8 w-12" />
									</div>
									<Skeleton className="h-9 w-9 rounded-lg" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				<div className="mb-8">
					<div className="mb-4">
						<Skeleton className="mb-1 h-6 w-40" />
						<Skeleton className="h-4 w-24" />
					</div>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{[1, 2].map((index) => (
							<Card key={index} className="group border-0 bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-xl dark:bg-gray-900/90">
								<CardContent className="p-0">
									<div className="p-6 pb-4">
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<Skeleton className="h-4 w-4 rounded" />
													<Skeleton className="h-5 w-32 sm:h-6 sm:w-40" />
													<Skeleton className="h-5 w-12 rounded-full" />
												</div>
												<Skeleton className="mt-1.5 h-3 w-20" />
											</div>
											<Skeleton className="h-6 w-20 rounded-full" />
										</div>
									</div>
									<div className="mx-6 h-px bg-gray-200 dark:bg-gray-800"></div>
									<div className="space-y-4 p-6 pt-4">
										<div className="flex items-center gap-2">
											<Skeleton className="h-8 w-8 rounded-lg" />
											<div className="flex-1">
												<Skeleton className="mb-1 h-3 w-8" />
												<Skeleton className="h-4 w-16" />
											</div>
											<Skeleton className="h-6 w-20 rounded-lg" />
										</div>
										<div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
											<Skeleton className="h-11 w-full rounded-md" />
											<Skeleton className="h-11 w-full rounded-md" />
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>

				<div className="mb-4 flex items-center justify-between">
					<div>
						<Skeleton className="mb-1 h-6 w-36" />
						<Skeleton className="h-4 w-20" />
					</div>
				</div>

				<div className="space-y-6">
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2.5 shadow-md dark:bg-gray-700">
								<Skeleton className="h-4 w-4" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="ml-1 h-5 w-12 rounded-full" />
							</div>
							<div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
							<Skeleton className="h-5 w-12 rounded-full" />
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{[1, 2, 3].map((index) => (
								<Card key={index} className="group border-0 bg-white/90 shadow-md backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-xl dark:bg-gray-900/90">
									<CardContent className="p-0">
										<div className="p-6 pb-4">
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0 flex-1">
													<div className="flex flex-wrap items-center gap-2">
														<Skeleton className="h-4 w-4 rounded" />
														<Skeleton className="h-5 w-28 sm:h-6 sm:w-36" />
														{index === 1 && <Skeleton className="h-5 w-10 rounded-full" />}
													</div>
													<Skeleton className="mt-1.5 h-3 w-16" />
												</div>
												<Skeleton className="h-6 w-20 rounded-full" />
											</div>
										</div>

										<div className="mx-6 h-px bg-gray-200 dark:bg-gray-800"></div>

										<div className="space-y-4 p-6 pt-4">
											<div className="flex items-center gap-2">
												<Skeleton className="h-8 w-8 rounded-lg" />
												<div className="flex-1">
													<Skeleton className="mb-1 h-3 w-8" />
													<Skeleton className="h-4 w-16" />
												</div>
											</div>

											{index === 1 && (
												<div className="flex justify-center rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
													<Skeleton className="h-48 w-48 rounded-lg" />
												</div>
											)}

											<div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
												<Skeleton className="h-11 w-full rounded-md" />
												<Skeleton className="h-11 w-full rounded-md" />
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
