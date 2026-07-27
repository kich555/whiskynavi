import { ApiError } from "@/apis/errors";
import {
  getApiBottlesReservationsApplicationsMe,
  getApiBusinessesBusinessidBottlesReservationsApplications,
  getApiUsersBusinessesMe,
  type BusinessBottleReservationApplicationPublicResponse,
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

type ReservationApplication =
  | BusinessBottleReservationApplicationPublicResponse
  | UserBottleReservationApplicationPublicResponse;

const isAppliedApplication = (application: ReservationApplication): boolean => {
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

  const noticePromise = fetchNoticeDetail(id, session.accessToken);
  const loadGeneralReservationData = async () => {
    const [pickupLocations, applicationsResponse] = await Promise.all([
      fetchPickupLocations(),
      getApiBottlesReservationsApplicationsMe(
        { noticeId: id, size: 20, sort: ["createdAt,desc"] },
        withToken(session.accessToken),
      ),
    ]);
    return { pickupLocations, applicationsResponse };
  };
  const sessionHasBusinessRole = hasBusinessRole(session.user.roles);
  const prefetchedGeneralReservationData = sessionHasBusinessRole
    ? null
    : loadGeneralReservationData().then(
        (data) => ({ ok: true as const, data }),
        (error: unknown) => ({ ok: false as const, error }),
      );
  const reservationDataPromise = getApiUsersBusinessesMe(withToken(session.accessToken)).then(
    async (businessMembershipsResponse) => {
      const memberships = businessMembershipsResponse.data;
      const availableBusinessOptions: ReservationBusinessOption[] = memberships.flatMap((business) =>
        business.businessId
          ? [
              {
                businessId: business.businessId,
                businessName: business.businessName ?? `사업장 ${business.businessId}`,
              },
            ]
          : [],
      );
      const isBusinessUser = hasBusinessRole(session.user.roles) || availableBusinessOptions.length > 0;

      if (isBusinessUser) {
        const requestedBusinessId = query.businessId ? parsePositiveInt(query.businessId) : undefined;
        if (query.businessId && !requestedBusinessId) notFound();

        const selectedBusinessId =
          requestedBusinessId ??
          memberships.find((business) => business.primaryBusiness)?.businessId ??
          availableBusinessOptions[0]?.businessId;
        if (
          selectedBusinessId &&
          !availableBusinessOptions.some((business) => business.businessId === selectedBusinessId)
        ) {
          notFound();
        }

        const applicationsRes = selectedBusinessId
          ? await getApiBusinessesBusinessidBottlesReservationsApplications(
              selectedBusinessId,
              { noticeId: id, size: 20, sort: ["createdAt,desc"] },
              withToken(session.accessToken),
            )
          : null;

        return {
          businessOptions: availableBusinessOptions,
          selectedBusinessId,
          myApplication: (applicationsRes?.data.content ?? []).find(isAppliedApplication) ?? null,
          pickupLocations: [] as PickupLocationResponse[],
        };
      }

      let generalReservationData;
      if (prefetchedGeneralReservationData) {
        const result = await prefetchedGeneralReservationData;
        if (!result.ok) throw result.error;
        generalReservationData = result.data;
      } else {
        generalReservationData = await loadGeneralReservationData();
      }
      return {
        businessOptions: undefined,
        selectedBusinessId: undefined,
        myApplication:
          (generalReservationData.applicationsResponse.data.content ?? []).find(isAppliedApplication) ?? null,
        pickupLocations: generalReservationData.pickupLocations,
      };
    },
  );

  let notice: Awaited<typeof noticePromise>;
  let reservationData: Awaited<typeof reservationDataPromise>;
  try {
    [notice, reservationData] = await Promise.all([noticePromise, reservationDataPromise]);
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
          key={reservationData.selectedBusinessId ?? "general"}
          notice={notice}
          pickupLocations={reservationData.pickupLocations}
          myApplication={reservationData.myApplication}
          businessOptions={reservationData.businessOptions}
          selectedBusinessId={reservationData.selectedBusinessId}
        />
      </div>
    </div>
  );
}
