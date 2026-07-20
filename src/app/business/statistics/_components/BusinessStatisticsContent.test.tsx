import type { PagedModelUserBottleReservationPickupNoticeStageStatisticsResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BusinessStatisticsContent from "./BusinessStatisticsContent";

const statistics: PagedModelUserBottleReservationPickupNoticeStageStatisticsResponse = {
  content: [
    {
      noticeId: 10,
      noticeName: "7월 커뮤니티 공고",
      bottleName: "나비 1st",
      approvedQuantity: 10,
      paymentCompletedQuantity: 8,
      waitingPickupQuantity: 6,
      receivedQuantity: 4,
    },
  ],
  page: {
    number: 0,
    size: 5,
    totalElements: 6,
    totalPages: 2,
  },
};

describe("BusinessStatisticsContent", () => {
  it("공고별 단계 수량과 페이지네이션을 표시한다", () => {
    render(<BusinessStatisticsContent statistics={statistics} />);

    expect(screen.getByText("공고별 예약 통계")).toBeInTheDocument();
    expect(screen.getByText("7월 커뮤니티 공고")).toBeInTheDocument();
    expect(screen.getByText("나비 1st")).toBeInTheDocument();
    expect(screen.getByText("공고 #10")).toBeInTheDocument();
    expect(screen.getByText("10병")).toBeInTheDocument();
    expect(screen.getByText("4병")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("총 6개 공고")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "다음" })).toHaveAttribute("href", "/business/statistics?page=2");
    expect(screen.getByRole("link", { name: "공고 내용" })).toHaveAttribute(
      "href",
      "/business/pickup-reservations/notices/10/detail",
    );
  });

  it("선택한 사업장 ID를 페이지네이션과 공고 내용 링크에 유지한다", () => {
    render(<BusinessStatisticsContent statistics={statistics} selectedBusinessId={12} />);

    expect(screen.getByRole("link", { name: "다음" })).toHaveAttribute(
      "href",
      "/business/statistics?businessId=12&page=2",
    );
    expect(screen.getByRole("link", { name: "공고 내용" })).toHaveAttribute(
      "href",
      "/business/pickup-reservations/notices/10/detail?businessId=12",
    );
    expect(screen.getByRole("link", { name: "신청 관리" })).toHaveAttribute(
      "href",
      "/business/pickup-reservations/notices/10?businessId=12",
    );
  });

  it("공고가 없으면 빈 상태를 표시한다", () => {
    render(
      <BusinessStatisticsContent
        statistics={{
          content: [],
          page: { number: 0, size: 5, totalElements: 0, totalPages: 0 },
        }}
      />,
    );

    expect(screen.getByText("표시할 공고별 예약 통계가 없습니다.")).toBeInTheDocument();
  });
});
