export default function NewsLoading() {
  return (
    <div className="mx-auto mt-20 min-h-screen max-w-[1440px] bg-[#1d2429]">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* 탭 skeleton */}
        <div className="mb-6 flex gap-4">
          <div className="h-8 w-20 animate-pulse rounded bg-white/10" />
          <div className="h-8 w-20 animate-pulse rounded bg-white/10" />
        </div>

        {/* 카드 skeleton */}
        <div className="space-y-3">
          <div className="h-16 w-full animate-pulse rounded-xl border border-white/10 bg-white/5" />
          <div className="h-16 w-full animate-pulse rounded-xl border border-white/10 bg-white/5" />
          <div className="h-16 w-full animate-pulse rounded-xl border border-white/10 bg-white/5" />
          <div className="h-16 w-full animate-pulse rounded-xl border border-white/10 bg-white/5" />
          <div className="h-16 w-full animate-pulse rounded-xl border border-white/10 bg-white/5" />
        </div>
      </div>
    </div>
  );
}
