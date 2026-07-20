import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminBottleOrderDetailPage from "./page";

const mocks = vi.hoisted(() => ({
  getApiAdminOrdersOrderid: vi.fn(),
  getAuthToken: vi.fn(),
}));

vi.mock("@/apis/generated/api", () => ({
  getApiAdminOrdersOrderid: mocks.getApiAdminOrdersOrderid,
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token?: string) => ({ token })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: mocks.getAuthToken,
}));

vi.mock("../../orders/_components/AdminOrderDetailContent", () => ({
  default: ({ order }: { order: { orderNumber?: string } }) => <div>{order.orderNumber}</div>,
}));

describe("AdminBottleOrderDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthToken.mockResolvedValue("admin-token");
    mocks.getApiAdminOrdersOrderid.mockResolvedValue({
      data: {
        id: 42,
        orderNumber: "BOTTLE-ORDER-42",
        productType: "BOTTLE",
      },
    });
  });

  it("보틀 주문 ID로 상세 정보를 조회해 상세 화면을 표시한다", async () => {
    const page = await AdminBottleOrderDetailPage({ params: Promise.resolve({ orderId: "42" }) });

    render(page);

    expect(mocks.getApiAdminOrdersOrderid).toHaveBeenCalledWith(42, { token: "admin-token" });
    expect(screen.getByText("BOTTLE-ORDER-42")).toBeInTheDocument();
  });
});
