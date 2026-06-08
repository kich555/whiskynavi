import { postApiAdminBottlesReservationsNotices } from "@/apis/generated/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNoticeFormAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  getApiAdminBottles: vi.fn(),
  postApiAdminBottlesReservationsApplicationsApplicationidCancel: vi.fn(),
  postApiAdminBottlesReservationsApplicationsApplicationidConfirm: vi.fn(),
  postApiAdminBottlesReservationsApplicationsApplicationidReject: vi.fn(),
  postApiAdminBottlesReservationsNotices: vi.fn(),
  postApiAdminBottlesReservationsNoticesNoticeidAutoConfirm: vi.fn(),
  putApiAdminBottlesReservationsNoticesNoticeid: vi.fn(),
  putApiAdminReservationDeliveriesNoticesNoticeidBusinessesBusinessid: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token: string) => ({ token })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn().mockResolvedValue("admin-token"),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

function createValidFormData() {
  const formData = new FormData();
  formData.set("bottleId", "11");
  formData.set("bottleName", "테스트 보틀");
  formData.set("price", "120000");
  formData.set("availableQuantity", "20");
  formData.set("maxOrderQuantity", "2");
  formData.set("reservationStartAt", "2026-06-08T10:00:00.000Z");
  formData.set("reservationEndAt", "2026-06-08T12:00:00.000Z");
  formData.set("gradeConditions", "");
  return formData;
}

describe("createNoticeFormAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("등급 조건이 없으면 예약 시작 시각의 일반 회원 조건을 기본으로 생성한다", async () => {
    vi.mocked(postApiAdminBottlesReservationsNotices).mockResolvedValue({
      data: {},
      status: 200,
      headers: new Headers(),
    } as Awaited<ReturnType<typeof postApiAdminBottlesReservationsNotices>>);

    await expect(createNoticeFormAction({ success: false }, createValidFormData())).rejects.toThrow("NEXT_REDIRECT");

    expect(postApiAdminBottlesReservationsNotices).toHaveBeenCalledWith(
      expect.objectContaining({
        gradeConditions: [
          {
            applicableFrom: "2026-06-08T10:00:00.000Z",
            requiredRole: "ROLE_USER",
          },
        ],
      }),
      { token: "admin-token" },
    );
  });

  it("공고 생성 실패 시 제출한 입력값을 반환한다", async () => {
    vi.mocked(postApiAdminBottlesReservationsNotices).mockRejectedValue(new Error("등급 조건은 필수입니다."));

    const result = await createNoticeFormAction({ success: false }, createValidFormData());

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: "등급 조건은 필수입니다.",
        values: expect.objectContaining({
          bottleId: "11",
          bottleName: "테스트 보틀",
          price: "120000",
          availableQuantity: "20",
          maxOrderQuantity: "2",
          reservationStartAt: "2026-06-08T10:00:00.000Z",
          reservationEndAt: "2026-06-08T12:00:00.000Z",
        }),
      }),
    );
  });

  it("등급 조건을 직접 입력한 경우 예약 시작 시각 조건이 없으면 자세한 안내를 반환한다", async () => {
    const formData = createValidFormData();
    formData.set(
      "gradeConditions",
      JSON.stringify([
        {
          applicableFrom: "2026-06-08T11:00:00.000Z",
          requiredRole: "ROLE_WHISKYNAVI_MEMBER",
        },
      ]),
    );

    const result = await createNoticeFormAction({ success: false }, formData);

    expect(postApiAdminBottlesReservationsNotices).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error:
          "등급 조건에는 예약 시작 시각과 동일한 적용 시작일 조건이 1개 필요합니다. 예약 시작 즉시 신청 가능한 최소 회원 등급을 지정하는 조건입니다.",
        values: expect.objectContaining({
          gradeConditions: [
            {
              applicableFrom: "2026-06-08T11:00:00.000Z",
              requiredRole: "ROLE_WHISKYNAVI_MEMBER",
            },
          ],
        }),
      }),
    );
  });
});
