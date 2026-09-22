import type { UserBusinessApplicationOverviewResponse, UserBusinessApplicationResponse } from "@/apis/generated/api";
import { useIsDesktop } from "@/hooks/use-media-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { overlay } from "overlay-kit";
import { describe, expect, it, vi } from "vitest";
import BusinessRegistrationSection from "./BusinessRegistrationSection";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock("@/hooks/use-media-query", () => ({
  useIsDesktop: vi.fn(() => true),
}));

vi.mock("overlay-kit", () => ({
  overlay: {
    open: vi.fn(),
  },
}));

vi.mock("../actions", () => ({
  cancelBusinessApplication: vi.fn(),
}));

const pendingApplication: UserBusinessApplicationResponse = {
  id: 1,
  businessName: "나비바",
  businessRegistrationNumber: "123-45-67890",
  businessType: "HOUSEHOLD",
  representativeName: "대표자",
  contact: "010-0000-0000",
  status: "PENDING",
  createdAt: "2026-06-07T10:00:00",
};

const overview = (
  applications: UserBusinessApplicationResponse[],
  pendingApplications = applications.filter((application) => application.status === "PENDING"),
): UserBusinessApplicationOverviewResponse => ({
  hasHistory: applications.length > 0,
  latestApplication: applications[0],
  pendingApplications,
  recentApplications: applications,
});

describe("BusinessRegistrationSection", () => {
  it.each([true, false])("데스크톱 여부 %s에서 신청 폼에 회원 이메일을 전달한다", async (desktop) => {
    vi.mocked(useIsDesktop).mockReturnValue(desktop);
    vi.mocked(overlay.open).mockClear();
    render(<BusinessRegistrationSection businessApplicationOverview={null} memberEmail="member@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: "사업자 등록하기" }));
    const renderOverlay = vi.mocked(overlay.open).mock.calls[0][0];
    render(await renderOverlay({ isOpen: true, close: vi.fn(), unmount: vi.fn(), overlayId: "business-apply" }));
    expect(screen.getByLabelText("세금계산서 수신 이메일 (선택)")).toHaveValue("member@example.com");
  });

  it("심사 중 신청이 있어도 새 사업자 등록 버튼을 표시한다", () => {
    render(<BusinessRegistrationSection businessApplicationOverview={overview([pendingApplication])} />);

    expect(screen.getByRole("button", { name: "새 사업자 등록" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "사업자 등록 취소하기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "신청내역보기" })).toBeInTheDocument();
  });

  it("진행 중인 사업자 등록 신청을 모두 표시한다", () => {
    const secondPendingApplication: UserBusinessApplicationResponse = {
      ...pendingApplication,
      id: 2,
      businessName: "테스트샵",
      businessRegistrationNumber: "222-22-22222",
      createdAt: "2026-06-08T10:00:00",
    };
    const approvedApplication: UserBusinessApplicationResponse = {
      ...pendingApplication,
      id: 3,
      businessName: "승인된 사업장",
      status: "APPROVED",
    };

    render(
      <BusinessRegistrationSection
        businessApplicationOverview={overview([secondPendingApplication, pendingApplication, approvedApplication])}
      />,
    );

    expect(screen.getByText("테스트샵")).toBeInTheDocument();
    expect(screen.getByText("나비바")).toBeInTheDocument();
    expect(screen.queryByText("승인된 사업장")).not.toBeInTheDocument();
    expect(screen.getAllByText("심사중")).toHaveLength(2);
  });
});
