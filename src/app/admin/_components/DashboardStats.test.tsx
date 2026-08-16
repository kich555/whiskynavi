import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStats } from "../_lib/getStats";
import DashboardStats from "./DashboardStats";

vi.mock("../_lib/getStats", () => ({
  getStats: vi.fn(),
}));

describe("DashboardStats", () => {
  beforeEach(() => {
    vi.mocked(getStats).mockResolvedValue({
      totalUsers: 10,
      totalOrders: 20,
      totalBottles: 30,
      totalNotices: 40,
      totalApplications: 50,
      totalBusinessMembers: 60,
      totalUnansweredInquiries: 7,
    });
  });

  it("미응답 문의 카운트 카드를 표시한다", async () => {
    render(await DashboardStats());

    expect(screen.getByText("미응답 문의")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
