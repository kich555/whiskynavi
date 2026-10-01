import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { updateGeneralItemSale } from "../../actions";
import GeneralItemSaleDetailContent from "./GeneralItemSaleDetailContent";

vi.mock("../../actions", () => ({ updateGeneralItemSale: vi.fn() }));
vi.mock("../../../_components/AdminHeader", () => ({ default: () => <h1>판매공고 상세 관리</h1> }));
vi.mock("../../../_components/AdminLayoutClient", () => ({ useSidebar: () => ({ toggle: vi.fn() }) }));
const sale = {
  id: 3,
  productId: 2,
  title: "판매 공고",
  itemName: "상품",
  saleStatus: "OPEN" as const,
  salePrice: 5000,
  totalQuantity: 10,
  availableQuantity: 5,
};
beforeEach(() => vi.clearAllMocks());

it("상세에서 목록·고객 화면·원본 상품으로 이동할 수 있다", () => {
  render(<GeneralItemSaleDetailContent saleId={3} sale={sale} />);
  expect(screen.getByRole("link", { name: "판매공고 목록으로 돌아가기" })).toHaveAttribute(
    "href",
    "/admin/general-item-sales",
  );
  expect(screen.getByRole("link", { name: "상품 화면 보기" })).toHaveAttribute("href", "/general-items/3");
  expect(screen.getByRole("link", { name: "원본 상품 관리" })).toHaveAttribute("href", "/admin/general-items/2");
  expect(screen.queryByLabelText("판매 가능 수량")).not.toBeInTheDocument();
});

it("오류가 발생하면 입력값과 재고 조정 상태를 유지한다", async () => {
  const user = userEvent.setup();
  vi.mocked(updateGeneralItemSale).mockResolvedValue({ success: false, error: "재고가 변경되었습니다." });
  render(<GeneralItemSaleDetailContent saleId={3} sale={sale} />);
  await user.clear(screen.getByLabelText("공고 제목"));
  await user.type(screen.getByLabelText("공고 제목"), "변경 제목");
  await user.click(screen.getByLabelText("재고 수량 조정"));
  await user.type(screen.getByLabelText("재고 조정 사유"), "입고");
  // happy-dom의 소수 step 검증을 제외하고 서버 액션 결과에 따른 폼 상태를 검증한다.
  fireEvent.submit(screen.getByRole("button", { name: "변경사항 저장" }).closest("form")!);
  expect(await screen.findByRole("alert")).toHaveTextContent("재고가 변경되었습니다.");
  expect(screen.getByLabelText("공고 제목")).toHaveValue("변경 제목");
  expect(screen.getByLabelText("재고 수량 조정")).toBeChecked();
  expect(screen.getByLabelText("재고 조정 사유")).toHaveValue("입고");
});

it("저장 후 서버 응답으로 재고 기준값과 상태를 갱신한다", async () => {
  const user = userEvent.setup();
  vi.mocked(updateGeneralItemSale).mockResolvedValue({
    success: true,
    data: { ...sale, availableQuantity: 4, saleStatus: "CLOSED" },
  });
  render(<GeneralItemSaleDetailContent saleId={3} sale={sale} />);
  // happy-dom의 소수 step 검증을 제외하고 서버 액션 결과에 따른 폼 상태를 검증한다.
  fireEvent.submit(screen.getByRole("button", { name: "변경사항 저장" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("판매공고가 수정되었습니다."));
  expect(screen.getByLabelText("판매 상태")).toHaveValue("CLOSED");
  await user.click(screen.getByLabelText("재고 수량 조정"));
  expect(screen.getByLabelText("판매 가능 수량")).toHaveValue(4);
});
