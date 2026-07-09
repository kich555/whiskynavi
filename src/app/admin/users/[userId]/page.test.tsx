import { getApiAdminOrdersUsersUserid, getApiAdminUsersId } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserDetailPage from "./page";

const userDetailContentMock = vi.hoisted(() => vi.fn(() => null));

vi.mock("@/apis/generated/api", () => ({
  getApiAdminOrdersUsersUserid: vi.fn(),
  getApiAdminUsersId: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token: string | null) => ({ token })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("./_components/UserDetailContent", () => ({
  default: userDetailContentMock,
}));

describe("UserDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthToken).mockResolvedValue("admin-token");
    vi.mocked(getApiAdminUsersId).mockResolvedValue({
      data: { id: 42, name: "홍길동" },
    } as Awaited<ReturnType<typeof getApiAdminUsersId>>);
    vi.mocked(getApiAdminOrdersUsersUserid).mockResolvedValue({
      data: {
        orders: {
          content: [],
          page: { number: 2, size: 50, totalElements: 120, totalPages: 3 },
        },
        totalAmount: 0,
      },
    } as Awaited<ReturnType<typeof getApiAdminOrdersUsersUserid>>);
  });

  it("URL 페이지와 페이지 크기로 사용자 주문 요약을 조회한다", async () => {
    const result = await UserDetailPage({
      params: Promise.resolve({ userId: "42" }),
      searchParams: Promise.resolve({
        page: "3",
        limit: "50",
        tab: "reservations",
      }),
    });

    expect(getApiAdminOrdersUsersUserid).toHaveBeenCalledWith(42, { page: 2, size: 50 }, { token: "admin-token" });
    expect(result.props).toEqual(
      expect.objectContaining({
        currentOrderPage: 3,
        initialActiveTab: "reservations",
        orderItemsPerPage: 50,
        searchParams: {
          page: "3",
          limit: "50",
          tab: "reservations",
        },
      }),
    );
  });
});
