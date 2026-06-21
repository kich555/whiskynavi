import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Skeleton className="mb-6 h-8 w-24" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}