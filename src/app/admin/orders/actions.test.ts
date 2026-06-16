import {
  getApiAdminOrdersDeliveryExport,
  patchApiAdminOrdersOrderidDeliveryComplete,
  patchApiAdminOrdersOrderidDeliveryShip,
  patchApiAdminOrdersOrderidStatus,
} from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  completeAdminOrderDelivery,
  exportAdminDeliveryCsv,
  shipAdminOrderDelivery,
  updateAdminOrderStatus,
} from "./actions";

vi.mock("@/apis/generated/api", () => ({
  getApiAdminOrdersDeliveryExport: vi.fn(),
  patchApiAdminOrdersOrderidDeliveryComplete: vi.fn(),
  patchApiAdminOrdersOrderidDeliveryShip: vi.fn(),
  patchApiAdminOrdersOrderidStatus: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedShip = vi.mocked(patchApiAdminOrdersOrderidDeliveryShip);
const mockedComplete = vi.mocked(patchApiAdminOrdersOrderidDeliveryComplete);
const mockedStatus = vi.mocked(patchApiAdminOrdersOrderidStatus);
const mockedExport = vi.mocked(getApiAdminOrdersDeliveryExport);

describe("admin order actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("admin-token");
  });

  it("ships delivery with default CJ carrier when carrier is empty", async () => {
    mockedShip.mockResolvedValue({ data: { trackingNumber: "1234567890" }, status: 200, headers: new Headers() });

    await expect(shipAdminOrderDelivery(10, { carrierName: "", trackingNumber: "1234567890" })).resolves.toEqual({
      success: true,
    });
    expect(mockedShip).toHaveBeenCalledWith(
      10,
      { carrierName: "CJ대한통운", trackingNumber: "1234567890" },
      { headers: { Authorization: "Bearer admin-token" } },
    );
  });

  it("completes delivery with optional deliveredAt", async () => {
    mockedComplete.mockResolvedValue({
      data: { deliveredAt: "2026-05-21T14:00:00" },
      status: 200,
      headers: new Headers(),
    });

    await expect(completeAdminOrderDelivery(10, "2026-05-21T14:00:00")).resolves.toEqual({ success: true });
    expect(mockedComplete).toHaveBeenCalledWith(
      10,
      { deliveredAt: "2026-05-21T14:00:00" },
      { headers: { Authorization: "Bearer admin-token" } },
    );
  });

  it("updates cancel status with reason", async () => {
    mockedStatus.mockResolvedValue({ data: { orderStatus: "ORDER_CANCELED" }, status: 200, headers: new Headers() });

    await expect(updateAdminOrderStatus(10, "ORDER_CANCELED", "취소 승인")).resolves.toEqual({ success: true });
    expect(mockedStatus).toHaveBeenCalledWith(
      10,
      { orderStatus: "ORDER_CANCELED", reason: "취소 승인" },
      { headers: { Authorization: "Bearer admin-token" } },
    );
  });

  it("exports direct delivery immediate item orders", async () => {
    mockedExport.mockResolvedValue({ data: "csv-body", status: 200, headers: new Headers() });

    await expect(exportAdminDeliveryCsv()).resolves.toEqual({ success: true, data: "csv-body" });
    expect(mockedExport).toHaveBeenCalledWith(
      {
        productType: "ITEM",
        fulfillmentMethod: "DIRECT_DELIVERY",
        saleTiming: "IMMEDIATE",
      },
      { headers: { Authorization: "Bearer admin-token" } },
    );
  });
});
