import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderHistoryFilters } from "../_lib/order-history";
import OrdersTab from "./OrdersTab";

const { pushMock, refreshMock, searchParamsState } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  searchParamsState: { value: "tab=orders" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  useSearchParams: () => new URLSearchParams(searchParamsState.value),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useIsDesktop: () => false,
}));

vi.mock("overlay-kit", () => ({
  overlay: { open: vi.fn() },
}));

const defaultFilters: OrderHistoryFilters = {
  manualOnly: false,
  sort: "CREATED_AT",
  page: 1,
};

function renderOrdersTab(filters: OrderHistoryFilters = defaultFilters, hasError = false) {
  render(
    <OrdersTab
      orders={{ content: [], page: { number: filters.page - 1, totalPages: 0 } }}
      hasError={hasError}
      filters={filters}
    />,
  );
}

describe("OrdersTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsState.value = "tab=orders";
  });

  it("수동입력 내역조회를 선택하면 상태와 페이지를 해제하고 정렬을 유지한다", () => {
    searchParamsState.value = "tab=orders&orderStatus=SHIPPING&sort=BOTTLED_DATE&page=3";
    renderOrdersTab({
      orderStatus: "SHIPPING",
      manualOnly: false,
      sort: "BOTTLED_DATE",
      page: 3,
    });

    const manualOnlySwitch = screen.getByRole("switch", { name: "수동입력 내역조회" });
    expect(manualOnlySwitch).toHaveAttribute("data-size", "sm");
    expect(
      manualOnlySwitch.compareDocumentPosition(screen.getByLabelText("주문 상태")) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    fireEvent.click(manualOnlySwitch);

    const url = new URL(pushMock.mock.calls[0][0], "https://whiskynavi.test");
    expect(url.searchParams.get("manualOnly")).toBe("true");
    expect(url.searchParams.has("orderStatus")).toBe(false);
    expect(url.searchParams.get("sort")).toBe("BOTTLED_DATE");
    expect(url.searchParams.has("page")).toBe(false);
  });

  it("상태를 선택하면 수동입력 내역조회를 해제한다", () => {
    searchParamsState.value = "tab=orders&manualOnly=true&sort=CREATED_AT";
    renderOrdersTab({ manualOnly: true, sort: "CREATED_AT", page: 1 });

    fireEvent.change(screen.getByLabelText("주문 상태"), { target: { value: "RECEIPT_PENDING" } });

    const url = new URL(pushMock.mock.calls[0][0], "https://whiskynavi.test");
    expect(url.searchParams.get("orderStatus")).toBe("RECEIPT_PENDING");
    expect(url.searchParams.has("manualOnly")).toBe(false);
  });

  it("정렬을 변경하면 상태를 유지하고 첫 페이지로 이동한다", () => {
    searchParamsState.value = "tab=orders&orderStatus=SHIPPING&sort=CREATED_AT&page=4";
    renderOrdersTab({
      orderStatus: "SHIPPING",
      manualOnly: false,
      sort: "CREATED_AT",
      page: 4,
    });

    fireEvent.change(screen.getByLabelText("정렬"), { target: { value: "BOTTLED_DATE" } });

    const url = new URL(pushMock.mock.calls[0][0], "https://whiskynavi.test");
    expect(url.searchParams.get("orderStatus")).toBe("SHIPPING");
    expect(url.searchParams.get("sort")).toBe("BOTTLED_DATE");
    expect(url.searchParams.has("page")).toBe(false);
  });

  it("모바일에서 주문 카드를 누르면 동적 상세 경로로 이동한다", () => {
    render(
      <OrdersTab
        orders={{
          content: [
            {
              id: 42,
              orderNumber: "ODR-MOBILE-42",
              itemName: "모바일 주문",
              totalPrice: 10000,
            },
          ],
          page: { number: 0, totalPages: 1 },
        }}
        hasError={false}
        filters={defaultFilters}
      />,
    );

    fireEvent.click(screen.getByText("상세보기"));

    expect(pushMock).toHaveBeenCalledWith("/my-page/order/42");
  });

  it("API 오류 시 재시도 동작을 제공한다", () => {
    renderOrdersTab(defaultFilters, true);

    expect(screen.getByText("주문 내역을 불러오지 못했습니다.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(refreshMock).toHaveBeenCalledOnce();
  });
});
