import { renderHook } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCountdownTimer } from "./useCountdownTimer";
import { useServerClock } from "./useServerClock";

vi.mock("./useServerClock", () => ({
  useServerClock: vi.fn(),
}));

const mockedUseServerClock = vi.mocked(useServerClock);

function makeNotice(overrides: { reservationStartAt?: string; reservationEndAt?: string }) {
  return { reservationStartAt: overrides.reservationStartAt, reservationEndAt: overrides.reservationEndAt };
}

describe("useCountdownTimer", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("서버 동기화 시각 기준으로 status를 계산한다 (로컬 시계 조작은 영향을 주지 않는다)", () => {
    // 로컬 시계는 이미 예약 시작 이후로 조작되어 있다고 가정
    vi.setSystemTime(new Date("2026-01-15T00:00:00.000Z"));

    // 하지만 서버 동기화 시각은 아직 예약 시작 전이다
    const serverNow = new Date("2026-01-05T00:00:00.000Z").getTime();
    mockedUseServerClock.mockReturnValue({ getNow: () => serverNow, isSynced: true });

    const notice = makeNotice({
      reservationStartAt: "2026-01-10T00:00:00.000Z",
      reservationEndAt: "2026-01-20T00:00:00.000Z",
    });

    const { result } = renderHook(() => useCountdownTimer(notice as never));

    expect(result.current.status).toBe("pending");
  });

  it("1초마다 서버 동기화 시각을 다시 읽어 timeRemaining을 갱신한다", () => {
    vi.useFakeTimers();

    let serverNow = new Date("2026-01-09T23:59:58.000Z").getTime();
    mockedUseServerClock.mockReturnValue({ getNow: () => serverNow, isSynced: true });

    const notice = makeNotice({
      reservationStartAt: "2026-01-10T00:00:00.000Z",
      reservationEndAt: "2026-01-20T00:00:00.000Z",
    });

    const { result } = renderHook(() => useCountdownTimer(notice as never));

    expect(result.current.timeRemaining).toBe("00일 00시간 00분 02초");

    serverNow = new Date("2026-01-09T23:59:59.000Z").getTime();
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timeRemaining).toBe("00일 00시간 00분 01초");
  });

  it("status가 closed면 더 이상 인터벌을 돌리지 않는다", () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

    const serverNow = new Date("2026-01-25T00:00:00.000Z").getTime();
    mockedUseServerClock.mockReturnValue({ getNow: () => serverNow, isSynced: true });

    const notice = makeNotice({
      reservationStartAt: "2026-01-10T00:00:00.000Z",
      reservationEndAt: "2026-01-20T00:00:00.000Z",
    });

    const { result } = renderHook(() => useCountdownTimer(notice as never));

    expect(result.current.status).toBe("closed");
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });
});
