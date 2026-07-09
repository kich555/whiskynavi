import type { AdminUserOrderSummaryResponse, AdminUserResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminUserDetailSection from "./AdminUserDetailSection";

const paginationMock = vi.hoisted(() => vi.fn(() => null));

vi.mock("../_components/Pagination", () => ({
  default: paginationMock,
}));

vi.mock("@/icons", () => ({
  IconGoogle: () => null,
  IconKakao: () => null,
  IconNaver: () => null,
}));

vi.mock("overlay-kit", () => ({
  overlay: { open: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

const userDetails = {
  id: 42,
  name: "홍길동",
  username: "hong",
  email: "hong@example.com",
  phone: "01012345678",
  status: "ACTIVE",
  roles: ["ROLE_USER"],
  createdAt: "2026-01-01T00:00:00",
} satisfies AdminUserResponse;

const orderSummary = {
  totalAmount: 120000,
  orders: {
    content: [
      {
        id: 1,
        itemName: "테스트 위스키",
        orderNumber: "ORDER-1",
        requestedQuantity: 1,
        approvedQuantity: 1,
        totalPrice: 120000,
        createdAt: "2026-01-02T00:00:00",
        orderStatus: "PAYMENT_COMPLETED",
      },
    ],
    page: {
      number: 1,
      size: 20,
      totalElements: 21,
      totalPages: 2,
    },
  },
} satisfies AdminUserOrderSummaryResponse;

describe("AdminUserDetailSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("예약 내역이 여러 페이지일 때 Pagination을 표시한다", async () => {
    const user = userEvent.setup();

    render(
      <AdminUserDetailSection
        {...({
          isEditMode: false,
          userDetails,
          orderSummary,
          currentOrderPage: 2,
          orderItemsPerPage: 20,
          searchParams: { page: "2", limit: "20" },
        } as React.ComponentProps<typeof AdminUserDetailSection> & {
          currentOrderPage: number;
          orderItemsPerPage: number;
          searchParams: Record<string, string>;
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /예약 내역/ }));

    expect(paginationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        totalItems: 21,
        itemsPerPage: 20,
        currentPage: 2,
        searchParams: {
          page: "2",
          limit: "20",
          tab: "reservations",
        },
        basePath: "/admin/users/42",
      }),
      undefined,
    );
  });

  it("초기 탭이 reservations이면 예약 내역을 바로 표시한다", () => {
    render(
      <AdminUserDetailSection
        {...({
          isEditMode: false,
          userDetails,
          orderSummary,
          initialActiveTab: "reservations",
          currentOrderPage: 1,
          orderItemsPerPage: 20,
          searchParams: { tab: "reservations" },
        } as React.ComponentProps<typeof AdminUserDetailSection> & {
          initialActiveTab: "reservations";
          currentOrderPage: number;
          orderItemsPerPage: number;
          searchParams: Record<string, string>;
        })}
      />,
    );

    expect(screen.getByText("테스트 위스키")).toBeInTheDocument();
    expect(paginationMock).toHaveBeenCalled();
  });
});
