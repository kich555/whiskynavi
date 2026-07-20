import {
  patchApiAdminItemsId,
  postApiAdminImagesPurpose,
  postApiAdminItems,
  postApiAdminSales,
} from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGeneralItemFormAction, createGeneralItemSaleFormAction, updateGeneralItemFormAction } from "./actions";
import { MAX_GENERAL_ITEM_IMAGE_SIZE_MB } from "./image-constraints";

vi.mock("@/apis/generated/api", () => ({
  patchApiAdminItemsId: vi.fn(),
  postApiAdminItems: vi.fn(),
  postApiAdminSales: vi.fn(),
  postApiAdminImagesPurpose: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedPatchItem = vi.mocked(patchApiAdminItemsId);
const mockedPostItem = vi.mocked(postApiAdminItems);
const mockedPostSale = vi.mocked(postApiAdminSales);
const mockedPostS3Upload = vi.mocked(postApiAdminImagesPurpose);

function formDataFrom(entries: Record<string, string | string[]>) {
  const formData = new FormData();
  Object.entries(entries).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item));
    } else {
      formData.set(key, value);
    }
  });
  return formData;
}

describe("general item admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("admin-token");
    mockedPostS3Upload.mockResolvedValue({ data: { key: "items/default.png" }, status: 200, headers: new Headers() });
  });

  it("validates required item name before creating a general delivery item", async () => {
    const result = await createGeneralItemFormAction({ success: false }, formDataFrom({ name: "" }));

    expect(result).toEqual({
      success: false,
      error: "상품명은 필수입니다.",
      values: { name: "" },
    });
    expect(mockedPostItem).not.toHaveBeenCalled();
  });

  it("creates a general delivery item with parsed numbers, visibility, and extra info", async () => {
    mockedPostItem.mockResolvedValue({
      data: { id: 10, name: "배송 패키지" },
      status: 200,
      headers: new Headers(),
    });

    const formData = formDataFrom({
      name: "배송 패키지",
      description: "배송 주문 가능한 일반 상품",
      stockQuantity: "7",
      supplyPrice: "12000",
      consumerPrice: "18000",
      visible: "on",
      extraInfos: '{"details":{"material":"glass"}}',
    });
    formData.set("imageFile", new File(["image"], "item.png", { type: "image/png" }));

    const result = await createGeneralItemFormAction({ success: false }, formData);

    expect(result).toEqual({ success: true, data: { id: 10, name: "배송 패키지" } });
    expect(mockedPostS3Upload).toHaveBeenCalledWith(
      "ITEM",
      { file: expect.any(File) },
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(mockedPostItem).toHaveBeenCalledWith(
      {
        name: "배송 패키지",
        imageKey: "items/default.png",
        description: "배송 주문 가능한 일반 상품",
        stockQuantity: 7,
        supplyPrice: 12000,
        consumerPrice: 18000,
        visible: true,
        extraInfos: { details: { material: "glass" } },
      },
      { headers: { Authorization: "Bearer admin-token" } },
    );
  });

  it("returns the general-item image limit and preserves entered values", async () => {
    const formData = formDataFrom({
      name: "작성 중인 일반상품",
      description: "보존할 설명",
    });
    formData.set(
      "imageFile",
      new File([new Uint8Array(MAX_GENERAL_ITEM_IMAGE_SIZE_MB * 1024 * 1024 + 1)], "large.png", {
        type: "image/png",
      }),
    );

    const result = await createGeneralItemFormAction({ success: false }, formData);

    expect(result.error).toContain(`최대 ${MAX_GENERAL_ITEM_IMAGE_SIZE_MB}MB`);
    expect(result.values).toMatchObject({
      name: "작성 중인 일반상품",
      description: "보존할 설명",
    });
    expect(mockedPostS3Upload).not.toHaveBeenCalled();
  });

  it("creates a general item sale announcement fixed to ITEM and GENERAL", async () => {
    mockedPostSale.mockResolvedValue({
      data: { id: 1001, productId: 10, productType: "ITEM", saleType: "GENERAL" },
      status: 200,
      headers: new Headers(),
    });

    const result = await createGeneralItemSaleFormAction(
      { success: false },
      formDataFrom({
        productId: "10",
        title: "배송 패키지 판매",
        itemName: "배송 패키지",
        salePrice: "18000",
        totalQuantity: "7",
        availableQuantity: "",
        maxOrderQuantity: "2",
        saleStatus: "OPEN",
        saleStartAt: "2026-05-22T10:00",
        saleEndAt: "2026-05-29T18:00",
        orderableRoles: ["ROLE_USER", "ROLE_WHISKYNAVI_MEMBER"],
      }),
    );

    expect(result).toEqual({
      success: true,
      data: { id: 1001, productId: 10, productType: "ITEM", saleType: "GENERAL" },
    });
    expect(mockedPostSale).toHaveBeenCalledWith(
      {
        productId: 10,
        productType: "ITEM",
        saleType: "GENERAL",
        title: "배송 패키지 판매",
        itemName: "배송 패키지",
        salePrice: 18000,
        totalQuantity: 7,
        availableQuantity: 7,
        maxOrderQuantity: 2,
        saleStatus: "OPEN",
        saleStartAt: "2026-05-22T10:00",
        saleEndAt: "2026-05-29T18:00",
        orderableRoles: ["ROLE_USER", "ROLE_WHISKYNAVI_MEMBER"],
      },
      { headers: { Authorization: "Bearer admin-token" } },
    );
  });

  it("updates a general delivery item with parsed form values", async () => {
    mockedPatchItem.mockResolvedValue({
      data: { id: 10, name: "수정 배송 패키지" },
      status: 200,
      headers: new Headers(),
    });

    const result = await updateGeneralItemFormAction(
      10,
      { success: false },
      formDataFrom({
        name: "수정 배송 패키지",
        description: "수정된 일반상품",
        imageKey: "items/old.png",
        stockQuantity: "9",
        supplyPrice: "13000",
        consumerPrice: "19000",
        visible: "on",
        extraInfos: '{"details":{"material":"paper"}}',
      }),
    );

    expect(result).toEqual({ success: true, data: { id: 10, name: "수정 배송 패키지" } });
    expect(mockedPatchItem).toHaveBeenCalledWith(
      10,
      {
        name: "수정 배송 패키지",
        description: "수정된 일반상품",
        imageKey: "items/old.png",
        stockQuantity: 9,
        supplyPrice: 13000,
        consumerPrice: 19000,
        visible: true,
        extraInfos: { details: { material: "paper" } },
      },
      { headers: { Authorization: "Bearer admin-token" } },
    );
  });
});
