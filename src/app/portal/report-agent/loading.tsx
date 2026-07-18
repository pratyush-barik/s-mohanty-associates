export default function ReportAgentLoading() {
  return (
    <div className="space-y-8">
      {/* Header Shimmer */}
      <div className="space-y-2">
        <div className="h-7 w-56 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-4 w-64 bg-slate-200 animate-pulse rounded-lg" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="h-3 w-28 bg-slate-200 animate-pulse rounded" />
            <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-lg" />
          </div>
        ))}
      </div>

      {/* Reports List Shimmer */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-slate-200 animate-pulse rounded-lg" />
          <div className="h-4 w-16 bg-slate-200 animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-[#e9ecef]/50">
              <div className="space-y-2">
                <div className="h-4.5 w-32 bg-slate-200 animate-pulse rounded" />
                <div className="h-3.5 w-48 bg-slate-200 animate-pulse rounded" />
              </div>
              <div className="h-6 w-24 bg-slate-200 animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
