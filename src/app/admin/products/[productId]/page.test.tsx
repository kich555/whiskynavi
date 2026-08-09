import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductDetailPage from "./page";

const mocks = vi.hoisted(() => ({
  getBottle: vi.fn(),
  getNotices: vi.fn(),
  getReservations: vi.fn(),
  getManualPurchases: vi.fn(),
  getAuthToken: vi.fn(),
}));

vi.mock("@/apis/generated/api", () => ({
  getApiAdminBottlesId: mocks.getBottle,
  getApiV2AdminBottlesBottleidReservationNotices: mocks.getNotices,
  getApiV2AdminBottlesBottleidReservations: mocks.getReservations,
  getApiV2AdminBottlesBottleidManualPurchases: mocks.getManualPurchases,
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token?: string) => ({ token })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: mocks.getAuthToken,
}));

vi.mock("./_components/ProductDetailContent", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("./_components/RelatedBottleManagementSections", () => ({
  default: () => <div>연관 운영 정보</div>,
}));

describe("ProductDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthToken.mockResolvedValue("admin-token");
    mocks.getBottle.mockResolvedValue({ data: { id: 10, name: "테스트 보틀" } });
    const pageResponse = { data: { content: [], page: { totalElements: 0 } } };
    mocks.getNotices.mockResolvedValue(pageResponse);
    mocks.getReservations.mockResolvedValue(pageResponse);
    mocks.getManualPurchases.mockResolvedValue(pageResponse);
  });

  it("세 목록의 독립 페이지와 필터를 v2.0 API에 전달한다", async () => {
    const page = await ProductDetailPage({
      params: Promise.resolve({ productId: "10" }),
      searchParams: Promise.resolve({
        noticePage: "2",
        noticeLimit: "10",
        noticeKeyword: "여름",
        noticeStatus: "OPEN",
        noticeCreatedAtFrom: "2026-08-01T00:00",
        noticeCreatedAtTo: "2026-08-31T23:59",
        noticeSortBy: "PRICE",
        noticeSortDirection: "ASC",
        reservationPage: "3",
        reservationLimit: "50",
        reservationKeyword: "홍길동",
        reservationStatus: "WAITING_PICKUP",
        reservationNoticeId: "100",
        reservationSortBy: "APPLICANT_NAME",
        reservationSortDirection: "DESC",
        manualPage: "4",
        manualLimit: "20",
        manualKeyword: "ORDER-10",
        manualStatus: "RECEIPT_COMPLETED",
        manualSortBy: "ORDER_NUMBER",
        manualSortDirection: "ASC",
      }),
    });

    render(page);

    const authOptions = { token: "admin-token" };
    expect(mocks.getNotices).toHaveBeenCalledWith(
      10,
      {
        page: 1,
        size: 10,
        keyword: "여름",
        status: "OPEN",
        createdAtFrom: "2026-08-01T00:00",
        createdAtTo: "2026-08-31T23:59",
        sortBy: "PRICE",
        sortDirection: "ASC",
      },
      authOptions,
    );
    expect(mocks.getReservations).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        page: 2,
        size: 50,
        keyword: "홍길동",
        status: "WAITING_PICKUP",
        noticeId: 100,
        sortBy: "APPLICANT_NAME",
        sortDirection: "DESC",
      }),
      authOptions,
    );
    expect(mocks.getManualPurchases).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        page: 3,
        size: 20,
        keyword: "ORDER-10",
        status: "RECEIPT_COMPLETED",
        sortBy: "ORDER_NUMBER",
        sortDirection: "ASC",
      }),
      authOptions,
    );
    expect(screen.getByText("연관 운영 정보")).toBeInTheDocument();
  });
});
