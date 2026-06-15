import { postApiAdminOrdersManualPurchasesImport } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadManualPurchaseImportAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  getGetApiAdminOrdersManualPurchasesImportTemplateUrl: () => "/api/admin/orders/manual-purchases/import/template",
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

  it("xlsx 파일이 아니면 API 호출 없이 실패한다", async () => {
    const file = new File(["id"], "manual-purchases.csv", { type: "text/csv" });

    const result = await uploadManualPurchaseImportAction(file, "ONE_USER_MANY_BOTTLES", true);

    expect(result).toEqual({ success: false, error: "xlsx Excel 파일만 업로드할 수 있습니다." });
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
