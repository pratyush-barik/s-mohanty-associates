export default function PortalLoading() {
  return (
    <div className="space-y-6">
      {/* Header Shimmer */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-4 w-72 bg-slate-200 animate-pulse rounded-lg" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6 space-y-4">
            <div className="h-4.5 w-24 bg-slate-200 animate-pulse rounded" />
            <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-lg" />
          </div>
        ))}
      </div>

      {/* Details Card List Shimmer */}
      <div className="card p-6 space-y-4">
        <div className="h-5 w-40 bg-slate-200 animate-pulse rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-[#e9ecef]/50">
              <div className="space-y-2">
                <div className="h-4.5 w-40 bg-slate-200 animate-pulse rounded" />
                <div className="h-3 w-60 bg-slate-200 animate-pulse rounded" />
              </div>
              <div className="h-6 w-20 bg-slate-200 animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
