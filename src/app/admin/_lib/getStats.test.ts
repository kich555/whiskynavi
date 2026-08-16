import { getApiV2AdminDashboardStats } from "@/apis/generated/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStats } from "./getStats";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, cache: <T extends (...args: never[]) => unknown>(fn: T) => fn };
});

vi.mock("@/apis/generated/api", () => ({
  getApiV2AdminDashboardStats: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token: string) => ({ headers: { Authorization: `Bearer ${token}` } })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(async () => "admin-token"),
}));

const stats = {
  totalUsers: 1,
  totalOrders: 2,
  totalBottles: 3,
  totalNotices: 4,
  totalApplications: 5,
  totalBusinessMembers: 6,
  totalUnansweredInquiries: 7,
};

describe("getStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApiV2AdminDashboardStats).mockResolvedValue({
      data: stats,
      status: 200,
      headers: new Headers(),
    });
  });

  it("통합 대시보드 통계 API를 한 번 호출한다", async () => {
    await expect(getStats()).resolves.toEqual(stats);

    expect(getApiV2AdminDashboardStats).toHaveBeenCalledOnce();
    expect(getApiV2AdminDashboardStats).toHaveBeenCalledWith({
      headers: { Authorization: "Bearer admin-token" },
    });
  });

  it("통계 조회가 실패하면 모든 지표를 비워 둔다", async () => {
    vi.mocked(getApiV2AdminDashboardStats).mockRejectedValue(new Error("통계 조회 실패"));

    await expect(getStats()).resolves.toEqual({
      totalUsers: null,
      totalOrders: null,
      totalBottles: null,
      totalNotices: null,
      totalApplications: null,
      totalBusinessMembers: null,
      totalUnansweredInquiries: null,
    });
  });
});
