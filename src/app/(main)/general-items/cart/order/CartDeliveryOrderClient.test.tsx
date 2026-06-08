import type { UserDeliveryAddressResponse } from "@/apis/generated/api";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGeneralItemCartTossTicket } from "./actions";
import CartDeliveryOrderClient from "./CartDeliveryOrderClient";

const back = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back }),
}));

vi.mock("./actions", () => ({
  createGeneralItemCartTossTicket: vi.fn(),
}));

vi.mock("../../delivery-order/actions", () => ({
  createDeliveryAddress: vi.fn(),
}));

type MockPostcodeData = {
  zonecode: string;
  address: string;
};

type MockPostcodeWindow = Window &
  typeof globalThis & {
    daum?: {
      Postcode: new (options: { oncomplete: (data: MockPostcodeData) => void }) => {
        open: () => void;
      };
    };
  };

const baseQuote = {
  items: [{ cartItemId: 1, itemName: "테스트 상품", quantity: 1, lineTotalPrice: 20000, valid: true }],
  itemsTotalPrice: 20000,
  shippingFee: 3000,
  totalPrice: 23000,
};

const mockedCreateGeneralItemCartTossTicket = vi.mocked(createGeneralItemCartTossTicket);

function mockKakaoPostcode(data: MockPostcodeData) {
  const open = vi.fn();
  const Postcode = vi.fn(function (this: unknown, options: { oncomplete: (data: MockPostcodeData) => void }) {
    return {
      open: () => {
        open();
        options.oncomplete(data);
      },
    };
  });

  (window as MockPostcodeWindow).daum = {
    Postcode,
  };

  return open;
}

describe("CartDeliveryOrderClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (window as MockPostcodeWindow).daum;
  });

  it("renders cart delivery order title, total price, and available payment buttons", () => {
    render(<CartDeliveryOrderClient quote={baseQuote} />);

    expect(screen.getByText("장바구니 배송 주문서")).toBeInTheDocument();
    expect(screen.getAllByText("20,000원").length).toBeGreaterThan(0);
    expect(screen.getByText("3,000원")).toBeInTheDocument();
    expect(screen.getByText("23,000원")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "토스 결제" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "결제" })).toBeInTheDocument();
  });

  it("hides same-as-orderer control for guest checkout", () => {
    render(<CartDeliveryOrderClient quote={baseQuote} />);

    expect(screen.queryByLabelText("주문자와 같음")).not.toBeInTheDocument();
    expect(screen.queryByText("로그인 후 사용할 수 있습니다.")).not.toBeInTheDocument();
  });

  it("shows same-as-orderer control for signed-in users", () => {
    render(
      <CartDeliveryOrderClient
        quote={baseQuote}
        currentUser={{ id: 1, email: "user@example.com", name: "홍길동", phone: "010-1234-5678" }}
      />,
    );

    expect(screen.getByLabelText("주문자와 같음")).toBeInTheDocument();
  });

  it("shows an empty-cart prompt instead of payment controls when no cart items are available", () => {
    render(
      <CartDeliveryOrderClient
        quote={{
          items: [],
          itemsTotalPrice: 0,
          shippingFee: 0,
          totalPrice: 0,
        }}
      />,
    );

    expect(screen.getByText("장바구니에 담긴 상품이 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "장바구니로 이동" })).toHaveAttribute("href", "/general-items/cart");
    expect(screen.queryByRole("button", { name: "결제" })).not.toBeInTheDocument();
  });

  it("fills separated order address fields from Kakao postcode search", async () => {
    const user = userEvent.setup();
    const open = mockKakaoPostcode({
      zonecode: "04524",
      address: "서울 중구 세종대로 110",
    });

    render(<CartDeliveryOrderClient quote={baseQuote} />);

    await user.click(screen.getByRole("button", { name: "배송 주소 검색" }));

    expect(open).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("우편번호")).toHaveValue("04524");
    expect(screen.getByLabelText("우편번호")).toHaveAttribute("readonly");
    expect(screen.getByLabelText(/기본 주소/)).toHaveValue("서울 중구 세종대로 110");
    expect(screen.getByLabelText(/기본 주소/)).toHaveAttribute("readonly");
    expect(screen.getByLabelText("상세 주소")).toHaveFocus();
  });

  it("shows the order address input process in separate search and detail steps", () => {
    render(<CartDeliveryOrderClient quote={baseQuote} />);

    expect(screen.getByText("주소 검색")).toBeInTheDocument();
    expect(screen.getByText("상세 주소 입력")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "배송 주소 검색" })).toBeInTheDocument();
  });

  it("submits a composed delivery address from separated address fields", async () => {
    const user = userEvent.setup();
    mockKakaoPostcode({
      zonecode: "04524",
      address: "서울 중구 세종대로 110",
    });
    mockedCreateGeneralItemCartTossTicket.mockResolvedValue({
      success: false,
      error: "토스 결제 준비를 중단합니다.",
    });

    render(<CartDeliveryOrderClient quote={baseQuote} />);

    await user.type(screen.getAllByLabelText(/^수령인/)[0], "홍길동");
    await user.type(screen.getByLabelText(/^수령인 연락처/), "010-1234-5678");
    await user.type(screen.getByLabelText(/^주문 안내 이메일/), "guest@example.com");
    await user.click(screen.getByRole("button", { name: "배송 주소 검색" }));
    await user.type(screen.getByLabelText("상세 주소"), "101호");

    await user.click(screen.getByRole("button", { name: "결제" }));

    await waitFor(() => {
      expect(mockedCreateGeneralItemCartTossTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          deliveryAddress: "(04524) 서울 중구 세종대로 110 101호",
        }),
        expect.any(String),
      );
    });
  });

  it("fills the address book form postal code and base address from Kakao postcode search", async () => {
    const user = userEvent.setup();
    const open = mockKakaoPostcode({
      zonecode: "06017",
      address: "서울 강남구 압구정로 407",
    });

    render(
      <CartDeliveryOrderClient
        quote={baseQuote}
        currentUser={{ id: 1, email: "user@example.com", name: "홍길동", phone: "010-1234-5678" }}
        deliveryAddresses={[] as UserDeliveryAddressResponse[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "주소 추가" }));
    const dialog = screen.getByRole("dialog", { name: "배송지 추가" });

    await user.click(within(dialog).getByRole("button", { name: "우편번호 검색" }));

    expect(open).toHaveBeenCalledTimes(1);
    expect(within(dialog).getByLabelText("우편번호")).toHaveValue("06017");
    expect(within(dialog).getByLabelText("우편번호")).toHaveAttribute("readonly");
    expect(within(dialog).getByLabelText(/기본 주소/)).toHaveValue("서울 강남구 압구정로 407");
    expect(within(dialog).getByLabelText(/기본 주소/)).toHaveAttribute("readonly");
  });
});
