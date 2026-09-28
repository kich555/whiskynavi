import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GeneralItemSalesPolicy from "./GeneralItemSalesPolicy";

describe("GeneralItemSalesPolicy", () => {
  it("일반상품 배송 및 환불 정책을 표시한다", () => {
    render(<GeneralItemSalesPolicy shippingPolicy={{ baseShippingFee: 4500, freeShippingThreshold: 75000 }} />);

    expect(screen.getByRole("heading", { name: "판매정책" })).toBeInTheDocument();
    expect(screen.getByText("CJ대한통운")).toBeInTheDocument();
    expect(screen.getByText("4,500원")).toBeInTheDocument();
    expect(screen.getByText("75,000원 이상 주문 시")).toBeInTheDocument();
    expect(screen.getByText(/제주·도서산간도 동일한 배송비/)).toBeInTheDocument();
    expect(screen.getByText(/결제 완료 후 통상 2~5영업일/)).toBeInTheDocument();
    expect(screen.getByText(/대표자 연락처\(천관호, 010-6848-6231\)/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "전체 이용약관 및 판매정책 보기" })).toHaveAttribute("href", "/terms");
  });
});
