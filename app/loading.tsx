
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-6 border-b border-white/10 pb-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
            </div>

            {/* Search and Filter Skeleton */}
            <div className="flex gap-4 items-center">
                <Skeleton className="h-10 flex-1 max-w-md" />
                <Skeleton className="h-10 w-24" />
            </div>

            {/* Table Skeleton */}
            <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <Skeleton className="h-6 w-1/5" />
                    <Skeleton className="h-6 w-1/5" />
                    <Skeleton className="h-6 w-1/5" />
                    <Skeleton className="h-6 w-1/5" />
                    <Skeleton className="h-6 w-1/5" />
                </div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-white/5">
                        <Skeleton className="h-12 w-1/5" />
                        <Skeleton className="h-4 w-1/5" />
                        <Skeleton className="h-4 w-1/5" />
                        <Skeleton className="h-6 w-1/5 rounded-full" />
                        <Skeleton className="h-10 w-1/5" />
                    </div>
                ))}
            </div>
        </div>
    )
}
