export default function FieldAgentLoading() {
  return (
    <div className="space-y-8">
      {/* Header Shimmer */}
      <div className="space-y-2">
        <div className="h-7 w-56 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-4 w-64 bg-slate-200 animate-pulse rounded-lg" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="h-3 w-28 bg-slate-200 animate-pulse rounded" />
            <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-lg" />
          </div>
        ))}
      </div>

      {/* Inspections List Shimmer */}
      <div className="card p-6 space-y-4">
        <div className="h-5 w-40 bg-slate-200 animate-pulse rounded-lg" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-5 rounded-xl bg-slate-50/50 border border-[#e9ecef]/50 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="h-4.5 w-32 bg-slate-200 animate-pulse rounded" />
                  <div className="h-3.5 w-48 bg-slate-200 animate-pulse rounded" />
                </div>
                <div className="h-6 w-24 bg-slate-200 animate-pulse rounded-full" />
              </div>
              <hr className="border-slate-100" />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="h-3 w-20 bg-slate-200 animate-pulse rounded" />
                  <div className="h-3.5 w-40 bg-slate-200 animate-pulse rounded" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 w-20 bg-slate-200 animate-pulse rounded" />
                  <div className="h-3.5 w-40 bg-slate-200 animate-pulse rounded" />
                </div>
              </div>
              <div className="h-10 w-full bg-slate-200 animate-pulse rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
