import type { BusinessMembershipBusinessResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setPrimaryBusinessAction } from "../actions";
import BusinessSidebar from "./BusinessSidebar";

const refreshMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/business/statistics",
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  useSearchParams: () => new URLSearchParams("page=2"),
}));

vi.mock("../actions", () => ({
  setPrimaryBusinessAction: vi.fn(),
}));

const mockedSetPrimaryBusinessAction = vi.mocked(setPrimaryBusinessAction);

const businesses: BusinessMembershipBusinessResponse[] = [
  {
    businessId: 1,
    businessName: "나비바",
    role: "OWNER",
    primaryBusiness: true,
  },
  {
    businessId: 2,
    businessName: "테스트샵",
    role: "MANAGER",
    primaryBusiness: false,
  },
  {
    businessId: 3,
    businessName: "오너샵",
    role: "OWNER",
    primaryBusiness: false,
  },
];

describe("BusinessSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSetPrimaryBusinessAction.mockResolvedValue({ success: true });
  });

  it("사용자가 소유하거나 관리하는 사업장 목록과 현재 기본 사업장을 표시한다", () => {
    render(<BusinessSidebar businesses={businesses} />);

    expect(screen.getByText("나비바")).toBeInTheDocument();
    expect(screen.getByText("테스트샵")).toBeInTheDocument();
    expect(screen.getByText("대표")).toBeInTheDocument();
    expect(screen.getAllByText("소유자")).toHaveLength(2);
    expect(screen.getByText("매니저")).toBeInTheDocument();
  });

  it("다른 사업장을 선택하면 기본 사업장을 바꾸지 않고 businessId query로 이동한다", async () => {
    const user = userEvent.setup();
    render(<BusinessSidebar businesses={businesses} />);

    await user.click(screen.getByRole("button", { name: /테스트샵/ }));

    expect(mockedSetPrimaryBusinessAction).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/business/statistics?businessId=2");
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("소유자는 별도 버튼으로 대표 사업장을 지정한다", async () => {
    const user = userEvent.setup();
    render(<BusinessSidebar businesses={businesses} />);

    await user.click(screen.getByRole("button", { name: "오너샵 대표로 지정" }));

    expect(mockedSetPrimaryBusinessAction).toHaveBeenCalledWith(3);
    expect(refreshMock).toHaveBeenCalled();
  });

  it("매니저 사업장에는 대표 지정 버튼을 표시하지 않는다", () => {
    render(<BusinessSidebar businesses={businesses} />);

    expect(screen.queryByRole("button", { name: "테스트샵 대표로 지정" })).not.toBeInTheDocument();
  });
});
