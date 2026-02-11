export default function ProductListSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
                <div className="h-10 w-64 bg-gray-200 dark:bg-zinc-800 rounded-lg"></div>
                <div className="h-10 w-32 bg-gray-200 dark:bg-zinc-800 rounded-lg"></div>
            </div>

            {/* Filter Bar Skeleton */}
            <div className="flex gap-4">
                <div className="flex-1 h-12 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
                <div className="w-48 h-12 bg-gray-200 dark:bg-zinc-800 rounded-xl hidden sm:block"></div>
            </div>

            {/* List Header Skeleton */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-100 dark:bg-zinc-800/50 rounded-lg">
                <div className="col-span-5 h-4 bg-gray-300 dark:bg-zinc-700 rounded w-24"></div>
                <div className="col-span-3 h-4 bg-gray-300 dark:bg-zinc-700 rounded w-20"></div>
                <div className="col-span-2 h-4 bg-gray-300 dark:bg-zinc-700 rounded w-16"></div>
                <div className="col-span-2 h-4 bg-gray-300 dark:bg-zinc-700 rounded w-16"></div>
            </div>

            {/* List Items Skeleton */}
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col md:grid md:grid-cols-12 gap-4 items-center p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xs">
                    {/* Image \u0026 Name */}
                    <div className="col-span-5 flex items-center gap-4 w-full">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-zinc-800 rounded-lg shrink-0"></div>
                        <div className="space-y-2 flex-1">
                            <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-1/2"></div>
                        </div>
                    </div>
                    {/* Category */}
                    <div className="col-span-3 w-full md:w-auto">
                        <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded-full w-24"></div>
                    </div>
                    {/* Price */}
                    <div className="col-span-2 w-full md:w-auto">
                        <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded w-16"></div>
                    </div>
                    {/* Status */}
                    <div className="col-span-2 w-full md:w-auto flex justify-end">
                        <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded-full w-20"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
