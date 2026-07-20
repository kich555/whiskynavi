import { ApiError } from "@/apis/errors";
import { getApiUsersBusinessesPickupReservationsNoticesNoticeidDetail } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BusinessRelatedNoticePage from "./page";

vi.mock("@/apis/generated/api", () => ({
  getApiUsersBusinessesPickupReservationsNoticesNoticeidDetail: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token: string) => ({ headers: { Authorization: `Bearer ${token}` } })),
}));

vi.mock("@/components/reservation/RelatedNoticeDetail", () => ({
  default: vi.fn(() => null),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("BusinessRelatedNoticePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthToken).mockResolvedValue("access-token");
  });

  it("선택한 사업장 ID로 공고 내용을 조회한다", async () => {
    vi.mocked(getApiUsersBusinessesPickupReservationsNoticesNoticeidDetail).mockResolvedValue({
      data: { id: 10, noticeName: "선택 사업장 공고" },
    } as Awaited<ReturnType<typeof getApiUsersBusinessesPickupReservationsNoticesNoticeidDetail>>);

    await BusinessRelatedNoticePage({
      params: Promise.resolve({ noticeId: "10" }),
      searchParams: Promise.resolve({ businessId: "12" }),
    });

    expect(getApiUsersBusinessesPickupReservationsNoticesNoticeidDetail).toHaveBeenCalledWith(
      10,
      { businessId: 12 },
      { headers: { Authorization: "Bearer access-token" } },
    );
  });

  it("404 응답만 notFound로 처리한다", async () => {
    vi.mocked(getApiUsersBusinessesPickupReservationsNoticesNoticeidDetail).mockRejectedValue(
      new ApiError(404, "공고를 찾을 수 없습니다."),
    );

    await expect(
      BusinessRelatedNoticePage({
        params: Promise.resolve({ noticeId: "10" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("서버 오류는 notFound로 바꾸지 않고 다시 전달한다", async () => {
    const error = new ApiError(500, "일시적인 서버 오류");
    vi.mocked(getApiUsersBusinessesPickupReservationsNoticesNoticeidDetail).mockRejectedValue(error);

    await expect(
      BusinessRelatedNoticePage({
        params: Promise.resolve({ noticeId: "10" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toBe(error);
  });
});
