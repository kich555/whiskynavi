import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BusinessMemberDetailContent from "./BusinessMemberDetailContent";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("overlay-kit", () => ({
  overlay: { open: vi.fn() },
}));

const mockMember = {
  userId: 10,
  name: "홍길동",
  username: "hong@example.com",
  businessName: "테스트 주류",
  businessRegistrationNumber: "123-45-67890",
  contact: "010-1234-5678",
  pickupAddress: "서울시 강남구",
  hasPickupRole: false,
  roles: [],
  businessCreatedAt: "2024-01-01T00:00:00Z",
  businessUpdatedAt: "2024-01-15T00:00:00Z",
};

describe("BusinessMemberDetailContent", () => {
  it("renders page title", () => {
    render(<BusinessMemberDetailContent member={mockMember} />);
    expect(screen.getByText("사업자 멤버 상세")).toBeInTheDocument();
  });

  it("renders member name", () => {
    render(<BusinessMemberDetailContent member={mockMember} />);
    expect(screen.getByText("홍길동")).toBeInTheDocument();
  });

  it("renders business name", () => {
    render(<BusinessMemberDetailContent member={mockMember} />);
    expect(screen.getByText("테스트 주류")).toBeInTheDocument();
  });

  it("shows 픽업 권한 없음 badge when hasPickupRole is false", () => {
    render(<BusinessMemberDetailContent member={mockMember} />);
    expect(screen.getByText("픽업 권한 없음")).toBeInTheDocument();
  });

  it("shows grant button when hasPickupRole is false", () => {
    render(<BusinessMemberDetailContent member={mockMember} />);
    expect(screen.getByText("픽업 권한 부여")).toBeInTheDocument();
    expect(screen.queryByText("픽업 권한 회수")).not.toBeInTheDocument();
  });

  it("shows revoke button when hasPickupRole is true", () => {
    render(
      <BusinessMemberDetailContent
        member={{ ...mockMember, hasPickupRole: true }}
      />,
    );
    expect(screen.getByText("픽업 권한 회수")).toBeInTheDocument();
    expect(screen.queryByText("픽업 권한 부여")).not.toBeInTheDocument();
  });

  it("renders back button", () => {
    render(<BusinessMemberDetailContent member={mockMember} />);
    expect(screen.getByText("멤버 목록으로 돌아가기")).toBeInTheDocument();
  });
});
