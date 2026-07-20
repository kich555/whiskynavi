import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RepresentativeImageCarousel from "./RepresentativeImageCarousel";

describe("RepresentativeImageCarousel", () => {
  it("대표 이미지와 추가 이미지를 중복 없이 하나의 슬라이드로 렌더링한다", () => {
    render(
      <RepresentativeImageCarousel
        images={["https://example.com/main.jpg", "https://example.com/extra.jpg", "https://example.com/main.jpg"]}
        alt="테스트 보틀"
      />,
    );

    expect(screen.getByRole("region", { name: "테스트 보틀 이미지" })).toBeInTheDocument();
    expect(screen.getAllByRole("group")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "이전 이미지" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음 이미지" })).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("인디케이터로 원하는 이미지로 이동한다", () => {
    render(
      <RepresentativeImageCarousel
        images={["https://example.com/main.jpg", "https://example.com/extra.jpg"]}
        alt="테스트 보틀"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "2번째 이미지 보기" }));

    expect(screen.getByRole("button", { name: "2번째 이미지 보기" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });
});
