import type { AdminBannerResponse } from "@/apis/generated/api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteBannerAction,
  publishBannerAction,
  unpublishBannerAction,
  updateBannerOrdersAction,
} from "../actions";
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
  return render(<BannersContent searchParams={{}} banners={banners} totalElements={banners.length} />);
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

  it("disables order buttons at list boundaries", () => {
    renderContent([
      { id: 1, title: "첫 배너", published: true, sortOrder: 10, backgroundUrl: "/bg-1.png" },
      { id: 2, title: "둘째 배너", published: false, sortOrder: 20, backgroundUrl: "/bg-2.png" },
    ]);

    expect(screen.getByRole("button", { name: "첫 배너 위로" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "둘째 배너 아래로" })).toBeDisabled();
  });

  it("swaps adjacent sort orders when moving a banner down", async () => {
    const user = userEvent.setup();
    renderContent([
      { id: 1, title: "첫 배너", published: true, sortOrder: 10, backgroundUrl: "/bg-1.png" },
      { id: 2, title: "둘째 배너", published: false, sortOrder: 20, backgroundUrl: "/bg-2.png" },
    ]);

    await user.click(screen.getByRole("button", { name: "첫 배너 아래로" }));

    await waitFor(() => {
      expect(mockedUpdateOrders).toHaveBeenCalledWith([
        { id: 1, sortOrder: 20 },
        { id: 2, sortOrder: 10 },
      ]);
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("uses row indexes when duplicate sort orders would otherwise make a swap a no-op", async () => {
    const user = userEvent.setup();
    renderContent([
      { id: 1, title: "첫 배너", published: true, sortOrder: 0, backgroundUrl: "/bg-1.png" },
      { id: 2, title: "둘째 배너", published: false, sortOrder: 0, backgroundUrl: "/bg-2.png" },
    ]);

    await user.click(screen.getByRole("button", { name: "첫 배너 아래로" }));

    await waitFor(() => {
      expect(mockedUpdateOrders).toHaveBeenCalledWith([
        { id: 1, sortOrder: 1 },
        { id: 2, sortOrder: 0 },
      ]);
    });
  });
});
