export default function MyProjectsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Shimmer */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-4 w-72 bg-slate-200 animate-pulse rounded-lg" />
      </div>

      {/* Projects List Shimmer */}
      <div className="card p-6 space-y-4">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-[#e9ecef]/50 gap-4">
              <div className="space-y-2">
                <div className="h-4.5 w-56 bg-slate-200 animate-pulse rounded" />
                <div className="h-3.5 w-96 max-w-full bg-slate-200 animate-pulse rounded" />
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="h-6 w-24 bg-slate-200 animate-pulse rounded-full" />
                <div className="h-8 w-8 bg-slate-200 animate-pulse rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
