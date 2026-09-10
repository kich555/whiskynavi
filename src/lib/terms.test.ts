import { describe, expect, it } from "vitest";
import {
  TERMS_CHANGE_REASON,
  TERMS_CONTACT_EMAIL,
  TERMS_CONTACT_PHONE,
  TERMS_EFFECTIVE_DATE,
  TERMS_NOTICE_DATE,
  TERMS_REPRESENTATIVE,
  TERMS_TEXT,
} from "./terms";

describe("이용약관", () => {
  it("유형상품 판매정책을 별도 조항으로 명시한다", () => {
    expect(TERMS_TEXT).toContain("제7조 (판매정책)");
    expect(TERMS_TEXT).toContain("유형상품만 판매합니다");
    expect(TERMS_TEXT).toContain("상품명, 상품 이미지, 상세 설명, 판매 가격");
    expect(TERMS_TEXT).toContain("배송 방법, 배송 지역, 배송비, 예상 배송기간");
  });

  it("예약 기능과 회사의 온라인 결제를 명시적으로 분리한다", () => {
    expect(TERMS_TEXT).toContain("일반상품 등 유형상품의 구매대금 결제에 한하여 연동됩니다");
    expect(TERMS_TEXT).toContain("예약 기능에는 회사의 온라인 결제수단이 연동되어 있지 않으며");
    expect(TERMS_TEXT).toContain("실제 판매 및 결제는 해당 판매점에서 별도로 이루어집니다");
  });

  it("주류 스마트오더로 해석될 수 있는 수령 조항을 포함하지 않는다", () => {
    expect(TERMS_TEXT).not.toContain("주류 등 배송이 제한되는 상품");
    expect(TERMS_TEXT).not.toContain("지정된 장소에서 본인 확인 후 수령");
  });

  it("개정 공지일, 시행일과 변경 사유를 제공한다", () => {
    expect(TERMS_NOTICE_DATE).toBe("2026년 9월 10일");
    expect(TERMS_EFFECTIVE_DATE).toBe("2026년 9월 17일");
    expect(TERMS_CHANGE_REASON).toBe("예약 서비스와 온라인 결제 대상의 구분 명확화");
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
