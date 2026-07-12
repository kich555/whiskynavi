import { ApiError } from "@/apis/errors";
import {
  deleteApiAdminBottlesReservationsNoticesNoticeid,
  getApiAdminBottles,
  postApiAdminBottlesReservationsNotices,
  postApiAdminBottlesReservationsNoticesNoticeidAllocationExcel,
  postApiAdminBottlesReservationsNoticesNoticeidApplicationsRejectPending,
  putApiAdminBottlesReservationsNoticesNoticeid,
} from "@/apis/generated/api";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createNoticeFormAction,
  deleteNoticeAction,
  rejectPendingApplicationsAction,
  searchBottlesAction,
  updateNoticeAvailableQuantityAction,
  uploadReservationAllocationExcelAction,
} from "./actions";

vi.mock("@/apis/generated/api", () => ({
  PostApiAdminBottlesReservationsNoticesBodyGradeConditionsItemRequiredRole: {
    ROLE_GUEST: "ROLE_GUEST",
    ROLE_USER: "ROLE_USER",
    ROLE_ADMIN: "ROLE_ADMIN",
    ROLE_SUPER_ADMIN: "ROLE_SUPER_ADMIN",
    ROLE_CONSUMER: "ROLE_CONSUMER",
    ROLE_WHISKYNAVI_MEMBER: "ROLE_WHISKYNAVI_MEMBER",
    ROLE_WHISKYTALES_MEMBER: "ROLE_WHISKYTALES_MEMBER",
    ROLE_BLIND_MEMBER: "ROLE_BLIND_MEMBER",
    ROLE_BUSINESS: "ROLE_BUSINESS",
    ROLE_TRAILNTALE_BUSINESS: "ROLE_TRAILNTALE_BUSINESS",
    ROLE_COMMUNITY_BUSINESS: "ROLE_COMMUNITY_BUSINESS",
    ROLE_PICK_UP_BUSINESS: "ROLE_PICK_UP_BUSINESS",
  },
  deleteApiAdminBottlesReservationsNoticesNoticeid: vi.fn(),
  getApiAdminBottles: vi.fn(),
  postApiAdminBottlesReservationsApplicationsApplicationidCancel: vi.fn(),
  postApiAdminBottlesReservationsApplicationsApplicationidConfirm: vi.fn(),
  postApiAdminBottlesReservationsApplicationsApplicationidReject: vi.fn(),
  postApiAdminBottlesReservationsNotices: vi.fn(),
  postApiAdminBottlesReservationsNoticesNoticeidApplicationsRejectPending: vi.fn(),
  postApiAdminBottlesReservationsNoticesNoticeidAllocationExcel: vi.fn(),
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
  revalidateTag: vi.fn(),
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

describe("searchBottlesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("기존 예약 유무와 관계없이 보틀을 검색한다", async () => {
    vi.mocked(getApiAdminBottles).mockResolvedValue({
      data: {
        content: [
          {
            id: 11,
            name: "Glen 12",
            stockQuantity: 3,
            reservationStatus: "RESERVATION_ONGOING",
          },
        ],
      },
      status: 200,
      headers: new Headers(),
    } as Awaited<ReturnType<typeof getApiAdminBottles>>);

    const result = await searchBottlesAction(" Glen ");

    expect(getApiAdminBottles).toHaveBeenCalledWith(
      {
        keyword: "Glen",
        size: 20,
      },
      { token: "admin-token" },
    );
    expect(result).toEqual({
      success: true,
      data: [
        {
          id: 11,
          name: "Glen 12",
          stockQuantity: 3,
        },
      ],
    });
  });
});

describe("uploadReservationAllocationExcelAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("파일이 없으면 안내 메시지를 반환하고 업로드 API를 호출하지 않는다", async () => {
    const result = await uploadReservationAllocationExcelAction(100, undefined as unknown as File);

    expect(result).toEqual({
      success: false,
      error: "Excel 파일을 선택해주세요.",
    });
    expect(postApiAdminBottlesReservationsNoticesNoticeidAllocationExcel).not.toHaveBeenCalled();
  });

  it("빈 파일이면 안내 메시지를 반환하고 업로드 API를 호출하지 않는다", async () => {
    const file = new File([], "allocation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await uploadReservationAllocationExcelAction(100, file);

    expect(result).toEqual({
      success: false,
      error: "Excel 파일을 선택해주세요.",
    });
    expect(postApiAdminBottlesReservationsNoticesNoticeidAllocationExcel).not.toHaveBeenCalled();
  });

  it("성공하면 응답 데이터를 반환하고 공고 목록과 상세를 재검증한다", async () => {
    const responseData = {
      success: true,
      noticeId: 100,
      processedRowCount: 2,
      allocatedApplicationCount: 2,
      rejectedApplicationCount: 1,
      totalAllocatedQuantity: 3,
      remainingQuantityBeforeAllocation: 10,
      remainingQuantityAfterAllocation: 7,
      failures: [],
    };
    vi.mocked(postApiAdminBottlesReservationsNoticesNoticeidAllocationExcel).mockResolvedValue({
      data: responseData,
      status: 200,
      headers: new Headers(),
    } as Awaited<ReturnType<typeof postApiAdminBottlesReservationsNoticesNoticeidAllocationExcel>>);
    const file = new File(["applicationId,allocatedQuantity"], "allocation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await uploadReservationAllocationExcelAction(100, file);

    expect(postApiAdminBottlesReservationsNoticesNoticeidAllocationExcel).toHaveBeenCalledWith(
      100,
      { file },
      { token: "admin-token" },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/reservations");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/reservations/100");
    expect(result).toEqual({ success: true, data: responseData });
  });

  it("할당 Excel 검증 실패 응답의 행별 실패 목록을 보존한다", async () => {
    const failures = [
      {
        rowNumber: 3,
        applicationId: 20,
        reason: "할당 수량은 신청 수량을 초과할 수 없습니다.",
      },
    ];
    vi.mocked(postApiAdminBottlesReservationsNoticesNoticeidAllocationExcel).mockRejectedValue(
      new ApiError(
        400,
        JSON.stringify({
          message: "예약 신청 Excel 할당을 처리할 수 없습니다.",
          failures,
        }),
      ),
    );
    const file = new File(["applicationId,allocatedQuantity"], "allocation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await uploadReservationAllocationExcelAction(100, file);

    expect(result).toEqual({
      success: false,
      error: "예약 신청 Excel 할당을 처리할 수 없습니다.",
      failures,
    });
  });
});

describe("rejectPendingApplicationsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("미처리 신청 일괄 거절 API를 호출하고 목록과 상세를 재검증한다", async () => {
    const responseData = {
      noticeId: 100,
      targetApplicationCount: 2,
      rejectedApplicationCount: 2,
      applicationIds: [10, 11],
    };
    vi.mocked(postApiAdminBottlesReservationsNoticesNoticeidApplicationsRejectPending).mockResolvedValue({
      data: responseData,
      status: 200,
      headers: new Headers(),
    } as Awaited<ReturnType<typeof postApiAdminBottlesReservationsNoticesNoticeidApplicationsRejectPending>>);

    const result = await rejectPendingApplicationsAction(100);

    expect(postApiAdminBottlesReservationsNoticesNoticeidApplicationsRejectPending).toHaveBeenCalledWith(100, {
      token: "admin-token",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/reservations");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/reservations/100");
    expect(result).toEqual({ success: true, data: responseData });
  });
});

describe("updateNoticeAvailableQuantityAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("현재 공고 값과 변경할 남은 수락 수량을 함께 보내 공고를 수정한다", async () => {
    vi.mocked(putApiAdminBottlesReservationsNoticesNoticeid).mockResolvedValue({
      data: {},
      status: 200,
      headers: new Headers(),
    } as Awaited<ReturnType<typeof putApiAdminBottlesReservationsNoticesNoticeid>>);

    const result = await updateNoticeAvailableQuantityAction({
      noticeId: 100,
      bottleId: 11,
      price: 120000,
      reservationStartAt: "2026-06-08T10:00:00.000Z",
      reservationEndAt: "2026-06-08T12:00:00.000Z",
      maxOrderQuantity: 2,
      availableQuantity: 7,
      description: "설명",
      gradeConditions: [
        {
          applicableFrom: "2026-06-08T10:00:00.000Z",
          requiredRole: "ROLE_USER",
        },
      ],
    });

    expect(putApiAdminBottlesReservationsNoticesNoticeid).toHaveBeenCalledWith(
      100,
      expect.objectContaining({
        bottleId: 11,
        availableQuantity: 7,
        maxOrderQuantity: 2,
      }),
      { token: "admin-token" },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/reservations/100");
    expect(result).toEqual({ success: true });
  });
});

describe("deleteNoticeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("예약 공고 삭제 API를 호출하고 목록과 상세를 재검증한다", async () => {
    vi.mocked(deleteApiAdminBottlesReservationsNoticesNoticeid).mockResolvedValue({
      data: undefined,
      status: 204,
      headers: new Headers(),
    } as Awaited<ReturnType<typeof deleteApiAdminBottlesReservationsNoticesNoticeid>>);

    const result = await deleteNoticeAction(100);

    expect(deleteApiAdminBottlesReservationsNoticesNoticeid).toHaveBeenCalledWith(100, {
      token: "admin-token",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/reservations");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/reservations/100");
    expect(result).toEqual({ success: true });
  });

  it("확정 또는 결제된 신청이 있으면 백엔드 메시지를 반환한다", async () => {
    vi.mocked(deleteApiAdminBottlesReservationsNoticesNoticeid).mockRejectedValue(
      new ApiError(
        400,
        JSON.stringify({
          message: "예약이 확정되었거나 결제된 신청이 있는 공고는 삭제할 수 없습니다.",
        }),
      ),
    );

    const result = await deleteNoticeAction(100);

    expect(result).toEqual({
      success: false,
      error: "예약이 확정되었거나 결제된 신청이 있는 공고는 삭제할 수 없습니다.",
    });
  });
});
