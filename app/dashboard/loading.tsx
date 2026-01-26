import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Overdue Tasks Skeleton */}
                <div className="rounded-xl border border-white/10 bg-[#151515] p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                </div>

                {/* Due Today Skeleton */}
                <div className="rounded-xl border border-white/10 bg-[#151515] p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                </div>

                {/* Follow-ups Skeleton */}
                <div className="rounded-xl border border-white/10 bg-[#151515] p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-500/10">
                            <Skeleton className="h-6 w-6" />
                        </div>
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    )
}
