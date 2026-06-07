import { getApiUsersBusinessesPickupReservationsStatistics } from "@/apis/generated/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BusinessStatisticsPage from "./page";

vi.mock("@/apis/generated/api", () => ({
  getApiUsersBusinessesPickupReservationsStatistics: vi.fn(async () => ({
    data: {
      businessId: 99,
      businessName: "나비바",
      month: "2026-06",
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

  it("조회 월 query를 프론트에서 보정하지 않고 API에 전달한다", async () => {
    await BusinessStatisticsPage({
      searchParams: Promise.resolve({ month: "bad-month" }),
    });

    expect(getApiUsersBusinessesPickupReservationsStatistics).toHaveBeenCalledWith(
      { month: "bad-month" },
      { headers: { Authorization: "Bearer access-token" } },
    );
  });
});
