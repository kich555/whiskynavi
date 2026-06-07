import type { UserBusinessApplicationResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BusinessRegistrationSection from "./BusinessRegistrationSection";

vi.mock("@/hooks/use-media-query", () => ({
  useIsDesktop: () => true,
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

describe("BusinessRegistrationSection", () => {
  it("심사 중 신청이 있어도 새 사업자 등록 버튼을 표시한다", () => {
    render(<BusinessRegistrationSection businessApplicationHistory={[pendingApplication]} />);

    expect(screen.getByRole("button", { name: "새 사업자 등록" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "사업자 등록 취소하기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "신청내역보기" })).toBeInTheDocument();
  });
});
