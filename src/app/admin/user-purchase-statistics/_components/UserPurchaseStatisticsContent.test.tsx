import type { AdminUserPurchaseStatisticsResponse } from "@/apis/generated/api";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { grantCommunityMembershipAction, requestPurchaseStatisticsRefreshAction } from "../actions";
import UserPurchaseStatisticsContent from "./UserPurchaseStatisticsContent";

const { routerPush, routerRefresh } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routerRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, refresh: routerRefresh }),
}));

vi.mock("../../_components/AdminHeader", () => ({
  default: () => null,
}));

vi.mock("../../_components/AdminLayoutClient", () => ({
  useSidebar: () => ({ toggle: vi.fn() }),
}));

vi.mock("../../_components/Pagination", () => ({
  default: () => null,
}));

vi.mock("../actions", () => ({
  grantCommunityMembershipAction: vi.fn(),
  requestPurchaseStatisticsRefreshAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const statistic = {
  id: 42,
  name: "홍길동",
  username: "hong",
  naviMember: true,
  naviBottleQuantity: 1234,
  naviBottleKindCount: 17,
  talesMember: false,
  talesBottleQuantity: 3,
  talesBottleKindCount: 2,
  statisticsYear: 2026,
  calculatedAt: "2026-09-07T03:00:00",
} satisfies AdminUserPurchaseStatisticsResponse;

function renderContent(searchParams: React.ComponentProps<typeof UserPurchaseStatisticsContent>["searchParams"] = {}) {
  return render(
    <UserPurchaseStatisticsContent
      searchParams={searchParams}
      statistics={[statistic]}
      totalElements={1}
      statisticsYear={2026}
      calculatedAt={statistic.calculatedAt ?? null}
    />,
  );
}

describe("UserPurchaseStatisticsContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("요구된 9개 열과 집계 값을 표시한다", () => {
    renderContent();

    const [headerRow, dataRow] = screen.getAllByRole("row");
    expect(within(headerRow).getAllByRole("columnheader")).toHaveLength(9);
    expect(within(dataRow).getAllByRole("cell")).toHaveLength(9);
    expect(within(dataRow).getByText("홍길동")).toBeInTheDocument();
    expect(within(dataRow).getByText("@hong")).toBeInTheDocument();
    expect(within(dataRow).getByText("1,234")).toBeInTheDocument();
    expect(within(dataRow).getByText("회원")).toBeInTheDocument();
    expect(within(dataRow).getByText("비회원")).toBeInTheDocument();
    expect(screen.getByText("2026년 예약 확정 구매 통계")).toBeInTheDocument();
  });

  it("관리자가 확인하면 비동기 갱신 요청을 접수한다", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.mocked(requestPurchaseStatisticsRefreshAction).mockResolvedValue({
      success: true,
      requestId: "7d6c7faa-4fe4-449d-9198-c4514ce00919",
      statisticsYear: 2026,
    });
    renderContent();

    await user.click(screen.getByRole("button", { name: "지금 갱신" }));

    expect(requestPurchaseStatisticsRefreshAction).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith("2026년 구매 통계 갱신 요청을 접수했습니다. 완료 후 다시 확인해주세요.");
  });

  it("내비 최소 구매 병수를 URL 필터로 적용한다", async () => {
    const user = userEvent.setup();
    renderContent();

    await user.type(screen.getByRole("spinbutton", { name: "내비 최소 구매 병수" }), "6");
    await user.click(screen.getByRole("button", { name: "내비 최소 구매 병수 적용" }));

    expect(routerPush).toHaveBeenCalledWith("/admin/user-purchase-statistics?minNaviBottleQuantity=6&page=1");
  });

  it("테일즈 최소 구매 병수를 URL 필터로 적용한다", async () => {
    const user = userEvent.setup();
    renderContent();

    await user.type(screen.getByRole("spinbutton", { name: "테일즈 최소 구매 병수" }), "4");
    await user.click(screen.getByRole("button", { name: "테일즈 최소 구매 병수 적용" }));

    expect(routerPush).toHaveBeenCalledWith("/admin/user-purchase-statistics?minTalesBottleQuantity=4&page=1");
  });

  it("비회원에게 테일즈 커뮤니티 등급을 부여하고 회원 여부를 다시 조회한다", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.mocked(grantCommunityMembershipAction).mockResolvedValue({ success: true });
    renderContent();

    await user.click(screen.getByRole("button", { name: "테일즈 커뮤니티 등급 부여" }));

    expect(grantCommunityMembershipAction).toHaveBeenCalledWith(42, "tales");
    expect(toast.success).toHaveBeenCalledWith("홍길동 회원에게 테일즈 커뮤니티 등급을 부여했습니다.");
    expect(routerRefresh).toHaveBeenCalledOnce();
  });
});
