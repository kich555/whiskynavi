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
});
