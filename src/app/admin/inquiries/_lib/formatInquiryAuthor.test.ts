import { describe, expect, it } from "vitest";
import { formatInquiryAuthor } from "./formatInquiryAuthor";

describe("formatInquiryAuthor", () => {
  it("이름과 닉네임을 이름(닉네임) 형식으로 표시한다", () => {
    expect(
      formatInquiryAuthor({
        authorId: 1,
        authorName: "홍길동",
        authorNickname: "위스키러버",
        authorType: "USER",
      }),
    ).toBe("홍길동(위스키러버)");
  });

  it("이름이 없으면 기존 닉네임을 표시한다", () => {
    expect(
      formatInquiryAuthor({
        authorId: 1,
        authorNickname: "위스키러버",
        authorType: "USER",
      }),
    ).toBe("위스키러버");
  });

  it("사용자 정보가 없으면 작성자 유형과 ID를 표시한다", () => {
    expect(
      formatInquiryAuthor({
        authorId: 1,
        authorType: "USER",
      }),
    ).toBe("사용자 #1");
  });
});
