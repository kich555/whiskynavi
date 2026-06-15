import { postApiAdminOrdersManualPurchasesImport } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { downloadManualPurchaseImportTemplateAction, uploadManualPurchaseImportAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  getGetApiAdminOrdersManualPurchasesImportTemplateUrl: (
    params?: Record<string, string | number | undefined>,
  ) => {
    const searchParams = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value != null) searchParams.set(key, String(value));
    });
    const queryString = searchParams.toString();
    return `/api/admin/orders/manual-purchases/import/template${queryString ? `?${queryString}` : ""}`;
  },
  postApiAdminOrdersManualPurchasesImport: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: (token: string | null) => ({ headers: { Authorization: `Bearer ${token}` } }),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedUpload = vi.mocked(postApiAdminOrdersManualPurchasesImport);
const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedRevalidatePath = vi.mocked(revalidatePath);

describe("manual purchase import actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)),
      }),
    );
    mockedUpload.mockResolvedValue({
      data: {
        mode: "ONE_USER_MANY_BOTTLES",
        dryRun: true,
        totalRows: 1,
        successCount: 1,
        failureCount: 0,
        results: [],
      },
      status: 200,
      headers: new Headers(),
    });
  });

  it("템플릿 다운로드 조건을 query string으로 전달한다", async () => {
    const result = await downloadManualPurchaseImportTemplateAction({
      mode: "ONE_USER_MANY_BOTTLES",
      userId: 12,
    });

    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.whiskynavi.com/api/admin/orders/manual-purchases/import/template?mode=ONE_USER_MANY_BOTTLES&userId=12",
      {
        headers: { Authorization: "Bearer token" },
        cache: "no-store",
      },
    );
  });

  it("빈 파일이면 API 호출 없이 실패한다", async () => {
    const file = new File([], "manual-purchases.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await uploadManualPurchaseImportAction(file, "ONE_USER_MANY_BOTTLES", true);

    expect(result).toEqual({ success: false, error: "Excel 파일을 선택해주세요." });
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it("선택한 모드와 dryRun 값을 업로드 API로 전달한다", async () => {
    const file = new File(["content"], "manual-purchases.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await uploadManualPurchaseImportAction(file, "ONE_BOTTLE_MANY_USERS", false);

    expect(result.success).toBe(true);
    expect(mockedUpload).toHaveBeenCalledWith(
      { file },
      { mode: "ONE_BOTTLE_MANY_USERS", dryRun: false },
      { headers: { Authorization: "Bearer token" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/manual-purchases/import");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/orders");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/bottle-orders");
  });
});
