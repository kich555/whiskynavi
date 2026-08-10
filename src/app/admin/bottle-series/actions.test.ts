import {
  deleteApiV2AdminBottleSeriesSeriesid,
  postApiAdminImagesPurpose,
  postApiV2AdminBottleSeries,
  putApiV2AdminBottleSeriesSeriesid,
} from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteBottleSeriesAction, saveBottleSeriesAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  deleteApiV2AdminBottleSeriesSeriesid: vi.fn(),
  postApiAdminImagesPurpose: vi.fn(),
  postApiV2AdminBottleSeries: vi.fn(),
  putApiV2AdminBottleSeriesSeriesid: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedUploadImage = vi.mocked(postApiAdminImagesPurpose);
const mockedCreate = vi.mocked(postApiV2AdminBottleSeries);
const mockedUpdate = vi.mocked(putApiV2AdminBottleSeriesSeriesid);
const mockedDelete = vi.mocked(deleteApiV2AdminBottleSeriesSeriesid);

function createFormData(values: Record<string, string>) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("bottle series admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("admin-token");
  });

  it("대표 이미지를 업로드하고 보틀 시리즈를 생성한다", async () => {
    mockedUploadImage.mockResolvedValue({
      data: { key: "bottles/series/macallan.png" },
      status: 200,
      headers: new Headers(),
    });
    mockedCreate.mockResolvedValue({
      data: { id: 1, brand: "Macallan", series: "Double Cask", visible: true },
      status: 200,
      headers: new Headers(),
    });

    const formData = createFormData({
      brand: " Macallan ",
      series: " Double Cask ",
      description: "시리즈 설명",
      representativeBottleId: "10",
      visible: "on",
    });
    formData.set("imageFile", new File(["image"], "series.png", { type: "image/png" }));

    const result = await saveBottleSeriesAction(null, { success: false }, formData);

    expect(result).toEqual({
      success: true,
      data: { id: 1, brand: "Macallan", series: "Double Cask", visible: true },
    });
    expect(mockedUploadImage).toHaveBeenCalledWith(
      "BOTTLE",
      { file: expect.any(File) },
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(mockedCreate).toHaveBeenCalledWith(
      {
        brand: "Macallan",
        series: "Double Cask",
        description: "시리즈 설명",
        imageKey: "bottles/series/macallan.png",
        representativeBottleId: 10,
        visible: true,
      },
      { headers: { Authorization: "Bearer admin-token" } },
    );
  });

  it("기존 이미지 키를 유지하며 보틀 시리즈를 수정한다", async () => {
    mockedUpdate.mockResolvedValue({
      data: { id: 2, brand: "Glenlivet", series: "Archive", visible: false },
      status: 200,
      headers: new Headers(),
    });

    const result = await saveBottleSeriesAction(
      2,
      { success: false },
      createFormData({
        brand: "Glenlivet",
        series: "Archive",
        description: "",
        imageKey: "bottles/series/existing.webp",
        representativeBottleId: "",
      }),
    );

    expect(mockedUploadImage).not.toHaveBeenCalled();
    expect(mockedUpdate).toHaveBeenCalledWith(
      2,
      {
        brand: "Glenlivet",
        series: "Archive",
        description: undefined,
        imageKey: "bottles/series/existing.webp",
        representativeBottleId: undefined,
        visible: false,
      },
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(result.success).toBe(true);
  });

  it("필수값과 대표 보틀 ID를 API 호출 전에 검증한다", async () => {
    const missingBrand = await saveBottleSeriesAction(
      null,
      { success: false },
      createFormData({ brand: "", series: "Double Cask" }),
    );
    const invalidBottleId = await saveBottleSeriesAction(
      null,
      { success: false },
      createFormData({ brand: "Macallan", series: "Double Cask", representativeBottleId: "1.5" }),
    );

    expect(missingBrand.error).toBe("브랜드명은 필수입니다.");
    expect(invalidBottleId.error).toBe("대표 보틀 ID는 1 이상의 정수로 입력해주세요.");
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("인증 토큰을 포함해 보틀 시리즈를 삭제한다", async () => {
    mockedDelete.mockResolvedValue({ data: undefined, status: 200, headers: new Headers() });

    const result = await deleteBottleSeriesAction(7);

    expect(result).toEqual({ success: true });
    expect(mockedDelete).toHaveBeenCalledWith(7, { headers: { Authorization: "Bearer admin-token" } });
  });
});
