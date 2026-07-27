import { ApiError } from "@/apis/errors";
import {
  getApiBottlesReservationsApplicationsMe,
  getApiBusinessesBusinessidBottlesReservationsApplications,
  getApiUsersBusinessesContext,
} from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchNoticeDetail } from "../_lib/fetchNoticeDetail";
import { fetchPickupLocations } from "../_lib/fetchPickupLocations";
import ReservationDetailPage from "./page";

vi.mock("@/apis/generated/api", () => ({
  getApiBottlesReservationsApplicationsMe: vi.fn(),
  getApiBusinessesBusinessidBottlesReservationsApplications: vi.fn(),
  getApiUsersBusinessesContext: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token: string) => ({ headers: { Authorization: `Bearer ${token}` } })),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
  hasBusinessRole: vi.fn((roles?: string[]) => roles?.includes("ROLE_BUSINESS") ?? false),
}));

vi.mock("@/lib/page-response", () => ({
  parsePositiveInt: vi.fn((value?: string) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }),
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

vi.mock("../_lib/fetchNoticeDetail", () => ({
  fetchNoticeDetail: vi.fn(),
}));

vi.mock("../_lib/fetchPickupLocations", () => ({
  fetchPickupLocations: vi.fn(),
}));

vi.mock("./_components/ReservationDetailClient", () => ({
  default: vi.fn(() => null),
}));

describe("ReservationDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      accessToken: "access-token",
      user: { roles: ["ROLE_USER"] },
    });
    vi.mocked(fetchPickupLocations).mockResolvedValue([]);
    vi.mocked(getApiBottlesReservationsApplicationsMe).mockResolvedValue({
      data: { content: [] },
      status: 200,
      headers: new Headers(),
    });
    vi.mocked(getApiUsersBusinessesContext).mockResolvedValue({
      data: { businesses: [] },
      status: 200,
      headers: new Headers(),
    });
    vi.mocked(getApiBusinessesBusinessidBottlesReservationsApplications).mockResolvedValue({
      data: { content: [] },
      status: 200,
      headers: new Headers(),
    });
  });

  it("403 응답은 접근할 수 없는 공고 안내로 표시한다", async () => {
    vi.mocked(fetchNoticeDetail).mockRejectedValue(new ApiError(403, ""));

    const page = await ReservationDetailPage({
      params: Promise.resolve({ noticeId: "7" }),
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(screen.getByRole("heading", { name: "접근할 수 없는 예약 공고입니다" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "예약 공고 목록으로 돌아가기" })).toHaveAttribute("href", "/reservation");
    expect(notFound).not.toHaveBeenCalled();
  });

  it("404 응답은 notFound로 처리한다", async () => {
    vi.mocked(fetchNoticeDetail).mockRejectedValue(new ApiError(404, ""));

    await expect(
      ReservationDetailPage({
        params: Promise.resolve({ noticeId: "7" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("서버 오류는 notFound로 바꾸지 않고 다시 전달한다", async () => {
    const error = new ApiError(500, "");
    vi.mocked(fetchNoticeDetail).mockRejectedValue(error);

    await expect(
      ReservationDetailPage({
        params: Promise.resolve({ noticeId: "7" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toBe(error);
  });
});
