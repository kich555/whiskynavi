import type { AdminBannerResponse } from "@/apis/generated/api";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteBannerAction, publishBannerAction, unpublishBannerAction, updateBannerOrdersAction } from "../actions";
import BannersContent from "./BannersContent";

const push = vi.fn();
const refresh = vi.fn();
const toggle = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/app/admin/_components/AdminLayoutClient", () => ({
  useSidebar: () => ({ toggle }),
}));

vi.mock("../actions", () => ({
  deleteBannerAction: vi.fn(),
  publishBannerAction: vi.fn(),
  unpublishBannerAction: vi.fn(),
  updateBannerOrdersAction: vi.fn(),
}));

const mockedPublish = vi.mocked(publishBannerAction);
const mockedUnpublish = vi.mocked(unpublishBannerAction);
const mockedDelete = vi.mocked(deleteBannerAction);
const mockedUpdateOrders = vi.mocked(updateBannerOrdersAction);

function renderContent(banners: AdminBannerResponse[]) {
  const publishedBanners = banners.filter((banner) => banner.published);
  const unpublishedBanners = banners.filter((banner) => !banner.published);
  return render(
    <BannersContent
      searchParams={{}}
      publishedBanners={publishedBanners}
      publishedTotalElements={publishedBanners.length}
      publishedPage={1}
      publishedLimit={12}
      unpublishedBanners={unpublishedBanners}
      unpublishedTotalElements={unpublishedBanners.length}
      unpublishedPage={1}
      unpublishedLimit={12}
    />,
  );
}

describe("BannersContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPublish.mockResolvedValue({ success: true });
    mockedUnpublish.mockResolvedValue({ success: true });
    mockedDelete.mockResolvedValue({ success: true });
    mockedUpdateOrders.mockResolvedValue({ success: true });
  });

  it("renders publish state badges and matching actions", () => {
    renderContent([
      { id: 1, title: "첫 배너", published: true, sortOrder: 10, backgroundUrl: "/bg-1.png" },
      { id: 2, title: "둘째 배너", published: false, sortOrder: 20, backgroundUrl: "/bg-2.png" },
    ]);

    expect(screen.getByText("게시중")).toBeInTheDocument();
    expect(screen.getAllByText("게시중단").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "첫 배너 게시중단" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "둘째 배너 게시" })).toBeInTheDocument();
  });

  it("groups published banners first and disables ordering for unpublished banners", () => {
    renderContent([
      { id: 1, title: "첫 배너", published: true, sortOrder: 1, backgroundUrl: "/bg-1.png" },
      { id: 2, title: "중단 배너", published: false, sortOrder: 2, backgroundUrl: "/bg-2.png" },
      { id: 3, title: "둘째 배너", published: true, sortOrder: 3, backgroundUrl: "/bg-3.png" },
    ]);

    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .filter((heading) => heading.id.endsWith("-banners-heading"))
        .map((heading) => heading.textContent),
    ).toEqual(["게시 중인 배너", "게시 중단된 배너"]);
    expect(within(screen.getByRole("region", { name: "게시 중인 배너" })).getByText("첫 배너")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "게시 중인 배너" })).getByText("둘째 배너")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "게시 중단된 배너" })).getByText("중단 배너")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "첫 배너",
      "둘째 배너",
      "중단 배너",
    ]);
    expect(screen.getByRole("button", { name: "첫 배너 위로" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "둘째 배너 아래로" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "중단 배너 위로" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "중단 배너 아래로" })).toBeDisabled();
  });

  it("keeps the empty published section above unpublished banners", () => {
    renderContent([{ id: 2, title: "중단 배너", published: false, sortOrder: 2, backgroundUrl: "/bg-2.png" }]);

    const sections = screen.getAllByRole("region");
    expect(sections.map((section) => section.getAttribute("aria-labelledby"))).toEqual([
      "published-banners-heading",
      "unpublished-banners-heading",
    ]);
    expect(within(sections[0]).getByText("현재 게시 중인 배너가 없습니다.")).toBeInTheDocument();
  });

  it("moves only published banners using normalized positions", async () => {
    const user = userEvent.setup();
    renderContent([
      { id: 1, title: "첫 배너", published: true, sortOrder: 1, backgroundUrl: "/bg-1.png" },
      { id: 2, title: "중단 배너", published: false, sortOrder: 2, backgroundUrl: "/bg-2.png" },
      { id: 3, title: "둘째 배너", published: true, sortOrder: 3, backgroundUrl: "/bg-3.png" },
    ]);

    await user.click(screen.getByRole("button", { name: "첫 배너 아래로" }));

    await waitFor(() => {
      expect(mockedUpdateOrders).toHaveBeenCalledWith([
        { id: 1, sortOrder: 2 },
        { id: 3, sortOrder: 1 },
      ]);
    });
    expect(refresh).toHaveBeenCalled();
  });
});
