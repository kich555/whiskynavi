import type { AdminBottleReservationNoticeResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NoticeInfoSection from "./NoticeInfoSection";

describe("NoticeInfoSection", () => {
  it("예약 공고 상태를 표시한다", () => {
    const notice = {
      id: 7,
      saleStatus: "CLOSED",
      bottleName: "종료 보틀",
      bottleBrand: "테스트 브랜드",
      price: 120000,
      reservationStartAt: "2026-06-08T10:00:00.000Z",
      reservationEndAt: "2026-06-09T10:00:00.000Z",
    } satisfies AdminBottleReservationNoticeResponse;

    render(<NoticeInfoSection notice={notice} />);

    expect(screen.getByText("상태")).toBeInTheDocument();
    expect(screen.getByText("종료")).toBeInTheDocument();
  });
});
