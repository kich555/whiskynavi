import type { AdminUserOrderSummaryResponse, AdminUserResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminUserDetailSection from "./AdminUserDetailSection";

const mocks = vi.hoisted(() => ({
  overlayOpen: vi.fn(),
  pagination: vi.fn(() => null),
  selectedRole: "ROLE_BUSINESS",
}));

vi.mock("../_components/Pagination", () => ({
  default: mocks.pagination,
}));

vi.mock("overlay-kit", () => ({
  overlay: { open: mocks.overlayOpen },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props}>{children}</label>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
  }) => (
    <div data-value={value}>
      {children}
      <button type="button" onClick={() => onValueChange?.(mocks.selectedRole)}>
        권한 선택
      </button>
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode; value: string }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

vi.mock("@/components/ui/switch", () => ({
  Switch: () => <button type="button">상태 스위치</button>,
}));

vi.mock("@/icons", () => ({
  IconGoogle: () => null,
  IconKakao: () => null,
  IconNaver: () => null,
}));

vi.mock("./modals/AdminConfirmModal", () => ({
  default: ({ onConfirm }: { onConfirm: () => void }) => (
    <button type="button" onClick={onConfirm}>
      관리자 권한 확인
    </button>
  ),
}));

const baseUser = {
  id: 12,
  username: "hong",
  email: "hong@example.com",
  phone: "010-0000-0000",
  name: "홍길동",
  status: "ACTIVE",
  createdAt: "2026-05-01T00:00:00.000Z",
  roles: ["ROLE_COMMUNITY_BUSINESS"],
} satisfies AdminUserResponse;

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
    mocks.selectedRole = "ROLE_BUSINESS";
  });

  it("adds parent business role without replacing existing child business role", async () => {
    const user = userEvent.setup();
    const onAddRole = vi.fn();

    render(<AdminUserDetailSection isEditMode userDetails={baseUser} onAddRole={onAddRole} onRemoveRole={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "권한 수정" }));
    await user.click(screen.getByRole("button", { name: "권한 선택" }));
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(mocks.overlayOpen).not.toHaveBeenCalled();
    expect(onAddRole).toHaveBeenCalledWith("ROLE_BUSINESS");
  });

  it("does not remove existing admin role before adding another admin role", async () => {
    const user = userEvent.setup();
    const onAddRole = vi.fn();
    mocks.selectedRole = "ROLE_SUPER_ADMIN";

    render(
      <AdminUserDetailSection
        isEditMode
        userDetails={{
          ...baseUser,
          roles: ["ROLE_ADMIN"],
        }}
        onAddRole={onAddRole}
        onRemoveRole={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "권한 수정" }));
    await user.click(screen.getByRole("button", { name: "권한 선택" }));
    await user.click(screen.getByRole("button", { name: "추가" }));

    const overlayRenderer = mocks.overlayOpen.mock.calls[0][0];
    render(overlayRenderer({ isOpen: true, close: vi.fn() }));
    await user.click(screen.getByRole("button", { name: "관리자 권한 확인" }));

    expect(onAddRole).toHaveBeenCalledWith("ROLE_SUPER_ADMIN");
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

    expect(mocks.pagination).toHaveBeenCalledWith(
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
    expect(mocks.pagination).toHaveBeenCalled();
  });
});
