import {
  deleteApiAdminBannersId,
  patchApiAdminBannersId,
  patchApiAdminBannersIdPublish,
  patchApiAdminBannersIdUnpublish,
  patchApiAdminBannersOrders,
  postApiAdminBanners,
} from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createBannerFormAction,
  deleteBannerAction,
  publishBannerAction,
  unpublishBannerAction,
  updateBannerFormAction,
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

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedCreate = vi.mocked(postApiAdminBanners);
const mockedUpdate = vi.mocked(patchApiAdminBannersId);
const mockedPublish = vi.mocked(patchApiAdminBannersIdPublish);
const mockedUnpublish = vi.mocked(patchApiAdminBannersIdUnpublish);
const mockedDelete = vi.mocked(deleteApiAdminBannersId);
const mockedUpdateOrders = vi.mocked(patchApiAdminBannersOrders);
const mockedRevalidatePath = vi.mocked(revalidatePath);
const mockedRedirect = vi.mocked(redirect);

describe("banner admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("admin-token");
    mockedPublish.mockResolvedValue({ data: { id: 10, published: true }, status: 200, headers: new Headers() });
    mockedUnpublish.mockResolvedValue({ data: { id: 10, published: false }, status: 200, headers: new Headers() });
    mockedDelete.mockResolvedValue({ data: undefined, status: 200, headers: new Headers() });
    mockedUpdateOrders.mockResolvedValue({ data: [], status: 200, headers: new Headers() });
    mockedCreate.mockResolvedValue({ data: { id: 10, title: "배너" }, status: 200, headers: new Headers() });
    mockedUpdate.mockResolvedValue({ data: { id: 10 }, status: 200, headers: new Headers() });
  });

  it("creates a banner without requiring the unused main image", async () => {
    const backgroundImg = new File(["bg"], "background.png", { type: "image/png" });
    const formData = new FormData();
    formData.set("title", "배너");
    formData.set("backgroundImg", backgroundImg);

    await createBannerFormAction({ success: false }, formData);

    expect(mockedCreate).toHaveBeenCalledWith(
      {
        backgroundImg: expect.any(File),
      },
      {
        title: "배너",
        description: undefined,
        link: undefined,
      },
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/banners");
    expect(mockedRedirect).toHaveBeenCalledWith("/admin/banners");
  });

  it("updates a banner without requiring optional title", async () => {
    const formData = new FormData();
    formData.set("title", "");
    formData.set("description", "설명만 변경");

    await updateBannerFormAction(10, { success: false }, formData);

    expect(mockedUpdate).toHaveBeenCalledWith(
      10,
      {
        backgroundImg: undefined,
        mainImg: undefined,
      },
      {
        title: undefined,
        description: "설명만 변경",
        link: undefined,
      },
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(mockedRedirect).toHaveBeenCalledWith("/admin/banners/10");
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
