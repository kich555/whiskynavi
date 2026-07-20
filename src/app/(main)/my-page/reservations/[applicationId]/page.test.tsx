import { ApiError } from "@/apis/errors";
import { getApiBottlesReservationsApplicationsApplicationidNotice } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RelatedReservationNoticePage from "./page";

vi.mock("@/apis/generated/api", () => ({
  getApiBottlesReservationsApplicationsApplicationidNotice: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token: string) => ({ headers: { Authorization: `Bearer ${token}` } })),
}));

vi.mock("@/components/reservation/RelatedNoticeDetail", () => ({
  default: vi.fn(() => null),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
  getAuthToken: vi.fn(),
  hasBusinessRole: vi.fn((roles?: string[]) => roles?.includes("ROLE_BUSINESS") ?? false),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("RelatedReservationNoticePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({ user: {} });
    vi.mocked(getAuthToken).mockResolvedValue("access-token");
  });

  it("404 응답만 notFound로 처리한다", async () => {
    vi.mocked(getApiBottlesReservationsApplicationsApplicationidNotice).mockRejectedValue(
      new ApiError(404, "공고를 찾을 수 없습니다."),
    );

    await expect(RelatedReservationNoticePage({ params: Promise.resolve({ applicationId: "42" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("서버 오류는 notFound로 바꾸지 않고 다시 전달한다", async () => {
    const error = new ApiError(500, "일시적인 서버 오류");
    vi.mocked(getApiBottlesReservationsApplicationsApplicationidNotice).mockRejectedValue(error);

    await expect(RelatedReservationNoticePage({ params: Promise.resolve({ applicationId: "42" }) })).rejects.toBe(
      error,
    );
  });
});
