import type { BusinessMembershipBusinessResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setPrimaryBusinessAction } from "../actions";
import BusinessSidebar from "./BusinessSidebar";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/business/members",
  useRouter: () => ({ refresh: refreshMock }),
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
    expect(screen.getByText("기본")).toBeInTheDocument();
    expect(screen.getByText("소유자")).toBeInTheDocument();
    expect(screen.getByText("매니저")).toBeInTheDocument();
  });

  it("다른 사업장을 선택하면 기본 사업장 변경 action을 호출하고 새로고침한다", async () => {
    const user = userEvent.setup();
    render(<BusinessSidebar businesses={businesses} />);

    await user.click(screen.getByRole("button", { name: /테스트샵/ }));

    expect(mockedSetPrimaryBusinessAction).toHaveBeenCalledWith(2);
    expect(refreshMock).toHaveBeenCalled();
  });
});
