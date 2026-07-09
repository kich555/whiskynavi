import { getApiAdminBottlesReservationsNoticesNoticeid } from "@/apis/generated/api";
import { describe, expect, it, vi } from "vitest";
import NoticeEditPage from "./page";

vi.mock("@/apis/generated/api", () => ({
  getApiAdminBottlesReservationsNoticesNoticeid: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token: string) => ({ token })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn().mockResolvedValue("admin-token"),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("./_components/NoticeEditContent", () => ({
  default: vi.fn(() => null),
}));

describe("NoticeEditPage", () => {
  it("CLOSED 상태 예약 공고도 편집 페이지를 렌더링한다", async () => {
    vi.mocked(getApiAdminBottlesReservationsNoticesNoticeid).mockResolvedValue({
      data: {
        id: 7,
        saleStatus: "CLOSED",
        reservationEndAt: new Date(Date.now() + 60_000).toISOString(),
      },
      status: 200,
      headers: new Headers(),
    } as Awaited<ReturnType<typeof getApiAdminBottlesReservationsNoticesNoticeid>>);

    await expect(NoticeEditPage({ params: Promise.resolve({ noticeId: "7" }) })).resolves.toBeTruthy();
  });
});
