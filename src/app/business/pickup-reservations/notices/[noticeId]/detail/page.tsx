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
}

export default async function BusinessRelatedNoticePage({ params }: BusinessRelatedNoticePageProps) {
  const token = await getAuthToken();
  const { noticeId: noticeIdParam } = await params;
  const noticeId = parsePositiveInt(noticeIdParam);
  if (!noticeId || !token) notFound();

  const result = await getApiUsersBusinessesPickupReservationsNoticesNoticeidDetail(noticeId, withToken(token)).catch(
    () => null,
  );
  if (!result?.data) notFound();

  return (
    <>
      <BusinessHeader title="예약 공고 내용" />
      <div className="p-6">
        <Link
          href={`/business/pickup-reservations/notices/${noticeId}`}
          className="mb-6 flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          공고별 신청 관리로 돌아가기
        </Link>
        <RelatedNoticeDetail notice={result.data} appearance="light" />
      </div>
    </>
  );
}
