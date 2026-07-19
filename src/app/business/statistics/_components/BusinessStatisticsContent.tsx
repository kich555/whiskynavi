import type {
  PagedModelUserBottleReservationPickupNoticeStageStatisticsResponse,
  UserBottleReservationPickupNoticeStageStatisticsResponse,
} from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import BusinessHeader from "../../_components/BusinessHeader";

interface BusinessStatisticsContentProps {
  statistics: PagedModelUserBottleReservationPickupNoticeStageStatisticsResponse;
  selectedBusinessId?: number;
}

const NOTICE_PAGE_SIZE = 5;

const numberFormatter = new Intl.NumberFormat("ko-KR");

const formatBottleCount = (value?: number) => `${numberFormatter.format(value ?? 0)}병`;

const getRate = (quantity: number | undefined, base: number | undefined) => {
  if (!base) return 0;
  return Math.min(100, Math.round(((quantity ?? 0) / base) * 100));
};

const stageColors = {
  approved: "#2563eb",
  paymentCompleted: "#0891b2",
  waitingPickup: "#d97706",
  received: "#059669",
};

function StageProgress({
  label,
  quantity,
  rate,
  color,
}: {
  label: string;
  quantity?: number;
  rate: number;
  color: string;
}) {
  return (
    <div className="flex min-w-[120px] items-center gap-3">
      <div
        className="relative grid size-16 shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(${color} ${rate * 3.6}deg, #e5e7eb 0deg)` }}
      >
        <div className="grid size-12 place-items-center rounded-full bg-white typo-bold-12 text-gray-900">
          {rate}%
        </div>
      </div>
      <div>
        <p className="typo-bold-12 text-gray-500">{label}</p>
        <p className="mt-1 typo-bold-14 text-gray-900">{formatBottleCount(quantity)}</p>
      </div>
    </div>
  );
}

function NoticeStageCard({ notice }: { notice: UserBottleReservationPickupNoticeStageStatisticsResponse }) {
  const approvedQuantity = notice.approvedQuantity ?? 0;
  const noticeId = notice.noticeId;

  return (
    <article className="border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-gray-900">{notice.bottleName ?? "이름 없는 공고"}</h3>
          <p className="mt-1 typo-medium-12 text-gray-500">공고 #{noticeId ?? "-"}</p>
        </div>
        {noticeId ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/business/pickup-reservations/notices/${noticeId}`}>상세</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            상세
          </Button>
        )}
      </div>

      <div className="grid gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-4">
        <StageProgress
          label="승인"
          quantity={notice.approvedQuantity}
          rate={getRate(approvedQuantity, approvedQuantity)}
          color={stageColors.approved}
        />
        <StageProgress
          label="결제완료"
          quantity={notice.paymentCompletedQuantity}
          rate={getRate(notice.paymentCompletedQuantity, approvedQuantity)}
          color={stageColors.paymentCompleted}
        />
        <StageProgress
          label="픽업대기"
          quantity={notice.waitingPickupQuantity}
          rate={getRate(notice.waitingPickupQuantity, approvedQuantity)}
          color={stageColors.waitingPickup}
        />
        <StageProgress
          label="수령완료"
          quantity={notice.receivedQuantity}
          rate={getRate(notice.receivedQuantity, approvedQuantity)}
          color={stageColors.received}
        />
      </div>
    </article>
  );
}

function NoticePagination({
  page,
  selectedBusinessId,
}: {
  page?: PagedModelUserBottleReservationPickupNoticeStageStatisticsResponse["page"];
  selectedBusinessId?: number;
}) {
  const currentPage = (page?.number ?? 0) + 1;
  const totalPages = Math.max(page?.totalPages ?? 0, 1);
  const totalElements = page?.totalElements ?? 0;
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  if (totalElements <= NOTICE_PAGE_SIZE) {
    return <p className="typo-medium-14 text-gray-500">총 {numberFormatter.format(totalElements)}개 공고</p>;
  }

  const pageHref = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (selectedBusinessId) {
      params.set("businessId", String(selectedBusinessId));
    }
    params.set("page", String(pageNumber));
    return `/business/statistics?${params.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-gray-200 bg-white px-4 py-3">
      <p className="typo-medium-14 text-gray-500">총 {numberFormatter.format(totalElements)}개 공고</p>
      <div className="flex items-center gap-2">
        {hasPrevious ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={pageHref(currentPage - 1)}>
              <ChevronLeft size={16} />
              이전
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft size={16} />
            이전
          </Button>
        )}
        <span className="min-w-14 text-center typo-semibold-14 text-gray-700">
          {currentPage}/{totalPages}
        </span>
        {hasNext ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={pageHref(currentPage + 1)}>
              다음
              <ChevronRight size={16} />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            다음
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function BusinessStatisticsContent({ statistics, selectedBusinessId }: BusinessStatisticsContentProps) {
  const notices = statistics.content ?? [];

  return (
    <>
      <BusinessHeader title="공고별 예약 통계" />

      <div className="space-y-4 p-6">
        {notices.length === 0 ? (
          <div className="border border-gray-200 bg-white px-4 py-16 text-center typo-medium-14 text-gray-500">
            표시할 공고별 예약 통계가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map((notice) => (
              <NoticeStageCard key={notice.noticeId ?? notice.bottleName} notice={notice} />
            ))}
          </div>
        )}

        <NoticePagination page={statistics.page} selectedBusinessId={selectedBusinessId} />
      </div>
    </>
  );
}
