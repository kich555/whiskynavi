import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BusinessApplicationsContent from "./BusinessApplicationsContent";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const searchParams = {};

describe("BusinessApplicationsContent", () => {
  it("renders page title", () => {
    render(
      <BusinessApplicationsContent
        searchParams={searchParams}
        applications={[]}
        totalElements={0}
      />,
    );
    expect(screen.getByText("사업자 신청 관리")).toBeInTheDocument();
  });

  it("shows empty state when no applications", () => {
    render(
      <BusinessApplicationsContent
        searchParams={searchParams}
        applications={[]}
        totalElements={0}
      />,
    );
    expect(screen.getByText("사업자 신청이 없습니다.")).toBeInTheDocument();
  });

  it("shows total count", () => {
    render(
      <BusinessApplicationsContent
        searchParams={searchParams}
        applications={[]}
        totalElements={15}
      />,
    );
    expect(screen.getByText("총 15건")).toBeInTheDocument();
  });

  it("renders application row with business name and status", () => {
    const mockApp = {
      id: 1,
      businessName: "테스트 주류",
      representativeName: "홍길동",
      contact: "010-1234-5678",
      status: "PENDING" as const,
      createdAt: "2024-01-15T00:00:00Z",
      userId: 42,
    };
    render(
      <BusinessApplicationsContent
        searchParams={searchParams}
        applications={[mockApp]}
        totalElements={1}
      />,
    );
    expect(screen.getByText("테스트 주류")).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("검토중")).toBeInTheDocument();
  });

  it("renders correct status badge label for APPROVED", () => {
    const mockApp = {
      id: 2,
      businessName: "승인된 주류",
      representativeName: "김철수",
      contact: "010-0000-0000",
      status: "APPROVED" as const,
      createdAt: "2024-02-01T00:00:00Z",
      userId: 43,
    };
    render(
      <BusinessApplicationsContent
        searchParams={searchParams}
        applications={[mockApp]}
        totalElements={1}
      />,
    );
    expect(screen.getByText("승인")).toBeInTheDocument();
  });
});
