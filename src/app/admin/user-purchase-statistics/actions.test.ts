import { postApiV2AdminUsersPurchaseStatisticsRefresh } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestPurchaseStatisticsRefreshAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  postApiV2AdminUsersPurchaseStatisticsRefresh: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

describe("requestPurchaseStatisticsRefreshAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증된 관리자의 비동기 집계 요청을 접수한다", async () => {
    vi.mocked(getAuthToken).mockResolvedValue("access-token");
    vi.mocked(postApiV2AdminUsersPurchaseStatisticsRefresh).mockResolvedValue({
      data: {
        accepted: true,
        requestId: "7d6c7faa-4fe4-449d-9198-c4514ce00919",
        statisticsYear: 2026,
        status: "QUEUED",
      },
      status: 202,
      headers: new Headers(),
    });

    await expect(requestPurchaseStatisticsRefreshAction()).resolves.toEqual({
      success: true,
      requestId: "7d6c7faa-4fe4-449d-9198-c4514ce00919",
      statisticsYear: 2026,
    });
    expect(postApiV2AdminUsersPurchaseStatisticsRefresh).toHaveBeenCalledWith({
      headers: { Authorization: "Bearer access-token" },
    });
  });

  it("인증 토큰이 없으면 API를 호출하지 않는다", async () => {
    vi.mocked(getAuthToken).mockResolvedValue(undefined);

    await expect(requestPurchaseStatisticsRefreshAction()).resolves.toEqual({
      success: false,
      error: "인증이 필요합니다.",
    });
    expect(postApiV2AdminUsersPurchaseStatisticsRefresh).not.toHaveBeenCalled();
  });
});
