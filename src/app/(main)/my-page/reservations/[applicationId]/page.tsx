import { ApiError } from "@/apis/errors";
import { getApiBottlesReservationsApplicationsApplicationidNotice } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import RelatedNoticeDetail from "@/components/reservation/RelatedNoticeDetail";
import { authOptions, getAuthToken, hasBusinessRole } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/page-response";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface RelatedReservationNoticePageProps {
  params: Promise<{ applicationId: string }>;
}

export default async function RelatedReservationNoticePage({ params }: RelatedReservationNoticePageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/sign-in?callbackUrl=/my-page?tab=orders");
  }

  const token = await getAuthToken();
  const { applicationId: applicationIdParam } = await params;
  const applicationId = parsePositiveInt(applicationIdParam);
  if (!applicationId || !token) notFound();

  let result: Awaited<ReturnType<typeof getApiBottlesReservationsApplicationsApplicationidNotice>>;
  try {
    result = await getApiBottlesReservationsApplicationsApplicationidNotice(applicationId, withToken(token));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="min-h-screen bg-[#1d2429] pt-20 pb-12">
      <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-10 lg:py-12">
        <Link
          href={`/my-page/order/${applicationId}`}
          className="mb-6 flex items-center gap-2 text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft size={20} />
          주문 상세로 돌아가기
        </Link>
        <RelatedNoticeDetail
          notice={result.data}
          appearance="dark"
          showSupplyPrice={hasBusinessRole(session.user.roles)}
        />
      </div>
    </div>
  );
}
