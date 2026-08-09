import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BannersPage from "./page";

const mocks = vi.hoisted(() => ({
  getPublished: vi.fn(),
  getUnpublished: vi.fn(),
  getAuthToken: vi.fn(),
  renderContent: vi.fn(),
}));

vi.mock("@/apis/generated/api", () => ({
  getApiV2AdminBannersPublished: mocks.getPublished,
  getApiV2AdminBannersUnpublished: mocks.getUnpublished,
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token?: string) => ({ token })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: mocks.getAuthToken,
}));

vi.mock("./_components/BannersContent", () => ({
  default: (props: Record<string, unknown>) => {
    mocks.renderContent(props);
    return <div>배너 구역</div>;
  },
}));

describe("BannersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthToken.mockResolvedValue("admin-token");
    mocks.getPublished.mockResolvedValue({
      data: { content: [{ id: 1, published: true }], page: { totalElements: 25 } },
    });
    mocks.getUnpublished.mockResolvedValue({
      data: { content: [{ id: 2, published: false }], page: { totalElements: 31 } },
    });
  });

  it("게시 상태별 2.0 API를 독립된 페이지 조건으로 병렬 조회한다", async () => {
    const page = await BannersPage({
      searchParams: Promise.resolve({
        publishedPage: "2",
        publishedLimit: "20",
        unpublishedPage: "3",
        unpublishedLimit: "10",
      }),
    });

    render(page);

    expect(mocks.getPublished).toHaveBeenCalledWith({ page: 1, size: 20 }, { token: "admin-token" });
    expect(mocks.getUnpublished).toHaveBeenCalledWith({ page: 2, size: 10 }, { token: "admin-token" });
    expect(mocks.renderContent).toHaveBeenCalledWith(
      expect.objectContaining({
        publishedTotalElements: 25,
        publishedPage: 2,
        publishedLimit: 20,
        unpublishedTotalElements: 31,
        unpublishedPage: 3,
        unpublishedLimit: 10,
      }),
    );
    expect(screen.getByText("배너 구역")).toBeInTheDocument();
  });
});
