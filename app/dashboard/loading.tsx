function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[#E5E8EB] ${className ?? ""}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      {/* 히어로 섹션 */}
      <section className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3 py-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
        </div>
        <div className="min-h-[260px] rounded-[28px] bg-[#191F28] p-7">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 bg-white/10" />
            <Skeleton className="h-8 w-40 bg-white/10" />
            <Skeleton className="h-8 w-32 bg-white/10" />
          </div>
        </div>
      </section>

      {/* 최근 업데이트 섹션 */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="rounded-[22px] bg-[#E8F3FF] p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-14 rounded-full bg-[#C2D9FF]" />
                <Skeleton className="h-6 w-14 rounded-full bg-[#C2D9FF]" />
              </div>
              <Skeleton className="h-6 w-72 bg-[#C2D9FF]" />
              <Skeleton className="h-4 w-96 max-w-full bg-[#C2D9FF]" />
            </div>
            <Skeleton className="h-11 w-24 rounded-2xl bg-[#C2D9FF]" />
          </div>
        </div>
      </section>

      {/* 내 스터디 섹션 */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[24px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)]"
            >
              <div className="mb-3 flex gap-2">
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="mt-2 h-4 w-full" />
              <div className="mt-5 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <Skeleton className="mt-5 h-5 w-24" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
