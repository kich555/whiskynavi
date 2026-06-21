export default function PostDetailLoading() {
  return (
    <div className="mx-auto mt-20 min-h-screen max-w-[1440px] bg-[#1d2429]">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* 뒤로가기 skeleton */}
        <div className="mb-6 h-4 w-16 animate-pulse rounded bg-white/10" />

        {/* 카드 skeleton */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 h-8 w-3/4 animate-pulse rounded bg-white/10" />
          <div className="mb-8 h-4 w-1/3 animate-pulse rounded bg-white/10" />
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-white/10" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}