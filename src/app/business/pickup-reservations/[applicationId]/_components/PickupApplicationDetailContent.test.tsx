import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PickupApplicationDetailContent from "./PickupApplicationDetailContent";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => <img src={src} alt={alt} className={className} />,
}));

const mockApplication = {
  id: 42,
  noticeId: 10,
  bottleId: 5,
  bottleName: "Yamazaki 12",
  bottleImgUrl: "https://example.com/bottle.jpg",
  applicantUser: {
    name: "이영희",
    nickname: "whisky_lover",
    email: "lee@example.com",
    phone: "010-1234-5678",
  },
  status: "CONFIRMED" as const,
  quantity: 1,
  confirmedQuantity: 1,
  createdAt: "2024-01-15T00:00:00Z",
  updatedAt: "2024-01-16T00:00:00Z",
};

describe("PickupApplicationDetailContent", () => {
  it("renders page title", () => {
    render(<PickupApplicationDetailContent application={mockApplication} />);
    expect(screen.getByText("픽업 예약 상세")).toBeInTheDocument();
  });

  it("renders bottle name", () => {
    render(<PickupApplicationDetailContent application={mockApplication} />);
    expect(screen.getAllByText("Yamazaki 12").length).toBeGreaterThan(0);
  });

  it("renders applicant name", () => {
    render(<PickupApplicationDetailContent application={mockApplication} />);
    expect(screen.getByText("이영희")).toBeInTheDocument();
  });

  it("renders applicant email", () => {
    render(<PickupApplicationDetailContent application={mockApplication} />);
    expect(screen.getByText("lee@example.com")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<PickupApplicationDetailContent application={mockApplication} />);
    expect(screen.getByText("확정")).toBeInTheDocument();
  });

  it("renders back button", () => {
    render(<PickupApplicationDetailContent application={mockApplication} />);
    expect(
      screen.getByText("픽업 예약 목록으로 돌아가기"),
    ).toBeInTheDocument();
  });

  it("renders bottle image when bottleImgUrl is provided", () => {
    render(<PickupApplicationDetailContent application={mockApplication} />);
    const img = screen.getByAltText("Yamazaki 12");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/bottle.jpg");
  });

  it("does not render image when bottleImgUrl is absent", () => {
    const appWithoutImage = { ...mockApplication, bottleImgUrl: undefined };
    render(
      <PickupApplicationDetailContent application={appWithoutImage} />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
