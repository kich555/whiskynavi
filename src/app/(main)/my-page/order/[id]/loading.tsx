import { Skeleton } from "@/components/ui/skeleton";

export default function OrderDetailLoading() {
  return (
    <div className="min-h-screen bg-[#1d2429] pt-10 pb-12 sm:pt-24">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
        <div className="mb-3 sm:mb-6">
          <Skeleton className="mb-2 h-6 w-24 bg-white/10 sm:mb-4" />
          <Skeleton className="mb-2 h-8 w-32 bg-white/10" />
          <Skeleton className="h-4 w-48 bg-white/10" />
        </div>

        <Skeleton className="mb-4 h-24 w-full bg-white/10 sm:mb-6" />

        <div className="border border-white/10 bg-white/5 p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.8fr_1fr] lg:gap-12">
            <div className="space-y-4">
              <Skeleton className="h-6 w-24 bg-white/10" />
              <div className="flex gap-4">
                <Skeleton className="h-40 w-40 bg-white/10" />
                <div className="flex-1 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full bg-white/10" />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 bg-white/10" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full bg-white/10" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
