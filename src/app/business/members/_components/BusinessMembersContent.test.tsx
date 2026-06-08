import type { BusinessMemberResponse, BusinessMembershipBusinessResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addBusinessManagerAction } from "../../actions";
import BusinessMembersContent from "./BusinessMembersContent";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../../actions", () => ({
  addBusinessManagerAction: vi.fn(),
  removeBusinessManagerAction: vi.fn(),
  transferBusinessOwnershipAction: vi.fn(),
}));

const mockedAddBusinessManagerAction = vi.mocked(addBusinessManagerAction);

const ownerBusiness: BusinessMembershipBusinessResponse = {
  businessId: 10,
  businessName: "나비바",
  role: "OWNER",
  primaryBusiness: true,
};

const managerBusiness: BusinessMembershipBusinessResponse = {
  ...ownerBusiness,
  role: "MANAGER",
};

const members: BusinessMemberResponse[] = [
  {
    userId: 1,
    name: "소유자",
    email: "owner@navi.test",
    role: "OWNER",
  },
  {
    userId: 2,
    name: "매니저",
    email: "manager@navi.test",
    role: "MANAGER",
  },
];

describe("BusinessMembersContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAddBusinessManagerAction.mockResolvedValue({ success: true });
  });

  it("소유자는 멤버 목록과 이메일 기반 매니저 추가 폼을 볼 수 있다", () => {
    render(<BusinessMembersContent business={ownerBusiness} members={members} />);

    expect(screen.getByText("사업장 멤버 관리")).toBeInTheDocument();
    expect(screen.getByText("owner@navi.test")).toBeInTheDocument();
    expect(screen.getByText("manager@navi.test")).toBeInTheDocument();
    expect(screen.getByLabelText("매니저 이메일")).toBeInTheDocument();
  });

  it("매니저 이메일을 입력해 추가 action을 호출한다", async () => {
    const user = userEvent.setup();
    render(<BusinessMembersContent business={ownerBusiness} members={members} />);

    await user.type(screen.getByLabelText("매니저 이메일"), " new-manager@navi.test ");
    await user.click(screen.getByRole("button", { name: "매니저 추가" }));

    expect(mockedAddBusinessManagerAction).toHaveBeenCalledWith(10, {
      email: "new-manager@navi.test",
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("현재 사용자가 매니저이면 멤버 변경 액션을 숨긴다", () => {
    render(<BusinessMembersContent business={managerBusiness} members={members} />);

    expect(screen.getByText("사업장 소유자만 멤버를 변경할 수 있습니다.")).toBeInTheDocument();
    expect(screen.queryByLabelText("매니저 이메일")).not.toBeInTheDocument();
  });
});
