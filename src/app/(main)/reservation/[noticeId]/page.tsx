import { ApiError } from "@/apis/errors";
import {
  getApiBottlesReservationsApplicationsMe,
  getApiBusinessesBusinessidBottlesReservationsApplications,
  getApiUsersBusinessesContext,
  type PickupLocationResponse,
  type UserBottleReservationApplicationPublicResponse,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions, hasBusinessRole } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/page-response";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReservationBusinessOption } from "../_components/BusinessApplyForm";
import { fetchNoticeDetail } from "../_lib/fetchNoticeDetail";
import { fetchPickupLocations } from "../_lib/fetchPickupLocations";
import ReservationDetailClient from "./_components/ReservationDetailClient";

type PageProps = {
  params: Promise<{ noticeId: string }>;
  searchParams: Promise<{ businessId?: string }>;
};

const isAppliedApplication = (application: UserBottleReservationApplicationPublicResponse): boolean => {
  return application.status !== "CANCELLED" && application.status !== "REJECTED";
};

function ReservationAccessDenied() {
  return (
    <div className="mt-20 min-h-screen bg-[#1d2429]">
      <div className="mx-auto flex max-w-[720px] flex-col items-center px-4 py-24 text-center">
        <div className="mb-6 rounded-full bg-amber-500/10 p-4 text-amber-300">
          <ShieldAlert size={32} aria-hidden />
        </div>
        <h1 className="typo-bold-24 text-white">접근할 수 없는 예약 공고입니다</h1>
        <p className="typo-medium-14 mt-4 text-gray-300">
          현재 계정의 권한 또는 사업장 조건으로는 이 예약 공고를 확인할 수 없습니다.
        </p>
        <Link
          href="/reservation"
          className="typo-bold-14 mt-8 inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-white transition-colors hover:bg-white/10"
        >
          <ArrowLeft size={18} aria-hidden />
          예약 공고 목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default async function ReservationDetailPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/sign-in?callbackUrl=/reservation");
  }

  const [{ noticeId }, query] = await Promise.all([params, searchParams]);
  const id = parsePositiveInt(noticeId);
  if (!id) notFound();

  const isBusinessUser = hasBusinessRole(session.user.roles);
  const requestedBusinessId = query.businessId ? parsePositiveInt(query.businessId) : undefined;
  if (query.businessId && !requestedBusinessId) notFound();

  const noticePromise = fetchNoticeDetail(id, session.accessToken);
  const businessContextPromise = isBusinessUser
    ? getApiUsersBusinessesContext(withToken(session.accessToken)).then((response) => response.data)
    : null;

  let notice;
  let businessOptions: ReservationBusinessOption[] | undefined;
  let selectedBusinessId: number | undefined;
  let myApplication: UserBottleReservationApplicationPublicResponse | null = null;
  let pickupLocations: PickupLocationResponse[] = [];

  try {
    if (isBusinessUser && businessContextPromise) {
      const [noticeData, businessContext] = await Promise.all([noticePromise, businessContextPromise]);
      notice = noticeData;
      businessOptions = (businessContext.businesses ?? []).flatMap((business) =>
        business.businessId
          ? [
              {
                businessId: business.businessId,
                businessName: business.businessName ?? `사업장 ${business.businessId}`,
                pickupAddress: business.pickupAddress,
              },
            ]
          : [],
      );
      selectedBusinessId =
        requestedBusinessId ?? businessContext.currentBusiness?.businessId ?? businessOptions[0]?.businessId;

      if (selectedBusinessId && !businessOptions.some((business) => business.businessId === selectedBusinessId)) {
        notFound();
      }

      if (selectedBusinessId) {
        const applicationsRes = await getApiBusinessesBusinessidBottlesReservationsApplications(
          selectedBusinessId,
          { noticeId: id, size: 20, sort: ["createdAt,desc"] },
          withToken(session.accessToken),
        );
        myApplication = (applicationsRes.data.content ?? []).find(isAppliedApplication) ?? null;
      }
    } else {
      const [noticeData, locations, applicationsRes] = await Promise.all([
        noticePromise,
        fetchPickupLocations(),
        getApiBottlesReservationsApplicationsMe(
          { noticeId: id, size: 20, sort: ["createdAt,desc"] },
          withToken(session.accessToken),
        ),
      ]);
      notice = noticeData;
      pickupLocations = locations;
      myApplication = (applicationsRes.data.content ?? []).find(isAppliedApplication) ?? null;
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return <ReservationAccessDenied />;
    }
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="mt-20 min-h-screen bg-[#1d2429]">
      <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-10 lg:py-12">
        {/* Back Button */}
        <Link
          href="/reservation"
          className="mt-4 mb-3 flex items-center gap-2 text-white/70 transition-colors hover:text-white lg:mt-0 lg:mb-8"
        >
          <ArrowLeft size={18} className="lg:hidden" />
          <ArrowLeft size={20} className="hidden lg:block" />
          <span className="typo-bold-14 lg:text-base">목록으로 돌아가기</span>
        </Link>

        <ReservationDetailClient
          notice={notice}
          pickupLocations={pickupLocations}
          myApplication={myApplication}
          businessOptions={businessOptions}
          selectedBusinessId={selectedBusinessId}
        />
      </div>
    </div>
  );
}
