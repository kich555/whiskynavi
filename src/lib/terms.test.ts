import { describe, expect, it } from "vitest";
import { TERMS_CONTACT_EMAIL, TERMS_CONTACT_PHONE, TERMS_REPRESENTATIVE, TERMS_TEXT } from "./terms";

describe("이용약관", () => {
  it("유형상품 판매정책을 별도 조항으로 명시한다", () => {
    expect(TERMS_TEXT).toContain("제7조 (판매정책)");
    expect(TERMS_TEXT).toContain("유형상품만 판매합니다");
    expect(TERMS_TEXT).toContain("상품명, 상품 이미지, 상세 설명, 판매 가격");
    expect(TERMS_TEXT).toContain("배송 방법, 배송 지역, 배송비, 예상 배송기간");
  });

  it("유형상품 환불 접수용 대표자 연락처를 안내한다", () => {
    expect(TERMS_TEXT).toContain(`대표자 연락처(${TERMS_REPRESENTATIVE}, ${TERMS_CONTACT_PHONE})`);
    expect(TERMS_TEXT).toContain(`문의 이메일(${TERMS_CONTACT_EMAIL})`);
  });

  it("취급하지 않는 무형상품 규정을 포함하지 않는다", () => {
    expect(TERMS_TEXT).not.toContain("무형재화");
    expect(TERMS_TEXT).not.toContain("디지털 콘텐츠");
  });
});
