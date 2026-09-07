import { patchApiAdminUsersIdRolesAdd, postApiV2AdminUsersPurchaseStatisticsRefresh } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { grantCommunityMembershipAction, requestPurchaseStatisticsRefreshAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  patchApiAdminUsersIdRolesAdd: vi.fn(),
  postApiV2AdminUsersPurchaseStatisticsRefresh: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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

describe("grantCommunityMembershipAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["navi", "ROLE_WHISKYNAVI_MEMBER"],
    ["tales", "ROLE_WHISKYTALES_MEMBER"],
  ] as const)("%s 커뮤니티 등급을 사용자에게 부여한다", async (brand, role) => {
    vi.mocked(getAuthToken).mockResolvedValue("access-token");
    vi.mocked(patchApiAdminUsersIdRolesAdd).mockResolvedValue({
      data: {},
      status: 200,
      headers: new Headers(),
    });

    await expect(grantCommunityMembershipAction(42, brand)).resolves.toEqual({ success: true });
    expect(patchApiAdminUsersIdRolesAdd).toHaveBeenCalledWith(
      42,
      { roles: [role] },
      { headers: { Authorization: "Bearer access-token" } },
    );
  });

  it("유효하지 않은 사용자 ID는 API 호출 전에 거부한다", async () => {
    await expect(grantCommunityMembershipAction(0, "navi")).resolves.toEqual({
      success: false,
      error: "유효하지 않은 사용자입니다.",
    });
    expect(getAuthToken).not.toHaveBeenCalled();
    expect(patchApiAdminUsersIdRolesAdd).not.toHaveBeenCalled();
  });
});
