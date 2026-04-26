import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BusinessMembersContent from "./BusinessMembersContent";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const searchParams = {};

describe("BusinessMembersContent", () => {
  it("renders page title", () => {
    render(
      <BusinessMembersContent
        searchParams={searchParams}
        members={[]}
        totalElements={0}
      />,
    );
    expect(screen.getByText("사업자 멤버 관리")).toBeInTheDocument();
  });

  it("shows empty state when no members", () => {
    render(
      <BusinessMembersContent
        searchParams={searchParams}
        members={[]}
        totalElements={0}
      />,
    );
    expect(screen.getByText("사업자 멤버가 없습니다.")).toBeInTheDocument();
  });

  it("shows total count", () => {
    render(
      <BusinessMembersContent
        searchParams={searchParams}
        members={[]}
        totalElements={7}
      />,
    );
    expect(screen.getByText("총 7건")).toBeInTheDocument();
  });

  it("renders member row with name and username", () => {
    const mockMember = {
      userId: 10,
      name: "홍길동",
      username: "hong@example.com",
      hasPickupRole: false,
      roles: [],
    };
    render(
      <BusinessMembersContent
        searchParams={searchParams}
        members={[mockMember]}
        totalElements={1}
      />,
    );
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("hong@example.com")).toBeInTheDocument();
  });

  it("shows 픽업 권한 있음 badge when hasPickupRole is true", () => {
    const mockMember = {
      userId: 11,
      name: "김철수",
      username: "kim@example.com",
      hasPickupRole: true,
      roles: [],
    };
    render(
      <BusinessMembersContent
        searchParams={searchParams}
        members={[mockMember]}
        totalElements={1}
      />,
    );
    expect(screen.getByText("픽업 권한 있음")).toBeInTheDocument();
  });
});
