import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BusinessNotFound from "./not-found";

describe("BusinessNotFound", () => {
  it("비즈니스 정보가 보이지 않는 원인과 복구 경로를 안내한다", () => {
    render(<BusinessNotFound />);

    expect(screen.getByRole("heading", { name: "요청한 비즈니스 정보를 확인할 수 없습니다" })).toBeInTheDocument();
    expect(screen.getByText("목록에서 신청 또는 공고를 다시 선택했는지")).toBeInTheDocument();
    expect(screen.getByText("사이드바에서 올바른 사업장을 선택했는지")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "예약 신청 목록으로" })).toHaveAttribute(
      "href",
      "/business/pickup-reservations/applications",
    );
    expect(screen.getByRole("link", { name: "비즈니스 홈으로" })).toHaveAttribute("href", "/business/statistics");
  });
});
