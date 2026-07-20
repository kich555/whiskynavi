import { ApiError } from "@/apis/errors";
import { getApiUsersBusinessesPickupReservationsNoticesNoticeidDetail } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import RelatedNoticeDetail from "@/components/reservation/RelatedNoticeDetail";
import { getAuthToken } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/page-response";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import BusinessHeader from "../../../../_components/BusinessHeader";

interface BusinessRelatedNoticePageProps {
  params: Promise<{ noticeId: string }>;
  searchParams: Promise<{ businessId?: string }>;
}

export default async function BusinessRelatedNoticePage({ params, searchParams }: BusinessRelatedNoticePageProps) {
  const token = await getAuthToken();
  const { noticeId: noticeIdParam } = await params;
  const { businessId: businessIdParam } = await searchParams;
  const noticeId = parsePositiveInt(noticeIdParam);
  const businessId = businessIdParam ? parsePositiveInt(businessIdParam) : undefined;
  if (!noticeId || !token) notFound();
  if (businessIdParam && !businessId) notFound();

  let result: Awaited<ReturnType<typeof getApiUsersBusinessesPickupReservationsNoticesNoticeidDetail>>;
  try {
    result = await getApiUsersBusinessesPickupReservationsNoticesNoticeidDetail(
      noticeId,
      businessId ? { businessId } : undefined,
      withToken(token),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const backHref = businessId
    ? `/business/statistics?businessId=${businessId}`
    : `/business/pickup-reservations/notices/${noticeId}`;
  const backLabel = businessId ? "공고별 예약 통계로 돌아가기" : "공고별 신청 관리로 돌아가기";

  return (
    <>
      <BusinessHeader title="예약 공고 내용" />
      <div className="p-6">
        <Link
          href={backHref}
          className="mb-6 flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          {backLabel}
        </Link>
        <RelatedNoticeDetail notice={result.data} appearance="light" />
      </div>
    </>
  );
}
