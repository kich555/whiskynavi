import { describe, expect, it } from "vitest";
import {
  formatGenderLabel,
  getNiceChannelName,
  maskPhoneNumber,
  toIsoBirthDate,
  toSignupGender,
} from "./nice";

describe("toIsoBirthDate", () => {
  it("8자리 숫자를 YYYY-MM-DD로 변환한다", () => {
    expect(toIsoBirthDate("19900101")).toBe("1990-01-01");
    expect(toIsoBirthDate("20261231")).toBe("2026-12-31");
  });

  it("8자리가 아니면 빈 문자열을 반환한다", () => {
    expect(toIsoBirthDate("1990011")).toBe("");
    expect(toIsoBirthDate("199001011")).toBe("");
    expect(toIsoBirthDate("")).toBe("");
    expect(toIsoBirthDate("abcdefgh")).toBe("");
  });
});

describe("toSignupGender", () => {
  it("'1'은 M(남성)으로 변환한다", () => {
    expect(toSignupGender("1")).toBe("M");
  });

  it("'0'은 F(여성)으로 변환한다", () => {
    expect(toSignupGender("0")).toBe("F");
  });

  it("그 외 값은 N(미정)을 반환한다", () => {
    expect(toSignupGender("2")).toBe("N");
    expect(toSignupGender("")).toBe("N");
    expect(toSignupGender("male")).toBe("N");
  });
});

describe("maskPhoneNumber", () => {
  it("11자리 숫자를 3-4-4 하이픈 포함 형식으로 포맷한다", () => {
    expect(maskPhoneNumber("01012345678")).toBe("010-1234-5678");
  });

  it("10자리 숫자를 3-3-4 형식으로 포맷한다", () => {
    expect(maskPhoneNumber("0101234567")).toBe("010-123-4567");
  });

  it("숫자 외 문자를 무시하고 자릿수를 센다", () => {
    expect(maskPhoneNumber("010-1234-5678")).toBe("010-1234-5678");
    expect(maskPhoneNumber("010 1234 5678")).toBe("010-1234-5678");
  });

  it("10/11자리가 아니면 원문을 그대로 반환한다", () => {
    expect(maskPhoneNumber("0101234")).toBe("0101234");
    expect(maskPhoneNumber("")).toBe("");
    expect(maskPhoneNumber("010123456789")).toBe("010123456789");
  });
});

describe("formatGenderLabel", () => {
  it("M은 '남성', F는 '여성', N은 '미정'을 반환한다", () => {
    expect(formatGenderLabel("M")).toBe("남성");
    expect(formatGenderLabel("F")).toBe("여성");
    expect(formatGenderLabel("N")).toBe("미정");
  });
});

describe("getNiceChannelName", () => {
  it("세션 ID를 붙인 채널 이름을 반환한다", () => {
    expect(getNiceChannelName("abc123")).toBe("nice-verification-abc123");
    expect(getNiceChannelName("")).toBe("nice-verification-");
  });
});
