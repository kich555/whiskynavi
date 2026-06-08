import { getApiAdminBottlesReservationsApplications } from "@/apis/generated/api";
import { describe, expect, it, vi } from "vitest";
import NoticeDetailPage from "./page";

vi.mock("@/apis/generated/api", () => ({
  GetApiAdminBottlesReservationsApplicationsRole: {
    ROLE_USER: "ROLE_USER",
  },
  GetApiAdminBottlesReservationsApplicationsStatus: {
    APPLIED: "APPLIED",
  },
  getApiAdminBottlesReservationsApplications: vi.fn().mockResolvedValue({
    data: { content: [], page: { totalElements: 0 } },
  }),
  getApiAdminBottlesReservationsNoticesNoticeid: vi.fn().mockResolvedValue({
    data: { id: 7 },
  }),
  getApiAdminReservationDeliveriesCompanies: vi.fn().mockResolvedValue({
    data: [],
  }),
  getApiAdminReservationDeliveriesNoticesNoticeid: vi.fn().mockResolvedValue({
    data: [],
  }),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token: string) => ({ token })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn().mockResolvedValue("admin-token"),
}));

vi.mock("@/lib/page-response", () => ({
  parseApiPage: vi.fn((page?: string) => (page ? Number(page) - 1 : 0)),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("./_components/NoticeDetailContent", () => ({
  default: vi.fn(() => null),
}));

describe("NoticeDetailPage", () => {
  it("예약 신청 목록을 예약신청시각 오름차순으로 조회한다", async () => {
    await NoticeDetailPage({
      params: Promise.resolve({ noticeId: "7" }),
      searchParams: Promise.resolve({ page: "2", limit: "50", role: "ROLE_USER", status: "APPLIED" }),
    });

    expect(getApiAdminBottlesReservationsApplications).toHaveBeenCalledWith(
      expect.objectContaining({
        noticeId: 7,
        page: 1,
        size: 50,
        sort: ["createdAt,asc", "id,asc"],
      }),
      { token: "admin-token" },
    );
  });
});
