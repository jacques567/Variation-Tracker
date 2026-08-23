export function Skeleton({ className = '' }: { className?: string }) {
  const hasRadius = /\brounded(-\w+)?\b/.test(className)
  return <div className={`skeleton-shimmer ${hasRadius ? '' : 'rounded'} ${className}`} />
}

export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <Skeleton className="h-3 w-24 mt-2" />
          <Skeleton className="h-3 w-40 mt-2" />
        </div>
        <div className="text-right shrink-0 flex items-center gap-2">
          <div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12 mt-2 ml-auto" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

export function JobListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading jobs">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CategoryRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-14 mt-2" />
      </div>
      <Skeleton className="h-4 w-4" />
    </div>
  )
}

export function CategoryListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading categories">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryRowSkeleton key={i} />
      ))}
    </div>
  )
}

export function JobDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading job">
      <Skeleton className="h-4 w-20 mb-6" />

      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-6">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
    </div>
  )
}
