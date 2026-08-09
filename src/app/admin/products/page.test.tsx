import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductsPage from "./page";

const mocks = vi.hoisted(() => ({
  getBottles: vi.fn(),
  getParameters: vi.fn(),
  getAuthToken: vi.fn(),
}));

vi.mock("@/apis/generated/api", () => ({
  GetApiV2AdminBottlesSortBy: {
    ID: "ID",
    NAME: "NAME",
    ABV: "ABV",
    CAPACITY: "CAPACITY",
    BOTTLED_DATE: "BOTTLED_DATE",
  },
  GetApiV2AdminBottlesSortDirection: { ASC: "ASC", DESC: "DESC" },
  getApiV2AdminBottles: mocks.getBottles,
  getApiV2AdminBottlesParameters: mocks.getParameters,
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token?: string) => ({ token })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: mocks.getAuthToken,
}));

vi.mock("./_components/ProductsContent", () => ({
  default: ({ products, caskTypes }: { products: Array<{ name?: string }>; caskTypes: string[] }) => (
    <div>
      {products[0]?.name} / {caskTypes.join(",")}
    </div>
  ),
}));

describe("ProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthToken.mockResolvedValue("admin-token");
    mocks.getBottles.mockResolvedValue({
      data: { content: [{ id: 10, name: "테스트 보틀" }], page: { totalElements: 1 } },
    });
    mocks.getParameters.mockResolvedValue({
      data: {
        brands: ["Macallan"],
        distilleries: ["Macallan"],
        series: ["Sherry Oak"],
        caskTypes: ["Sherry"],
      },
    });
  });

  it("URL의 검색·필터·정렬 조건을 관리자 보틀 2.0 API에 전달한다", async () => {
    const page = await ProductsPage({
      searchParams: Promise.resolve({
        page: "3",
        limit: "50",
        q: "macallan 18",
        brand: "Macallan",
        distillery: "Macallan",
        series: "Sherry Oak",
        caskType: "Sherry",
        visible: "false",
        sortBy: "ABV",
        sortDirection: "ASC",
      }),
    });

    render(page);

    expect(mocks.getBottles).toHaveBeenCalledWith(
      {
        page: 2,
        size: 50,
        keyword: "macallan 18",
        brand: ["Macallan"],
        distillery: ["Macallan"],
        series: ["Sherry Oak"],
        caskType: ["Sherry"],
        visible: false,
        sortBy: "ABV",
        sortDirection: "ASC",
      },
      { token: "admin-token" },
    );
    expect(mocks.getParameters).toHaveBeenCalledWith({ token: "admin-token" });
    expect(screen.getByText("테스트 보틀 / Sherry")).toBeInTheDocument();
  });

  it("허용하지 않는 정렬과 노출값은 API에 전달하지 않는다", async () => {
    await ProductsPage({
      searchParams: Promise.resolve({
        visible: "invalid",
        sortBy: "DROP_TABLE",
        sortDirection: "SIDEWAYS",
      }),
    });

    expect(mocks.getBottles).toHaveBeenCalledWith(
      expect.objectContaining({
        visible: undefined,
        sortBy: undefined,
        sortDirection: undefined,
      }),
      { token: "admin-token" },
    );
  });
});
