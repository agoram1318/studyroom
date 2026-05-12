function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[#E5E8EB] ${className ?? ""}`}
    />
  );
}

export default function StudyDetailLoading() {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="space-y-3 py-2">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* 전회차 자료 카드 */}
      <div className="rounded-[28px] border border-[#E5E8EB] bg-white p-5 md:p-6">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-1 h-4 w-64" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>

      {/* 회차별 피드백 자료 */}
      <section className="space-y-4">
        <Skeleton className="h-6 w-40" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[28px] border border-[#E5E8EB] bg-white p-5 md:p-6"
          >
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-6 w-1/2" />
            <Skeleton className="mt-1 h-4 w-3/4" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
