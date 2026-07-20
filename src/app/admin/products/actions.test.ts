import { patchApiAdminBottlesId, postApiAdminBottles, postApiS3Upload } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBottleFormAction, updateBottleFormAction } from "./actions";
import { MAX_BOTTLE_IMAGE_SIZE_MB } from "./image-constraints";

vi.mock("@/apis/generated/api", () => ({
  patchApiAdminBottlesId: vi.fn(),
  postApiAdminBottles: vi.fn(),
  postApiS3Upload: vi.fn(),
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
const mockedCreateBottle = vi.mocked(postApiAdminBottles);
const mockedUpdateBottle = vi.mocked(patchApiAdminBottlesId);
const mockedUpload = vi.mocked(postApiS3Upload);
const mockedRevalidatePath = vi.mocked(revalidatePath);
const mockedRedirect = vi.mocked(redirect);

function validBottleFormData(overrides: Record<string, FormDataEntryValue> = {}) {
  const formData = new FormData();
  formData.set("name", "나비 1st");
  formData.set("brand", "나비");
  formData.set("series", "1st");
  formData.set("company", "나비컴퍼니");
  formData.set("distillery", "나비 증류소");
  formData.set("maltType", "싱글몰트");
  formData.set("abv", "46.3");
  formData.set("capacity", "700");
  formData.set("stockQuantity", "10");
  formData.set("supplyPrice", "100000");
  formData.set("consumerPrice", "150000");
  formData.set("extraInfos", "{}");
  formData.set("labelImg", new File(["label"], "label.png", { type: "image/png" }));

  Object.entries(overrides).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

describe("bottle admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("admin-token");
    mockedUpload.mockResolvedValue({
      data: { key: "bottle-labels/navi-1st.png" },
      status: 200,
      headers: new Headers(),
    });
    mockedCreateBottle.mockResolvedValue({
      data: { id: 10, name: "나비 1st" },
      status: 200,
      headers: new Headers(),
    });
    mockedUpdateBottle.mockResolvedValue({
      data: { id: 10, name: "나비 1st" },
      status: 200,
      headers: new Headers(),
    });
  });

  it("creates a bottle with archive visibility enabled", async () => {
    await createBottleFormAction({ success: false }, validBottleFormData({ visible: "on" }));

    expect(mockedCreateBottle).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "나비 1st",
        labelImgKey: "bottle-labels/navi-1st.png",
        visible: true,
      }),
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/products");
    expect(mockedRedirect).toHaveBeenCalledWith("/admin/products");
  });

  it("sanitizes rich text and keeps safe description images", async () => {
    await createBottleFormAction(
      { success: false },
      validBottleFormData({
        description:
          '<p>테이스팅 노트</p><img src="https://cdn.example.com/note.png" onerror="alert(1)"><script>alert(1)</script>',
      }),
    );

    expect(mockedCreateBottle).toHaveBeenCalledWith(
      expect.objectContaining({
        description: '<p>테이스팅 노트</p><img src="https://cdn.example.com/note.png" />',
      }),
      { headers: { Authorization: "Bearer admin-token" } },
    );
  });

  it("updates a bottle with archive visibility disabled", async () => {
    const formData = validBottleFormData();
    formData.delete("visible");

    await updateBottleFormAction(10, { success: false }, formData);

    expect(mockedUpdateBottle).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        name: "나비 1st",
        visible: false,
      }),
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/products");
    expect(mockedRedirect).toHaveBeenCalledWith("/admin/products/10");
  });

  it("returns the bottle image limit without uploading an oversized image", async () => {
    const oversizedImage = new File([new Uint8Array(MAX_BOTTLE_IMAGE_SIZE_MB * 1024 * 1024 + 1)], "large.png", {
      type: "image/png",
    });

    const result = await createBottleFormAction({ success: false }, validBottleFormData({ labelImg: oversizedImage }));

    expect(result.error).toContain(`최대 ${MAX_BOTTLE_IMAGE_SIZE_MB}MB`);
    expect(result.values?.name).toBe("나비 1st");
    expect(mockedUpload).not.toHaveBeenCalled();
  });
});
