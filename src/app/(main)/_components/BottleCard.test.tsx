import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BottleCard from "./BottleCard";

describe("BottleCard", () => {
  it("가격이 포함된 사업자 응답이면 공급가와 권장소매가를 표시한다", () => {
    render(
      <BottleCard
        bottle={{
          id: 10,
          name: "테스트 보틀",
          supplyPrice: 100000,
          consumerPrice: 120000,
        }}
      />,
    );

    expect(screen.getByText("공급가")).toBeInTheDocument();
    expect(screen.getByText("100,000원")).toBeInTheDocument();
    expect(screen.getByText("권장소매가")).toBeInTheDocument();
    expect(screen.getByText("120,000원")).toBeInTheDocument();
  });

  it("가격이 없는 공개 응답이면 가격 영역을 표시하지 않는다", () => {
    render(<BottleCard bottle={{ id: 10, name: "테스트 보틀" }} />);

    expect(screen.queryByText("공급가")).not.toBeInTheDocument();
    expect(screen.queryByText("권장소매가")).not.toBeInTheDocument();
  });
});
