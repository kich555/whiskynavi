import type { UserBottleReservationPickupMonthlyStatisticsResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BusinessStatisticsContent from "./BusinessStatisticsContent";

const statistics: UserBottleReservationPickupMonthlyStatisticsResponse = {
  businessId: 99,
  businessName: "나비바",
  month: "2026-06",
  totalApplicationCount: 12,
  totalRequestedQuantity: 18,
  totalConfirmedQuantity: 10,
  totalSalesAmount: 1200000,
  receivedSalesAmount: 400000,
  statuses: [
    {
      status: "RECEIVED",
      applicationCount: 4,
      requestedQuantity: 4,
      confirmedQuantity: 4,
      salesAmount: 400000,
    },
  ],
  recentNotices: [
    {
      noticeId: 10,
      bottleName: "나비 1st",
      applicationCount: 5,
      requestedQuantity: 7,
      confirmedQuantity: 3,
      salesAmount: 300000,
    },
  ],
};

describe("BusinessStatisticsContent", () => {
  it("월간 KPI와 상태별/공고별 통계를 표시한다", () => {
    render(<BusinessStatisticsContent statistics={statistics} />);

    expect(screen.getByText("월간 예약 통계")).toBeInTheDocument();
    expect(screen.getByText("나비바")).toBeInTheDocument();
    expect(screen.getByText("2026년 06월")).toBeInTheDocument();
    expect(screen.getByText("12건")).toBeInTheDocument();
    expect(screen.getByText("18병")).toBeInTheDocument();
    expect(screen.getByText("10병")).toBeInTheDocument();
    expect(screen.getAllByText("400,000원")).toHaveLength(2);
    expect(screen.getByText("수령완료")).toBeInTheDocument();
    expect(screen.getByText("나비 1st")).toBeInTheDocument();
  });

  it("전월과 다음월 이동 링크를 제공한다", () => {
    render(<BusinessStatisticsContent statistics={statistics} />);

    expect(screen.getByRole("link", { name: "전월" })).toHaveAttribute(
      "href",
      "/business/statistics?month=2026-05",
    );
    expect(screen.getByRole("link", { name: "다음월" })).toHaveAttribute(
      "href",
      "/business/statistics?month=2026-07",
    );
  });

  it("응답 월이 없으면 잘못된 링크를 만들지 않고 명시적으로 실패한다", () => {
    expect(() => render(<BusinessStatisticsContent statistics={{ ...statistics, month: undefined }} />)).toThrow(
      "월간 통계 응답에 조회 월이 없습니다.",
    );
  });
});
