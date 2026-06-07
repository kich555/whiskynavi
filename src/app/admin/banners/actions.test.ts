import {
  deleteApiAdminBannersId,
  patchApiAdminBannersIdPublish,
  patchApiAdminBannersIdUnpublish,
  patchApiAdminBannersOrders,
} from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteBannerAction,
  publishBannerAction,
  unpublishBannerAction,
  updateBannerOrdersAction,
} from "./actions";

vi.mock("@/apis/generated/api", () => ({
  deleteApiAdminBannersId: vi.fn(),
  patchApiAdminBannersId: vi.fn(),
  patchApiAdminBannersIdPublish: vi.fn(),
  patchApiAdminBannersIdUnpublish: vi.fn(),
  patchApiAdminBannersOrders: vi.fn(),
  postApiAdminBanners: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedPublish = vi.mocked(patchApiAdminBannersIdPublish);
const mockedUnpublish = vi.mocked(patchApiAdminBannersIdUnpublish);
const mockedDelete = vi.mocked(deleteApiAdminBannersId);
const mockedUpdateOrders = vi.mocked(patchApiAdminBannersOrders);
const mockedRevalidatePath = vi.mocked(revalidatePath);

describe("banner admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("admin-token");
    mockedPublish.mockResolvedValue({ data: { id: 10, published: true }, status: 200, headers: new Headers() });
    mockedUnpublish.mockResolvedValue({ data: { id: 10, published: false }, status: 200, headers: new Headers() });
    mockedDelete.mockResolvedValue({ data: undefined, status: 200, headers: new Headers() });
    mockedUpdateOrders.mockResolvedValue({ data: [], status: 200, headers: new Headers() });
  });

  it("publishes a banner with admin token and revalidates banner pages", async () => {
    await expect(publishBannerAction(10)).resolves.toEqual({ success: true });

    expect(mockedPublish).toHaveBeenCalledWith(10, {
      headers: { Authorization: "Bearer admin-token" },
    });
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/banners");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/banners/10");
  });

  it("unpublishes a banner with admin token and revalidates banner pages", async () => {
    await expect(unpublishBannerAction(10)).resolves.toEqual({ success: true });

    expect(mockedUnpublish).toHaveBeenCalledWith(10, {
      headers: { Authorization: "Bearer admin-token" },
    });
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/banners");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/banners/10");
  });

  it("soft deletes a banner with admin token and revalidates banner pages", async () => {
    await expect(deleteBannerAction(10)).resolves.toEqual({ success: true });

    expect(mockedDelete).toHaveBeenCalledWith(10, {
      headers: { Authorization: "Bearer admin-token" },
    });
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/banners");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/banners/10");
  });

  it("updates banner order pairs with admin token", async () => {
    await expect(
      updateBannerOrdersAction([
        { id: 1, sortOrder: 20 },
        { id: 2, sortOrder: 10 },
      ]),
    ).resolves.toEqual({ success: true });

    expect(mockedUpdateOrders).toHaveBeenCalledWith(
      {
        items: [
          { id: 1, sortOrder: 20 },
          { id: 2, sortOrder: 10 },
        ],
      },
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/banners");
  });

  it("rejects banner actions without an auth token", async () => {
    mockedGetAuthToken.mockResolvedValue(undefined);

    await expect(publishBannerAction(10)).resolves.toEqual({
      success: false,
      error: "인증이 필요합니다.",
    });
    expect(mockedPublish).not.toHaveBeenCalled();
  });
});
