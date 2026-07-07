import { describe, expect, it, vi } from "vitest";
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

  it("종료 시각 정각이면 closed를 반환한다", () => {
    const now = new Date("2026-01-20T00:00:00.000Z").getTime();
    expect(getNoticeStatus(notice, now)).toBe("closed");
  });

  it("now를 넘기지 않으면 Date.now() 기준으로 판단한다", () => {
    const past = { reservationStartAt: "2000-01-01T00:00:00.000Z", reservationEndAt: "2000-01-02T00:00:00.000Z" };
    expect(getNoticeStatus(past)).toBe("closed");
  });

  it("타임존 오프셋이 없는 문자열은 서버 프로세스 타임존과 무관하게 KST로 해석한다", () => {
    // 백엔드가 내려주는 reservationStartAt/EndAt은 오프셋이 없는 문자열(예: "2026-07-06T10:40:00")이다.
    // 배포 환경(예: Vercel)의 서버 프로세스는 TZ=UTC로 동작하는 경우가 많아,
    // 오프셋 없는 문자열을 UTC로 해석하면 KST 대비 9시간 밀리는 결과가 나온다.
    const naiveNotice = { reservationStartAt: "2026-07-06T10:40:00", reservationEndAt: "2026-07-22T00:00:00" };
    // 2026-07-06T10:40:00+09:00 (KST 기준 정확히 시작 시각) === 2026-07-06T01:40:00Z
    const nowAtKstStart = Date.UTC(2026, 6, 6, 1, 40, 0);

    vi.stubEnv("TZ", "UTC");
    try {
      expect(getNoticeStatus(naiveNotice, nowAtKstStart)).toBe("active");
    } finally {
      vi.unstubAllEnvs();
    }
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
