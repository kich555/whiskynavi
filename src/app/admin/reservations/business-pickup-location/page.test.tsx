import { getApiAdminBusinessesMembers, getApiAdminReservationsBusinessPickupLocation } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BusinessPickupSettingPage from "./page";

vi.mock("@/apis/generated/api", () => ({
  getApiAdminBusinessesMembers: vi.fn(),
  getApiAdminReservationsBusinessPickupLocation: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token: string) => ({ token })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("./_components/BusinessPickupSettingContent", () => ({
  default: vi.fn(() => null),
}));

describe("BusinessPickupSettingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthToken).mockResolvedValue("admin-token");
    vi.mocked(getApiAdminReservationsBusinessPickupLocation).mockResolvedValue({
      data: {
        assignmentType: "APPLICANT_BUSINESS_FALLBACK",
        businessId: null,
        businessName: null,
        pickupAddress: null,
        contact: null,
        updatedAt: null,
      },
      status: 200,
      headers: new Headers(),
    });
  });

  it("픽업 역할과 무관하게 전체 사업장을 조회하고 사업장 ID 중복을 제거한다", async () => {
    vi.mocked(getApiAdminBusinessesMembers)
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              businessId: 10,
              businessName: "가 업장",
              pickupAddress: "서울시 중구",
              hasPickupRole: false,
            },
          ],
          page: { totalPages: 2 },
        },
        status: 200,
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              businessId: 10,
              businessName: "가 업장",
              pickupAddress: "서울시 중구",
              hasPickupRole: false,
            },
            {
              businessId: 20,
              businessName: "나 업장",
              pickupAddress: "부산시 해운대구",
              hasPickupRole: true,
            },
          ],
          page: { totalPages: 2 },
        },
        status: 200,
        headers: new Headers(),
      });

    const page = await BusinessPickupSettingPage();

    expect(getApiAdminBusinessesMembers).toHaveBeenNthCalledWith(
      1,
      {
        page: 0,
        size: 200,
        sort: ["businessId,asc"],
      },
      { token: "admin-token" },
    );
    expect(getApiAdminBusinessesMembers).toHaveBeenNthCalledWith(
      2,
      {
        page: 1,
        size: 200,
        sort: ["businessId,asc"],
      },
      { token: "admin-token" },
    );
    expect(page.props.businesses).toEqual([
      {
        businessId: 10,
        businessName: "가 업장",
        pickupAddress: "서울시 중구",
      },
      {
        businessId: 20,
        businessName: "나 업장",
        pickupAddress: "부산시 해운대구",
      },
    ]);
  });
});
