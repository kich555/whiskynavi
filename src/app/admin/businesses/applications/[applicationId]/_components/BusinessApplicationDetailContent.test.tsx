import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BusinessApplicationDetailContent from "./BusinessApplicationDetailContent";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("overlay-kit", () => ({
  overlay: { open: vi.fn() },
}));

const mockApplication = {
  id: 1,
  businessName: "테스트 주류상사",
  representativeName: "홍길동",
  businessRegistrationNumber: "123-45-67890",
  contact: "010-1234-5678",
  pickupAddress: "서울시 강남구 테헤란로 1",
  openingDate: "2020-01-01",
  taxType: "일반과세자",
  status: "PENDING" as const,
  createdAt: "2024-01-15T00:00:00Z",
  updatedAt: "2024-01-16T00:00:00Z",
  userId: 42,
};

describe("BusinessApplicationDetailContent", () => {
  it("renders page title", () => {
    render(
      <BusinessApplicationDetailContent
        application={mockApplication}
        auditLogs={[]}
      />,
    );
    expect(screen.getByText("사업자 신청 상세")).toBeInTheDocument();
  });

  it("renders business name", () => {
    render(
      <BusinessApplicationDetailContent
        application={mockApplication}
        auditLogs={[]}
      />,
    );
    expect(screen.getByText("테스트 주류상사")).toBeInTheDocument();
  });

  it("renders status badge as 검토중 for PENDING", () => {
    render(
      <BusinessApplicationDetailContent
        application={mockApplication}
        auditLogs={[]}
      />,
    );
    expect(screen.getByText("검토중")).toBeInTheDocument();
  });

  it("shows approve and reject buttons when status is PENDING", () => {
    render(
      <BusinessApplicationDetailContent
        application={mockApplication}
        auditLogs={[]}
      />,
    );
    expect(screen.getByRole("button", { name: /승인/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /반려/ })).toBeInTheDocument();
  });

  it("hides approve and reject buttons when status is APPROVED", () => {
    render(
      <BusinessApplicationDetailContent
        application={{ ...mockApplication, status: "APPROVED" }}
        auditLogs={[]}
      />,
    );
    expect(screen.queryByRole("button", { name: /승인/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /반려/ })).not.toBeInTheDocument();
  });

  it("renders back button", () => {
    render(
      <BusinessApplicationDetailContent
        application={mockApplication}
        auditLogs={[]}
      />,
    );
    expect(
      screen.getByText("신청 목록으로 돌아가기"),
    ).toBeInTheDocument();
  });

  it("renders audit log section when logs exist", () => {
    const auditLogs = [
      {
        id: 1,
        applicationId: 1,
        beforeStatus: "PENDING" as const,
        afterStatus: "APPROVED" as const,
        actorUsername: "admin@test.com",
        createdAt: "2024-01-16T00:00:00Z",
        action: "APPROVE",
        actorType: "ADMIN",
        actorUserId: 1,
        memo: undefined,
      },
    ];
    render(
      <BusinessApplicationDetailContent
        application={mockApplication}
        auditLogs={auditLogs}
      />,
    );
    expect(screen.getByText("처리 이력")).toBeInTheDocument();
  });

  it("does not render audit log section when logs are empty", () => {
    render(
      <BusinessApplicationDetailContent
        application={mockApplication}
        auditLogs={[]}
      />,
    );
    expect(screen.queryByText("처리 이력")).not.toBeInTheDocument();
  });
});
