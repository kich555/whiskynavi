import type { AdminOrderResponse as OrderResponse } from "@/apis/generated/api";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminOrdersContent from "./AdminOrdersContent";

const push = vi.fn();
const refresh = vi.fn();
const toggle = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/app/admin/_components/AdminLayoutClient", () => ({
  useSidebar: () => ({ toggle }),
}));

vi.mock("../actions", () => ({
  completeAdminOrderDelivery: vi.fn(),
  exportAdminDeliveryCsv: vi.fn(),
  shipAdminOrderDelivery: vi.fn(),
  updateAdminOrderDelivery: vi.fn(),
  updateAdminOrderStatus: vi.fn(),
  uploadAdminDeliveryCsv: vi.fn(),
}));

describe("AdminOrdersContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders cart order summary with item count, quantity, and shipping price breakdown", () => {
    render(
      <AdminOrdersContent
        searchParams={{}}
        totalElements={1}
        orders={[
          {
            id: 1,
            orderNumber: "ODR-CART-1",
            createdAt: "2026-05-24T10:00:00+09:00",
            customer: { name: "김관리", phone: "01012345678", guest: false },
            delivery: { carrierName: "CJ대한통운", address: "서울시 강남구" },
            orderSource: "CART",
            orderStatus: "PAYMENT_PENDING",
            itemsSummary: "시음권 세트 외 2건",
            itemsCount: 3,
            totalQuantity: 4,
            items: [
              { orderItemId: 10, itemName: "시음권 세트", quantity: 1, unitPrice: 1000, lineTotalPrice: 1000 },
              { orderItemId: 11, itemName: "테이스팅 글라스", quantity: 3, unitPrice: 2000, lineTotalPrice: 6000 },
            ],
            priceSummary: {
              itemsTotalPrice: 7000,
              shippingFee: 3000,
              totalPrice: 10000,
              freeShippingApplied: false,
            },
            payment: { paymentMethod: "TOSS", paymentStatus: "DONE" },
            availableAdminActions: [],
          } satisfies OrderResponse,
        ]}
      />,
    );

    expect(screen.getByText("장바구니")).toBeInTheDocument();
    expect(screen.getByText("시음권 세트 외 2건")).toBeInTheDocument();
    expect(screen.getByText("총 수량 4개")).toBeInTheDocument();
    expect(screen.getByText("시음권 세트 · 1개 · 1,000원")).toBeInTheDocument();
    expect(screen.getByText("테이스팅 글라스 · 3개 · 6,000원")).toBeInTheDocument();
    expect(screen.getByText("상품 7,000원")).toBeInTheDocument();
    expect(screen.getByText("배송비 3,000원")).toBeInTheDocument();
    expect(screen.getByText("총 10,000원")).toBeInTheDocument();
  });

  it("상세 버튼을 누르면 주문 상세 페이지로 이동한다", async () => {
    const user = userEvent.setup();

    render(
      <AdminOrdersContent
        searchParams={{}}
        totalElements={1}
        basePath="/admin/general-item-orders"
        orders={[
          {
            id: 123,
            orderNumber: "ODR-DETAIL-1",
            itemName: "단건 상품",
            requestedQuantity: 1,
            totalPrice: 5000,
            customer: { name: "김관리", guest: false },
            availableAdminActions: [],
          } satisfies OrderResponse,
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "상세" }));

    expect(push).toHaveBeenCalledWith("/admin/general-item-orders/123");
  });

  it("관리자 수동 구매내역 주문 출처를 표시한다", () => {
    render(
      <AdminOrdersContent
        searchParams={{}}
        totalElements={1}
        orders={[
          {
            id: 2,
            orderNumber: "ODR-MANUAL-1",
            orderSource: "ADMIN_MANUAL",
            itemName: "테스트 보틀",
            requestedQuantity: 1,
            totalPrice: 120000,
            customer: { name: "김관리", guest: false },
            availableAdminActions: [],
          } satisfies OrderResponse,
        ]}
      />,
    );

    expect(screen.getByText("관리자 수동")).toBeInTheDocument();
  });

  it("보틀 주문에서 물품 종류, 배송 방식, 배송 시기를 표시한다", () => {
    render(
      <AdminOrdersContent
        searchParams={{ productType: "BOTTLE" }}
        totalElements={1}
        enableGeneralItemActions={false}
        orders={[
          {
            id: 3,
            orderNumber: "ODR-BOTTLE-1",
            itemName: "테스트 보틀",
            requestedQuantity: 1,
            totalPrice: 120000,
            productType: "BOTTLE",
            fulfillmentMethod: "PICKUP",
            saleTiming: "RESERVATION",
            customer: { name: "김관리", guest: false },
            availableAdminActions: [],
          } satisfies OrderResponse,
        ]}
      />,
    );

    const orderRow = screen.getByText("ODR-BOTTLE-1").closest("tr");
    expect(orderRow).not.toBeNull();

    const row = within(orderRow!);
    expect(row.getByText("보틀")).toBeInTheDocument();
    expect(row.getByText("픽업")).toBeInTheDocument();
    expect(row.getByText("예약판매")).toBeInTheDocument();
  });
});
