import { describe, expect, it } from "vitest";
import { calculateTimeRemaining, getNoticeStatus } from "./utils";

describe("getNoticeStatus", () => {
  const notice = {
    reservationStartAt: "2026-01-10T00:00:00.000Z",
    reservationEndAt: "2026-01-20T00:00:00.000Z",
  };

  it("시작 전이면 pending을 반환한다", () => {
    const now = new Date("2026-01-05T00:00:00.000Z").getTime();
    expect(getNoticeStatus(notice, now)).toBe("pending");
  });

  it("시작~종료 사이면 active를 반환한다", () => {
    const now = new Date("2026-01-15T00:00:00.000Z").getTime();
    expect(getNoticeStatus(notice, now)).toBe("active");
  });

  it("종료 이후면 closed를 반환한다", () => {
    const now = new Date("2026-01-25T00:00:00.000Z").getTime();
    expect(getNoticeStatus(notice, now)).toBe("closed");
  });

  it("now를 넘기지 않으면 Date.now() 기준으로 판단한다", () => {
    const past = { reservationStartAt: "2000-01-01T00:00:00.000Z", reservationEndAt: "2000-01-02T00:00:00.000Z" };
    expect(getNoticeStatus(past)).toBe("closed");
  });
});

describe("calculateTimeRemaining", () => {
  it("남은 시간을 일/시/분/초로 포맷한다", () => {
    const now = new Date("2026-01-01T00:00:00.000Z").getTime();
    const target = new Date("2026-01-02T01:02:03.000Z");
    expect(calculateTimeRemaining(target, now)).toBe("01일 01시간 02분 03초");
  });

  it("목표 시각이 지났으면 0으로 표기한다", () => {
    const now = new Date("2026-01-05T00:00:00.000Z").getTime();
    const target = new Date("2026-01-01T00:00:00.000Z");
    expect(calculateTimeRemaining(target, now)).toBe("00일 00시간 00분 00초");
  });
});
