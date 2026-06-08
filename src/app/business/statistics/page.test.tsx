import { getApiUsersBusinessesPickupReservationsNoticeStatistics } from "@/apis/generated/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BusinessStatisticsPage from "./page";

vi.mock("@/apis/generated/api", () => ({
  getApiUsersBusinessesPickupReservationsNoticeStatistics: vi.fn(async () => ({
    data: {
      content: [],
      page: { number: 2, size: 5, totalElements: 0, totalPages: 0 },
    },
  })),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token: string) => ({ headers: { Authorization: `Bearer ${token}` } })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(async () => "access-token"),
}));

vi.mock("./_components/BusinessStatisticsContent", () => ({
  default: vi.fn(() => null),
}));

describe("BusinessStatisticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("공고별 단계 통계를 5개씩 페이지 조회한다", async () => {
    await BusinessStatisticsPage({
      searchParams: Promise.resolve({ page: "3" }),
    });

    expect(getApiUsersBusinessesPickupReservationsNoticeStatistics).toHaveBeenCalledWith(
      { page: 2, size: 5 },
      { headers: { Authorization: "Bearer access-token" } },
    );
  });
});
