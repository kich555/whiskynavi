import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RelatedNoticeDetail from "./RelatedNoticeDetail";

describe("RelatedNoticeDetail", () => {
  it("관계 사유와 공고명을 표시하고 신청 기능은 노출하지 않는다", () => {
    render(
      <RelatedNoticeDetail
        appearance="dark"
        notice={{
          accessReason: "OWN_APPLICATION",
          readOnly: true,
          noticeName: "과거 커뮤니티 공고",
          bottleName: "테스트 보틀",
          price: 120000,
          description: "공고 상세 설명",
          gradeConditions: [{ requiredRole: "ROLE_USER" }],
        }}
      />,
    );

    expect(screen.getByText(/과거 신청 관계로 열람 중/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "과거 커뮤니티 공고" })).toBeInTheDocument();
    expect(screen.getByText("테스트 보틀")).toBeInTheDocument();
    expect(screen.getByText("일반 회원")).toBeInTheDocument();
    expect(screen.queryByText("ROLE_USER")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /신청|수정|취소/ })).not.toBeInTheDocument();
  });

  it("공고 설명의 HTML을 정제된 리치 텍스트로 표시한다", () => {
    const { container } = render(
      <RelatedNoticeDetail
        appearance="light"
        notice={{
          accessReason: "PICKUP_BUSINESS_ASSIGNMENT",
          readOnly: true,
          noticeName: "리치 텍스트 공고",
          description:
            '<p>공고 <strong>상세</strong> 설명</p><ul><li>신분증 지참</li></ul><script>alert("xss")</script>',
        }}
      />,
    );

    expect(screen.getByText("상세").tagName).toBe("STRONG");
    expect(screen.getByText("신분증 지참").closest("li")).toBeInTheDocument();
    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(screen.queryByText(/<p>|<strong>|<ul>/)).not.toBeInTheDocument();
  });
});
