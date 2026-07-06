import type { UserBottleReservationNoticePublicResponse } from "@/apis/generated/api";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import Hero from "../_components/Hero";
import ActiveReservationSection from "./_components/ActiveReservationSection";
import EmptyState from "./_components/EmptyState";
import RecentEndedSection from "./_components/RecentEndedSection";
import UnauthenticatedGuard from "./_components/UnauthenticatedGuard";
import { fetchActiveNotices } from "./_lib/fetchActiveNotices";
import { fetchRecentEndedNotices } from "./_lib/fetchRecentEndedNotices";

function normalizeActiveNotices(data: unknown): UserBottleReservationNoticePublicResponse[] {
  if (Array.isArray(data)) {
    return data as UserBottleReservationNoticePublicResponse[];
  }

  if (data && typeof data === "object") {
    const page = data as {
      content?: UserBottleReservationNoticePublicResponse[];
      id?: number;
    };

    if (Array.isArray(page.content)) {
      return page.content;
    }

    if (typeof page.id === "number") {
      return [page as UserBottleReservationNoticePublicResponse];
    }
  }

  return [];
}

export default async function ReservationPage() {
  const session = await getServerSession(authOptions);

  // 비로그인 사용자: 로그인 유도
  if (!session) {
    return (
      <div className="min-h-screen bg-[#1d2429]">
        <Hero backgroundText="RESERVE" title="예약하기" subtitle="위스키내비의 신규 출시 제품을 예약하세요." />
        <div className="mx-auto max-w-[1440px] px-4 pt-3 pb-12 lg:px-10 lg:pt-2">
          <UnauthenticatedGuard />
        </div>
      </div>
    );
  }

  // 병렬 API 호출 (캐시 적용: 30s / 5min)
  const [activeData, recentEndedData] = await Promise.all([
    fetchActiveNotices().catch(() => null),
    fetchRecentEndedNotices().catch(() => null),
  ]);

  const activeNotices = normalizeActiveNotices(activeData);

  const recentEndedNotices = recentEndedData ?? [];

  const hasNoData = activeNotices.length === 0 && recentEndedNotices.length === 0;

  return (
    <div className="min-h-screen bg-[#1d2429]">
      <Hero backgroundText="RESERVE" title="예약하기" subtitle="위스키내비의 신규 출시 제품을 예약하세요." />
      <div className="mx-auto max-w-[1440px] px-4 pt-3 pb-12 lg:px-10 lg:pt-2">
        <main className="flex-1 bg-[#1d2429]">
          {hasNoData ? (
            <EmptyState />
          ) : (
            <>
              <ActiveReservationSection notices={activeNotices} />
              <RecentEndedSection notices={recentEndedNotices} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
