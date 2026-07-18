export default function ProjectsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Shimmer */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-4 w-12 bg-slate-200 animate-pulse rounded" />
          <div className="h-4 w-4 bg-slate-200 animate-pulse rounded" />
          <div className="h-4.5 w-24 bg-slate-200 animate-pulse rounded-full" />
        </div>
        <div className="h-8 w-40 bg-slate-200 animate-pulse rounded-lg mt-2" />
      </div>

      {/* Projects Grid Shimmer */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-5 space-y-4 border border-[#e9ecef]/50">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="h-4.5 w-24 bg-slate-200 animate-pulse rounded" />
                <div className="h-3.5 w-32 bg-slate-200 animate-pulse rounded" />
              </div>
              <div className="h-6 w-20 bg-slate-200 animate-pulse rounded-full" />
            </div>

            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-200 animate-pulse rounded" />
              <div className="h-3 w-2/3 bg-slate-200 animate-pulse rounded" />
            </div>

            <hr className="border-slate-100" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
              <div className="space-y-1">
                <div className="h-3 w-20 bg-slate-200 animate-pulse rounded" />
                <div className="h-2.5 w-24 bg-slate-200 animate-pulse rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
