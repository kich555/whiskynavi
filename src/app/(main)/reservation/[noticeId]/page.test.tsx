import { ApiError } from "@/apis/errors";
import {
  getApiBottlesReservationsApplicationsMe,
  getApiBusinessesBusinessidBottlesReservationsApplications,
  getApiUsersBusinessesMe,
  type BusinessBottleReservationApplicationPublicResponse,
} from "@/apis/generated/api";
import { render, screen, waitFor } from "@testing-library/react";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchNoticeDetail } from "../_lib/fetchNoticeDetail";
import { fetchPickupLocations } from "../_lib/fetchPickupLocations";
import ReservationDetailPage from "./page";

const reservationDetailClient = vi.hoisted(() => vi.fn());

vi.mock("@/apis/generated/api", () => ({
  getApiBottlesReservationsApplicationsMe: vi.fn(),
  getApiBusinessesBusinessidBottlesReservationsApplications: vi.fn(),
  getApiUsersBusinessesMe: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token: string) => ({ headers: { Authorization: `Bearer ${token}` } })),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
  hasBusinessRole: vi.fn((roles?: string[]) => roles?.includes("ROLE_BUSINESS") ?? false),
}));

vi.mock("@/lib/page-response", () => ({
  parsePositiveInt: vi.fn((value?: string) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("../_lib/fetchNoticeDetail", () => ({
  fetchNoticeDetail: vi.fn(),
}));

vi.mock("../_lib/fetchPickupLocations", () => ({
  fetchPickupLocations: vi.fn(),
}));

vi.mock("./_components/ReservationDetailClient", () => ({
  default: (props: unknown) => {
    reservationDetailClient(props);
    return null;
  },
}));

describe("ReservationDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      accessToken: "access-token",
      user: { roles: ["ROLE_USER"] },
    });
    vi.mocked(fetchPickupLocations).mockResolvedValue([]);
    vi.mocked(getApiBottlesReservationsApplicationsMe).mockResolvedValue({
      data: { content: [] },
      status: 200,
      headers: new Headers(),
    });
    vi.mocked(getApiUsersBusinessesMe).mockResolvedValue({
      data: [],
      status: 200,
      headers: new Headers(),
    });
    vi.mocked(getApiBusinessesBusinessidBottlesReservationsApplications).mockResolvedValue({
      data: { content: [] },
      status: 200,
      headers: new Headers(),
    });
  });

  it("403 응답은 접근할 수 없는 공고 안내로 표시한다", async () => {
    vi.mocked(fetchNoticeDetail).mockRejectedValue(new ApiError(403, ""));

    const page = await ReservationDetailPage({
      params: Promise.resolve({ noticeId: "7" }),
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(screen.getByRole("heading", { name: "접근할 수 없는 예약 공고입니다" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "예약 공고 목록으로 돌아가기" })).toHaveAttribute("href", "/reservation");
    expect(notFound).not.toHaveBeenCalled();
  });

  it("404 응답은 notFound로 처리한다", async () => {
    vi.mocked(fetchNoticeDetail).mockRejectedValue(new ApiError(404, ""));

    await expect(
      ReservationDetailPage({
        params: Promise.resolve({ noticeId: "7" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("서버 오류는 notFound로 바꾸지 않고 다시 전달한다", async () => {
    const error = new ApiError(500, "");
    vi.mocked(fetchNoticeDetail).mockRejectedValue(error);

    await expect(
      ReservationDetailPage({
        params: Promise.resolve({ noticeId: "7" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toBe(error);
  });

  it("일반 사용자의 businessId 쿼리는 무시하고 일반 신청 정보를 조회한다", async () => {
    vi.mocked(fetchNoticeDetail).mockResolvedValue({
      id: 7,
      noticeName: "일반 예약",
    });

    const page = await ReservationDetailPage({
      params: Promise.resolve({ noticeId: "7" }),
      searchParams: Promise.resolve({ businessId: "invalid" }),
    });
    render(page);

    expect(notFound).not.toHaveBeenCalled();
    expect(getApiBottlesReservationsApplicationsMe).toHaveBeenCalled();
    expect(getApiBusinessesBusinessidBottlesReservationsApplications).not.toHaveBeenCalled();
  });

  it("일반 사용자의 예약 데이터는 사업장 멤버십 응답을 기다리지 않고 조회한다", async () => {
    vi.mocked(fetchNoticeDetail).mockResolvedValue({
      id: 7,
      noticeName: "일반 예약",
    });
    let resolveMemberships: ((value: Awaited<ReturnType<typeof getApiUsersBusinessesMe>>) => void) | undefined;
    vi.mocked(getApiUsersBusinessesMe).mockReturnValue(
      new Promise((resolve) => {
        resolveMemberships = resolve;
      }),
    );

    const pagePromise = ReservationDetailPage({
      params: Promise.resolve({ noticeId: "7" }),
      searchParams: Promise.resolve({}),
    });

    await waitFor(() => expect(getApiBottlesReservationsApplicationsMe).toHaveBeenCalled());
    expect(fetchPickupLocations).toHaveBeenCalled();

    resolveMemberships?.({
      data: [],
      status: 200,
      headers: new Headers(),
    });
    render(await pagePromise);
  });

  it("세션 roles가 늦어도 현재 사업장 멤버십이 있으면 비즈니스 신청을 조회한다", async () => {
    vi.mocked(fetchNoticeDetail).mockResolvedValue({
      id: 7,
      noticeName: "비즈니스 예약",
    });
    vi.mocked(getApiUsersBusinessesMe).mockResolvedValue({
      data: [{ businessId: 20, businessName: "신청 사업장", primaryBusiness: true }],
      status: 200,
      headers: new Headers(),
    });

    const page = await ReservationDetailPage({
      params: Promise.resolve({ noticeId: "7" }),
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(getApiBusinessesBusinessidBottlesReservationsApplications).toHaveBeenCalledWith(
      20,
      { noticeId: 7, size: 20, sort: ["createdAt,desc"] },
      expect.anything(),
    );
    expect(getApiBottlesReservationsApplicationsMe).toHaveBeenCalled();
  });

  it("관리 중인 모든 사업장의 신청을 병렬 조회해 상세 화면에 전달한다", async () => {
    vi.mocked(fetchNoticeDetail).mockResolvedValue({
      id: 7,
      noticeName: "비즈니스 예약",
    });
    vi.mocked(getApiUsersBusinessesMe).mockResolvedValue({
      data: [
        {
          businessId: 20,
          businessName: "A 사업장",
          pickupAddress: "서울특별시 중구 세종대로 110",
          primaryBusiness: true,
        },
        {
          businessId: 30,
          businessName: "B 사업장",
          pickupAddress: "서울특별시 종로구 종로 1",
          primaryBusiness: false,
        },
      ],
      status: 200,
      headers: new Headers(),
    });
    vi.mocked(getApiBusinessesBusinessidBottlesReservationsApplications).mockImplementation(async (businessId) => ({
      data: {
        content: [
          businessApplication({
            id: businessId === 20 ? 100 : 200,
            businessId,
            businessName: businessId === 20 ? "A 사업장" : "B 사업장",
          }),
        ],
      },
      status: 200,
      headers: new Headers(),
    }));

    const page = await ReservationDetailPage({
      params: Promise.resolve({ noticeId: "7" }),
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(getApiBusinessesBusinessidBottlesReservationsApplications).toHaveBeenCalledTimes(2);
    expect(getApiBusinessesBusinessidBottlesReservationsApplications).toHaveBeenCalledWith(
      20,
      { noticeId: 7, size: 20, sort: ["createdAt,desc"] },
      expect.anything(),
    );
    expect(getApiBusinessesBusinessidBottlesReservationsApplications).toHaveBeenCalledWith(
      30,
      { noticeId: 7, size: 20, sort: ["createdAt,desc"] },
      expect.anything(),
    );
    expect(reservationDetailClient).toHaveBeenCalledWith(
      expect.objectContaining({
        businessOptions: [
          {
            businessId: 20,
            businessName: "A 사업장",
            pickupAddress: "서울특별시 중구 세종대로 110",
          },
          {
            businessId: 30,
            businessName: "B 사업장",
            pickupAddress: "서울특별시 종로구 종로 1",
          },
        ],
        businessApplications: [
          expect.objectContaining({ id: 100, businessId: 20, businessName: "A 사업장" }),
          expect.objectContaining({ id: 200, businessId: 30, businessName: "B 사업장" }),
        ],
      }),
    );
  });
});

function businessApplication(
  overrides: Partial<BusinessBottleReservationApplicationPublicResponse> = {},
): BusinessBottleReservationApplicationPublicResponse {
  return {
    id: 100,
    noticeId: 7,
    noticeName: "비즈니스 예약",
    bottleId: 1,
    bottleName: "테스트 보틀",
    bottleImgUrl: null,
    businessId: 20,
    businessName: "A 사업장",
    quantity: 1,
    confirmedQuantity: null,
    pickupUserBusinessId: 20,
    pickupBusinessName: "A 사업장",
    pickupAddress: null,
    pickupAssignmentType: "APPLICANT_BUSINESS_FALLBACK",
    status: "APPLIED",
    unitPrice: 10_000,
    totalPrice: 10_000,
    createdAt: "2026-07-07T10:00:00.000Z",
    updatedAt: null,
    ...overrides,
  };
}
