import {
  getApiBottlesReservationsNotices,
  getApiBottlesReservationsNoticesRecentEnded,
} from "@/apis/generated/api";
import { getServerSession } from "next-auth";
import { describe, expect, it, vi } from "vitest";
import ReservationPage from "./page";

vi.mock("@/apis/generated/api", () => ({
  getApiBottlesReservationsNotices: vi.fn().mockResolvedValue({
    data: { content: [], page: { totalElements: 0 } },
  }),
  getApiBottlesReservationsNoticesRecentEnded: vi.fn().mockResolvedValue({
    data: [],
  }),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token?: string) =>
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  ),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    accessToken: "user-token",
  }),
}));

vi.mock("../_components/Hero", () => ({
  default: vi.fn(() => null),
}));

vi.mock("./_components/ActiveReservationSection", () => ({
  default: vi.fn(() => null),
}));

vi.mock("./_components/EmptyState", () => ({
  default: vi.fn(() => null),
}));

vi.mock("./_components/RecentEndedSection", () => ({
  default: vi.fn(() => null),
}));

vi.mock("./_components/UnauthenticatedGuard", () => ({
  default: vi.fn(() => null),
}));

describe("ReservationPage", () => {
  it("로그인 사용자의 예약 목록 요청에 Authorization 헤더를 포함한다", async () => {
    await ReservationPage();

    expect(getServerSession).toHaveBeenCalled();
    expect(getApiBottlesReservationsNotices).toHaveBeenCalledWith(
      {
        page: 0,
        size: 100,
      },
      { headers: { Authorization: "Bearer user-token" } },
    );
    expect(getApiBottlesReservationsNoticesRecentEnded).toHaveBeenCalledWith({
      headers: { Authorization: "Bearer user-token" },
    });
  });
});
