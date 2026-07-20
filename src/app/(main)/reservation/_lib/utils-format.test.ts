import type { UserBottleReservationNoticePublicResponse } from "@/apis/generated/api";
import { describe, expect, it } from "vitest";
import { buildInfoItems, formatDateTime, formatReservationRole, getStatusBadge } from "./utils";

describe("formatReservationRole", () => {
  it("알려진 권한 코드는 한글 라벨로 변환한다", () => {
    expect(formatReservationRole("ROLE_GUEST")).toBe("게스트");
    expect(formatReservationRole("ROLE_USER")).toBe("일반 회원");
    expect(formatReservationRole("ROLE_ADMIN")).toBe("관리자");
    expect(formatReservationRole("ROLE_WHISKYNAVI_MEMBER")).toBe("위스키내비 멤버");
    expect(formatReservationRole("ROLE_BUSINESS")).toBe("업장 회원");
  });

  it("undefined는 '-'을 반환한다", () => {
    expect(formatReservationRole(undefined)).toBe("-");
  });

  it("알 수 없는 권한 코드는 원본 값을 fallback으로 반환한다 (화면 비지 않게)", () => {
    expect(formatReservationRole("ROLE_NEW_UNKNOWN")).toBe("ROLE_NEW_UNKNOWN");
  });
});

describe("formatDateTime", () => {
  it("빈 문자열/undefined는 '-'을 반환한다", () => {
    expect(formatDateTime(undefined)).toBe("-");
    expect(formatDateTime("")).toBe("-");
  });

  it("유효한 날짜 문자열은 포맷된 문자열을 반환한다 (빈 문자열 아님)", () => {
    const result = formatDateTime("2026-07-19T10:30:00+09:00");
    expect(result).not.toBe("-");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("getStatusBadge", () => {
  it("각 상태에 맞는 라벨과 className을 반환한다", () => {
    expect(getStatusBadge("closed")).toEqual({ label: "예약 종료됨", className: "bg-gray-600" });
    expect(getStatusBadge("pending")).toEqual({ label: "예약 대기 중", className: "bg-orange-600" });
    expect(getStatusBadge("active")).toEqual({ label: "예약 진행 중", className: "bg-blue-600" });
    expect(getStatusBadge("applied")).toEqual({ label: "예약신청완료", className: "bg-green-600" });
  });
});

describe("buildInfoItems", () => {
  const base: UserBottleReservationNoticePublicResponse = {
    bottleBrand: "Macallan",
    price: 120000,
    supplyPrice: 100000,
    availableQuantity: 5,
  };

  it("일반 회원에게 브랜드, 소매가, 가용 수량을 포맷하여 반환한다", () => {
    const items = buildInfoItems(base);
    expect(items).toEqual([
      { label: "브랜드", value: "Macallan" },
      { label: "소매가", value: "120,000원" },
      { label: "가용 수량", value: "5병" },
    ]);
  });

  it("빠진 필드(undefined)는 항목에서 제외한다", () => {
    const items = buildInfoItems({
      ...base,
      price: undefined,
      supplyPrice: undefined,
      availableQuantity: undefined,
    });
    expect(items).toEqual([{ label: "브랜드", value: "Macallan" }]);
  });

  it("hideAvailableQuantity 옵션이 true면 가용 수량 항목을 제외한다", () => {
    const items = buildInfoItems(base, { hideAvailableQuantity: true });
    expect(items).toEqual([
      { label: "브랜드", value: "Macallan" },
      { label: "소매가", value: "120,000원" },
    ]);
  });

  it("비즈니스 회원에게 소매가와 공급가를 함께 보여준다", () => {
    const items = buildInfoItems(base, { hasBusinessRole: true });
    expect(items).toEqual([
      { label: "브랜드", value: "Macallan" },
      { label: "소매가", value: "120,000원" },
      { label: "공급가", value: "100,000원" },
      { label: "가용 수량", value: "5병" },
    ]);
  });

  it("비즈니스 회원에게 공급가가 없어도 소매가는 보여준다", () => {
    const items = buildInfoItems({ ...base, supplyPrice: undefined }, { hasBusinessRole: true });
    expect(items).toEqual([
      { label: "브랜드", value: "Macallan" },
      { label: "소매가", value: "120,000원" },
      { label: "가용 수량", value: "5병" },
    ]);
  });
});
