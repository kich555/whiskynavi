import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BottleSeriesPage from "./page";

const mocks = vi.hoisted(() => ({
  getBottleSeries: vi.fn(),
  getBottlesParameters: vi.fn(),
  getAuthToken: vi.fn(),
  renderContent: vi.fn(),
}));

vi.mock("@/apis/generated/api", () => ({
  getApiV2AdminBottleSeries: mocks.getBottleSeries,
  getApiAdminBottlesParameters: mocks.getBottlesParameters,
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token?: string) => ({ token })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: mocks.getAuthToken,
}));

vi.mock("./_components/BottleSeriesContent", () => ({
  default: (props: Record<string, unknown>) => {
    mocks.renderContent(props);
    return <div>보틀 시리즈 목록</div>;
  },
}));

describe("BottleSeriesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthToken.mockResolvedValue("admin-token");
    mocks.getBottleSeries.mockResolvedValue({
      data: {
        content: [{ id: 1, brand: "Macallan", series: "Double Cask" }],
        totalElements: 24,
      },
    });
    mocks.getBottlesParameters.mockResolvedValue({
      data: { brands: ["Macallan", "Glenfiddich"] },
    });
  });

  it("검색, 노출 여부, 브랜드, 페이지 조건으로 2.0 관리자 API를 조회한다", async () => {
    const page = await BottleSeriesPage({
      searchParams: Promise.resolve({
        page: "2",
        limit: "10",
        q: " macallan ",
        visible: "false",
        brand: " Macallan ",
      }),
    });

    render(page);

    expect(mocks.getBottleSeries).toHaveBeenCalledWith(
      { keyword: "macallan", visible: false, brand: "Macallan", page: 1, size: 10 },
      { token: "admin-token" },
    );
    expect(mocks.renderContent).toHaveBeenCalledWith(
      expect.objectContaining({
        series: [{ id: 1, brand: "Macallan", series: "Double Cask" }],
        totalElements: 24,
        brands: ["Macallan", "Glenfiddich"],
      }),
    );
    expect(screen.getByText("보틀 시리즈 목록")).toBeInTheDocument();
  });

  it("잘못된 페이지 크기와 노출 필터에는 기본값을 사용한다", async () => {
    const page = await BottleSeriesPage({
      searchParams: Promise.resolve({ limit: "999", visible: "invalid" }),
    });

    render(page);

    expect(mocks.getBottleSeries).toHaveBeenCalledWith(
      { keyword: undefined, visible: undefined, page: 0, size: 20 },
      { token: "admin-token" },
    );
  });

  it("page.totalElements 중첩 구조로 응답해도 총 개수를 올바르게 전달한다", async () => {
    mocks.getBottleSeries.mockResolvedValueOnce({
      data: {
        content: [{ id: 2, brand: "Glenfiddich", series: "12" }],
        page: { totalElements: 42 },
      },
    });

    const page = await BottleSeriesPage({ searchParams: Promise.resolve({}) });

    render(page);

    expect(mocks.renderContent).toHaveBeenCalledWith(
      expect.objectContaining({ totalElements: 42 }),
    );
  });
});
